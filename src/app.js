import express from 'express';
import { crearRutas } from './presentation/routes.js';
import { NowstService } from './application/NowstService.js';

export function crearApp(repositorio) {

    const app = express();

    app.use(express.json());

    const servicio = new NowstService(repositorio);

    app.get('/health', (req, res) => {
        res.json({
            estado: 'ok',
            proyecto: 'Nowst'
        });
    });

    app.use('/api', crearRutas(servicio));

    app.use((error, req, res, next) => {
        console.error(error);
        res.status(error.status || 500).json({
            error: error.status
                ? error.message
                : 'Error interno del servidor'
        });
    });

    return app;
}