const elemento = id => document.getElementById(id);

// Realizar peticiones a nuestra API
async function peticion(ruta, metodo = 'GET', datos, clave) {

    const opciones = {
        method: metodo,
        headers: {}
    };

    if (clave) {
        opciones.headers['x-api-key'] = clave;
    }

    if (datos !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch(ruta, opciones);
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(respuesta.status + ': ' + resultado.error);
    }

    return resultado;
}

// Mostrar mensajes de éxito o error
function mostrarMensaje(id, mensaje, error = false) {
    elemento(id).textContent = mensaje;
    elemento(id).className = error ? 'error' : 'exito';
}

// Convertir horas a minutos
function minutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

// Obtener la clave del estudiante
function claveEstudiante() {
    const clave = elemento('claveEstudiante').value;

    if (!clave) {
        throw new Error('Ingrese su clave en Mis reservas');
    }

    return clave;
}

// Crear textos y botones para las tarjetas
function agregarTexto(contenedor, etiqueta, texto) {
    const nuevo = document.createElement(etiqueta);
    nuevo.textContent = texto;
    contenedor.appendChild(nuevo);
    return nuevo;
}

function agregarBoton(contenedor, texto, accion) {
    const boton = document.createElement('button');
    boton.textContent = texto;
    boton.addEventListener('click', accion);
    contenedor.appendChild(boton);
    return boton;
}

// Consultar salas disponibles
elemento('formBuscar').addEventListener('submit', async e => {
    e.preventDefault();

    const datos = {
        fecha: elemento('fecha').value,
        inicio: elemento('inicio').value,
        fin: elemento('fin').value,
        personas: Number(elemento('personas').value)
    };

    elemento('salas').replaceChildren();

    try {
        const parametros = new URLSearchParams(datos);

        const resultado = await peticion(
            '/api/salas?' + parametros
        );

        mostrarMensaje('mensajeSalas', resultado.mensaje);

        resultado.salas.forEach(sala => {
            mostrarSala(sala, datos);
        });

        // Mostrar horarios alternativos
        if (resultado.alternativas) {

            resultado.alternativas.forEach(alternativa => {
                mostrarSala(
                    {
                        id: alternativa.salaId,
                        nombre: alternativa.sala
                    },
                    {
                        ...datos,
                        fecha: alternativa.fecha,
                        inicio: alternativa.inicio,
                        fin: alternativa.fin
                    }
                );
            });
        }

    } catch (error) {
        mostrarMensaje('mensajeSalas', error.message, true);
    }
});

// Mostrar una sala en una tarjeta
function mostrarSala(sala, datos) {

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';

    agregarTexto(tarjeta, 'h4', sala.nombre);

    if (sala.capacidad !== undefined) {
        agregarTexto(tarjeta, 'p',
            'Capacidad: ' + sala.capacidad + ' personas');
    }

    if (sala.tarifaHoraPersona !== undefined) {
        agregarTexto(tarjeta, 'p',
            '$' + sala.tarifaHoraPersona + ' por persona/hora'
        ).className = 'precio';
    }

    agregarTexto(tarjeta, 'p',
        datos.fecha + ' | ' + datos.inicio + ' - ' + datos.fin);

    agregarBoton(tarjeta, 'Cotizar', () => {
        cotizar(sala.id, datos);
    });

    agregarBoton(tarjeta, 'Reservar', () => {
        reservar(sala.id, datos);
    });

    elemento('salas').appendChild(tarjeta);
}

// Calcular el precio del alquiler
async function cotizar(salaId, datos) {

    try {
        const horas = (
            minutos(datos.fin) - minutos(datos.inicio)
        ) / 60;

        const resultado = await peticion(
            '/api/cotizaciones',
            'POST',
            {
                salaId,
                personas: datos.personas,
                horas
            }
        );

        mostrarMensaje(
            'mensajeSalas',
            resultado.sala + ' - Total: $' +
            resultado.total.toFixed(2)
        );

    } catch (error) {
        mostrarMensaje('mensajeSalas', error.message, true);
    }
}

// Crear una reserva
async function reservar(salaId, datos) {

    try {
        const clave = claveEstudiante();

        const resultado = await peticion(
            '/api/reservas',
            'POST',
            {
                salaId,
                ...datos
            },
            clave
        );

        mostrarMensaje(
            'mensajeSalas',
            'Reserva confirmada. Total: $' +
            resultado.total.toFixed(2)
        );

        // Buscar nuevamente para actualizar disponibilidad
        elemento('salas').replaceChildren();

    } catch (error) {
        mostrarMensaje('mensajeSalas', error.message, true);
    }
}

// Consultar reservas del estudiante
async function consultarReservas() {

    elemento('reservas').replaceChildren();

    try {
        const resultado = await peticion(
            '/api/reservas',
            'GET',
            undefined,
            claveEstudiante()
        );

        mostrarMensaje(
            'mensajeReservas',
            resultado.length
                ? 'Reservas encontradas: ' + resultado.length
                : 'No tiene reservas registradas'
        );

        resultado.forEach(reserva => {

            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta';

            agregarTexto(tarjeta, 'h4',
                'Sala ' + reserva.sala_id);

            agregarTexto(tarjeta, 'p',
                'Fecha: ' + reserva.fecha);

            agregarTexto(tarjeta, 'p',
                'Horario: ' + reserva.inicio + ' - ' + reserva.fin);

            agregarTexto(tarjeta, 'p',
                'Personas: ' + reserva.personas);

            agregarTexto(tarjeta, 'p',
                'Total: $' + reserva.total.toFixed(2));

            agregarTexto(tarjeta, 'p',
                'Estado: ' + reserva.estado);

            if (reserva.estado === 'confirmada') {
                agregarBoton(tarjeta, 'Cancelar reserva', () => {
                    cancelarReserva(reserva.id);
                }).className = 'cancelar';
            }

            elemento('reservas').appendChild(tarjeta);
        });

    } catch (error) {
        mostrarMensaje('mensajeReservas', error.message, true);
    }
}

elemento('btnReservas').addEventListener(
    'click', consultarReservas
);

// Cancelar una reserva
async function cancelarReserva(id) {

    if (!confirm('¿Desea cancelar esta reserva?')) {
        return;
    }

    try {
        await peticion(
            '/api/reservas/' + id + '/cancelar',
            'PATCH',
            undefined,
            claveEstudiante()
        );

        await consultarReservas();

    } catch (error) {
        mostrarMensaje('mensajeReservas', error.message, true);
    }
}

// Actualizar datos de una sala
elemento('formAdmin').addEventListener('submit', async e => {
    e.preventDefault();

    const datos = {};

    const tarifa = elemento('tarifaAdmin').value;
    const capacidad = elemento('capacidadAdmin').value;
    const abre = elemento('abreAdmin').value;
    const cierra = elemento('cierraAdmin').value;

    if (tarifa) datos.tarifaHoraPersona = Number(tarifa);
    if (capacidad) datos.capacidad = Number(capacidad);
    if (abre) datos.abre = abre;
    if (cierra) datos.cierra = cierra;

    if (Object.keys(datos).length === 0) {
        mostrarMensaje('mensajeAdmin',
            'Ingrese al menos un dato para modificar', true);
        return;
    }

    try {
        const resultado = await peticion(
            '/api/admin/salas/' + elemento('salaAdmin').value,
            'PATCH',
            datos,
            elemento('claveAdmin').value
        );

        mostrarMensaje(
            'mensajeAdmin',
            resultado.nombre + ' actualizada correctamente'
        );

        elemento('salas').replaceChildren();

    } catch (error) {
        mostrarMensaje('mensajeAdmin', error.message, true);
    }
});

// Colocar automáticamente la fecha de mañana
const manana = new Date();
manana.setDate(manana.getDate() + 1);

elemento('fecha').value =
    manana.getFullYear() + '-' +
    String(manana.getMonth() + 1).padStart(2, '0') + '-' +
    String(manana.getDate()).padStart(2, '0');