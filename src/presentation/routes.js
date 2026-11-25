import { Router } from 'express';

export function crearRutas(servicio) {

    const router = Router();

    // Consultar salas disponibles
    router.get('/salas', (req, res) => {
        const resultado = servicio.consultarSalas(req.query);
        res.status(200).json(resultado);
    });

    // Calcular precio
    router.post('/cotizaciones', (req, res) => {
        const resultado = servicio.calcularPrecio(req.body || {});
        res.status(200).json(resultado);
    });

    // Crear reserva
    router.post('/reservas', (req, res) => {
        const usuario = servicio.autenticar(
            req.headers['x-api-key'], 'estudiante'
        );

        const resultado = servicio.crearReserva(
            req.body || {}, usuario
        );

        res.status(201).json(resultado);
    });

    // Consultar reservas propias
    router.get('/reservas', (req, res) => {
        const usuario = servicio.autenticar(
            req.headers['x-api-key'], 'estudiante'
        );

        const resultado = servicio.consultarReservas(usuario);

        res.status(200).json(resultado);
    });

    // Cancelar reserva
    router.patch('/reservas/:id/cancelar', (req, res) => {
        const usuario = servicio.autenticar(
            req.headers['x-api-key'], 'estudiante'
        );

        const resultado = servicio.cancelarReserva(
            req.params.id, usuario
        );

        res.status(200).json(resultado);
    });

    // Actualizar salas y tarifas
    router.patch('/admin/salas/:id', (req, res) => {
        servicio.autenticar(
            req.headers['x-api-key'], 'administrador'
        );

        const resultado = servicio.actualizarSala(
            req.params.id, req.body || {}
        );

        res.status(200).json(resultado);
    });

    return router;
}