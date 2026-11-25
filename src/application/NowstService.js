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

        return {
            mensaje: disponibles.length > 0
                ? 'Salas disponibles'
                : 'No hay salas disponibles. Intente otro horario',
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
}