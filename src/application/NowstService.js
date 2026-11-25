import { randomUUID } from 'node:crypto';
export class NowstService {

    constructor(repositorio) {
        this.repositorio = repositorio;
    }

    error(mensaje, estado = 400) {
        const error = new Error(mensaje);
        error.status = estado;
        throw error;
    }

    consultarSalas(datos) {
        const { fecha, inicio, fin } = datos;
        const personas = Number(datos.personas);

        if (!fecha || !inicio || !fin) {
            this.error('Debe ingresar fecha y horario');
        }

        const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
            && !isNaN(Date.parse(fecha))
            && new Date(fecha).toISOString().slice(0, 10) === fecha;

        if (!fechaValida) {
            this.error('Fecha invalida');
        }

        const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (!formatoHora.test(inicio) ||
            !formatoHora.test(fin) || inicio >= fin) {
            this.error('Horario invalido');
        }

        if (!Number.isInteger(personas) || personas <= 0) {
            this.error('Cantidad de personas invalida');
        }

        const salas = this.repositorio.listarSalas();

        const disponibles = salas.filter(sala =>
            sala.capacidad >= personas &&
            inicio >= sala.abre &&
            fin <= sala.cierra &&
            !this.repositorio.hayReserva(
                sala.id, fecha, inicio, fin
            )
        );

        if (disponibles.length === 0) {
            return {
                mensaje: 'No hay salas disponibles. Intente otro horario',
                salas: [],
                alternativas: this.sugerirHorarios(
                    fecha, inicio, fin, personas
                )
            };
        }

        return {
            mensaje: 'Salas disponibles',
            salas: disponibles
        };
    }

    calcularPrecio(datos) {
        const salaId = Number(datos.salaId);
        const personas = Number(datos.personas);
        const horas = Number(datos.horas);

        if (!Number.isInteger(salaId) || salaId <= 0 ||
            !Number.isInteger(personas) || personas <= 0 ||
            !Number.isFinite(horas) || horas <= 0 || horas > 24) {
            this.error('Datos invalidos');
        }

        const sala = this.repositorio.buscarSala(salaId);

        if (!sala) {
            this.error('Sala no encontrada', 404);
        }

        if (personas > sala.capacidad) {
            this.error('Se supera la capacidad de la sala');
        }

        const total = sala.tarifaHoraPersona * personas * horas;

        return {
            sala: sala.nombre,
            personas,
            horas,
            tarifa: sala.tarifaHoraPersona,
            total: Number(total.toFixed(2))
        };
    }
    autenticar(clave, rol) {
    let usuario;

    if (!clave) {
        this.error('Debe ingresar una clave de acceso', 401);
    }

    if (clave === process.env.CLAVE_CHRISTIAN) {
        usuario = { id: 'christian', rol: 'estudiante' };

    } else if (clave === process.env.CLAVE_JAVIER) {
        usuario = { id: 'javier', rol: 'estudiante' };

    } else if (clave === process.env.CLAVE_ADMIN) {
        usuario = { id: 'admin', rol: 'administrador' };

    } else {
        this.error('Clave de acceso invalida', 401);
    }

    if (usuario.rol !== rol) {
        this.error('No tiene permisos para esta operacion', 403);
    }

    return usuario;
    }

    convertirMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);

    return h * 60 + m;
    }
    crearReserva(datos, usuario) {
    const salaId = Number(datos.salaId);
    const personas = Number(datos.personas);
    const { fecha, inicio, fin } = datos;

    return this.repositorio.transaccion(() => {

        const consulta = this.consultarSalas(datos);

        const sala = this.repositorio.buscarSala(salaId);

        if (!sala) {
            this.error('Sala no encontrada', 404);
        }

        if (personas > sala.capacidad) {
            this.error('Se supera la capacidad de la sala');
        }

        if (inicio < sala.abre || fin > sala.cierra) {
            this.error('Reserva fuera del horario permitido');
        }

        const disponible = consulta.salas.some(
            espacio => espacio.id === salaId
        );

        if (!disponible) {
            this.error('La sala ya esta reservada en ese horario', 409);
        }

        const horas = (
            this.convertirMinutos(fin) -
            this.convertirMinutos(inicio)
        ) / 60;

        const precio = this.calcularPrecio({
            salaId,
            personas,
            horas
        });

        const reserva = {
            id: randomUUID(),
            salaId,
            usuarioId: usuario.id,
            fecha,
            inicio,
            fin,
            personas,
            total: precio.total
        };

        return this.repositorio.guardarReserva(reserva);
    });
    }
    consultarReservas(usuario) {
    return this.repositorio.listarReservas(usuario.id);
    }
    cancelarReserva(id, usuario) {
    return this.repositorio.transaccion(() => {

        const reserva = this.repositorio.buscarReserva(id);

        if (!reserva) {
            this.error('Reserva no encontrada', 404);
        }

        if (reserva.usuario_id !== usuario.id) {
            this.error('No puede cancelar una reserva ajena', 403);
        }

        if (reserva.estado === 'cancelada') {
            this.error('La reserva ya esta cancelada', 409);
        }

        return this.repositorio.cancelarReserva(id);
    });
    }
    actualizarSala(id, datos) {
    return this.repositorio.transaccion(() => {

        const sala = this.repositorio.buscarSala(Number(id));

        if (!sala) {
            this.error('Sala no encontrada', 404);
        }

        const nuevaSala = {
            capacidad: Number(
                datos.capacidad ?? sala.capacidad
            ),
            tarifaHoraPersona: Number(
                datos.tarifaHoraPersona ?? sala.tarifaHoraPersona
            ),
            abre: datos.abre ?? sala.abre,
            cierra: datos.cierra ?? sala.cierra
        };

        const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (!Number.isInteger(nuevaSala.capacidad) ||
            nuevaSala.capacidad <= 0 ||
            !Number.isFinite(nuevaSala.tarifaHoraPersona) ||
            nuevaSala.tarifaHoraPersona <= 0 ||
            !formatoHora.test(nuevaSala.abre) ||
            !formatoHora.test(nuevaSala.cierra) ||
            nuevaSala.abre >= nuevaSala.cierra) {

            this.error('Datos de la sala invalidos');
        }

        const reservas = this.repositorio.reservasActivasSala(id);

        const conflicto = reservas.some(reserva =>
            reserva.personas > nuevaSala.capacidad ||
            reserva.inicio < nuevaSala.abre ||
            reserva.fin > nuevaSala.cierra
        );

        if (conflicto) {
            this.error('El cambio afecta reservas existentes', 409);
        }

        return this.repositorio.actualizarSala(
            Number(id), nuevaSala
        );
    });
    }
    sugerirHorarios(fecha, inicio, fin, personas) {

    const duracion = this.convertirMinutos(fin)
        - this.convertirMinutos(inicio);

    const alternativas = [];
    const salas = this.repositorio.listarSalas();

    const formato = minutos => {
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;

        return String(h).padStart(2, '0') + ':' +
               String(m).padStart(2, '0');
    };

    for (const sala of salas) {

        if (sala.capacidad < personas) {
            continue;
        }

        const apertura = this.convertirMinutos(sala.abre);
        const cierre = this.convertirMinutos(sala.cierra);

        for (let hora = apertura;
             hora + duracion <= cierre;
             hora += 30) {

            const nuevoInicio = formato(hora);
            const nuevoFin = formato(hora + duracion);

            if (!this.repositorio.hayReserva(
                sala.id, fecha, nuevoInicio, nuevoFin
            )) {
                alternativas.push({
                    salaId: sala.id,
                    sala: sala.nombre,
                    fecha,
                    inicio: nuevoInicio,
                    fin: nuevoFin
                });
            }

            if (alternativas.length === 3) {
                return alternativas;
            }
        }
    }

    return alternativas;
    }
    

}