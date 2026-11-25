import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { crearApp } from '../src/app.js';
import { NowstRepository } from '../src/persistence/NowstRepository.js';
import { NowstService } from '../src/application/NowstService.js';

// Claves ficticias exclusivas de las pruebas.
process.env.CLAVE_CHRISTIAN = 'christian-test';
process.env.CLAVE_JAVIER = 'javier-test';
process.env.CLAVE_ADMIN = 'admin-test';
const christian = 'christian-test';
const javier = 'javier-test';
const admin = 'admin-test';

// Cada prueba de integracion utiliza una base independiente en memoria.
async function preparar(t) {
    const repo = new NowstRepository(':memory:');
    const server = crearApp(repo).listen(0, '127.0.0.1');
    t.after(async () => {
        await new Promise(resolve => server.close(resolve));
        repo.cerrar();
    });
    await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}`;

    return async function pedir(metodo, ruta, datos, clave) {
        const headers = {};
        if (clave) headers['x-api-key'] = clave;
        if (datos !== undefined) headers['Content-Type'] = 'application/json';
        const respuesta = await fetch(url + ruta, {
            method: metodo,
            headers,
            body: datos === undefined ? undefined : JSON.stringify(datos)
        });
        return { status: respuesta.status, body: await respuesta.json() };
    };
}

const fecha = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const reserva = { salaId: 2, fecha, inicio: '10:00', fin: '12:00', personas: 4 };
const salas = (inicio, fin, personas) =>
    `/api/salas?fecha=${fecha}&inicio=${inicio}&fin=${fin}&personas=${personas}`;

// Pruebas unitarias.
test('Unitaria: calcula el precio del alquiler', () => {
    const repo = { buscarSala: () => ({ nombre: 'Sala Equipo', capacidad: 6, tarifaHoraPersona: 1.5 }) };
    const servicio = new NowstService(repo);
    assert.equal(servicio.calcularPrecio({ salaId: 2, personas: 4, horas: 2 }).total, 12);
});

test('Unitaria: rechaza una cotizacion que supera el aforo', () => {
    const repo = { buscarSala: () => ({ nombre: 'Sala Equipo', capacidad: 6, tarifaHoraPersona: 1.5 }) };
    const servicio = new NowstService(repo);
    assert.throws(() => servicio.calcularPrecio({ salaId: 2, personas: 7, horas: 2 }), { status: 400 });
});

// Pruebas de integracion: HTTP, servicio y persistencia.
test('CU-01: consulta disponibilidad y horarios alternativos', async t => {
    const pedir = await preparar(t);
    const r = await pedir('GET', salas('10:00', '12:00', 4));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.salas.map(s => s.id), [2, 3]);

    const sinSalas = await pedir('GET', salas('03:00', '05:00', 4));
    assert.equal(sinSalas.status, 200);
    assert.deepEqual(sinSalas.body.salas, []);
    assert.ok(sinSalas.body.alternativas.length > 0);
});

test('CU-03: confirma reserva y rechaza conflictos y acceso ajeno', async t => {
    const pedir = await preparar(t);
    const r = await pedir('POST', '/api/reservas', reserva, christian);
    assert.equal(r.status, 201);
    assert.equal(r.body.estado, 'confirmada');
    assert.equal(r.body.total, 12);
    const propias = await pedir('GET', '/api/reservas', undefined, christian);
    assert.equal(propias.status, 200);
    assert.equal(propias.body[0].id, r.body.id);
    const ajenas = await pedir('GET', '/api/reservas', undefined, javier);
    assert.equal(ajenas.status, 200);
    assert.deepEqual(ajenas.body, []);

    const conflicto = await pedir('POST', '/api/reservas',
        { ...reserva, inicio: '11:00', fin: '13:00' }, javier);
    assert.equal(conflicto.status, 409);

    const cancelacionAjena = await pedir('PATCH',
        `/api/reservas/${r.body.id}/cancelar`, undefined, javier);
    assert.equal(cancelacionAjena.status, 403);
    const final = await pedir('GET', '/api/reservas', undefined, christian);
    assert.equal(final.body[0].estado, 'confirmada');
});

test('CU-04 y QA-04: estudiante no puede actualizar tarifas; administrador si', async t => {
    const pedir = await preparar(t);
    const ruta = '/api/admin/salas/2';
    assert.equal((await pedir('PATCH', ruta, { tarifaHoraPersona: 2.5 }, christian)).status, 403);
    const antes = await pedir('POST', '/api/cotizaciones', { salaId: 2, personas: 4, horas: 2 });
    assert.equal(antes.body.total, 12);
    const r = await pedir('PATCH', ruta, { tarifaHoraPersona: 2.5 }, admin);
    assert.equal(r.status, 200);
    assert.equal(r.body.tarifaHoraPersona, 2.5);
    const despues = await pedir('POST', '/api/cotizaciones', { salaId: 2, personas: 4, horas: 2 });
    assert.equal(despues.body.total, 20);
});
