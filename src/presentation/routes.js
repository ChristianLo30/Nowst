import { Router } from 'express';

export function crearRutas(servicio) {

    const router = Router();

    // Consultar salas disponibles
    router.get('/salas', (req, res) => {
        const resultado = servicio.consultarSalas(req.query);
        res.status(200).json(resultado);
    });

    // Calcular precio del alquiler
    router.post('/cotizaciones', (req, res) => {
        const resultado = servicio.calcularPrecio(req.body);
        res.status(200).json(resultado);
    });

    return router;
}