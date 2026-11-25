import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class NowstRepository {

    constructor(archivo) {
        if (archivo !== ':memory:') {
            mkdirSync(dirname(archivo), { recursive: true });
        }

        this.db = new DatabaseSync(archivo);
        this.db.exec('PRAGMA foreign_keys = ON');
        this.crearTablas();
    }

    crearTablas() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS salas (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                capacidad INTEGER NOT NULL,
                tarifa REAL NOT NULL,
                abre TEXT NOT NULL,
                cierra TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reservas (
                id TEXT PRIMARY KEY,
                sala_id INTEGER NOT NULL REFERENCES salas(id),
                usuario_id TEXT NOT NULL,
                fecha TEXT NOT NULL,
                inicio TEXT NOT NULL,
                fin TEXT NOT NULL,
                personas INTEGER NOT NULL,
                total REAL NOT NULL,
                estado TEXT NOT NULL DEFAULT 'confirmada'
            );
        `);

        const cantidad = this.db.prepare(
            'SELECT COUNT(*) AS n FROM salas'
        ).get().n;

        if (cantidad === 0) {
            const insertar = this.db.prepare(`
                INSERT INTO salas
                (id, nombre, capacidad, tarifa, abre, cierra)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            insertar.run(1, 'Sala Silencio', 2, 2.00, '08:00', '20:00');
            insertar.run(2, 'Sala Equipo', 6, 1.50, '08:00', '22:00');
            insertar.run(3, 'Sala Taller', 10, 1.25, '09:00', '21:00');
        }
    }

    listarSalas() {
        return this.db.prepare(`
            SELECT id, nombre, capacidad,
                   tarifa AS tarifaHoraPersona,
                   abre, cierra
            FROM salas ORDER BY id
        `).all();
    }
    buscarSala(id) {
    return this.db.prepare(`
        SELECT id, nombre, capacidad,
               tarifa AS tarifaHoraPersona,
               abre, cierra
        FROM salas
        WHERE id = ?
    `).get(id);
    }

    hayReserva(salaId, fecha, inicio, fin) {
        const reserva = this.db.prepare(`
            SELECT id FROM reservas
            WHERE sala_id = ?
            AND fecha = ?
            AND estado = 'confirmada'
            AND inicio < ?
            AND fin > ?
        `).get(salaId, fecha, fin, inicio);

        return reserva !== undefined;
    }

    cerrar() {
        this.db.close();
    }
}