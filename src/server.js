import { crearApp } from './app.js';
import { NowstRepository } from './persistence/NowstRepository.js';

const repositorio = new NowstRepository('data/nowst.sqlite');

const app = crearApp();
const puerto = process.env.PORT || 3000;

const servidor = app.listen(puerto, () => {
    console.log(`Servidor activo en http://localhost:${puerto}`);
    console.log('Base de datos conectada');
    console.log('Salas registradas:', repositorio.listarSalas().length);
});

process.on('SIGINT', () => {
    servidor.close(() => {
        repositorio.cerrar();
        process.exit(0);
    });
});