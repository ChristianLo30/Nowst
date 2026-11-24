import express from 'express';

export function crearApp() {
    const app = express();

    app.use(express.json());

    app.get('/health', (req, res) => {
        res.json({
            estado: 'ok',
            proyecto: 'Nowst'
        });
    });

    return app;
}