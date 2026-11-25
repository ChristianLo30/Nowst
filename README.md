# Nowst API

API REST para consultar espacios de estudio disponibles, calcular el costo del alquiler, realizar reservas y administrar salas y tarifas.

## Tecnologías

JavaScript, Node.js, Express, SQLite, OpenAPI y Postman.

## Instalación y ejecución

Requisito: Node.js 22.13 o superior.

```powershell
git clone https://github.com/ChristianLo30/Nowst.git
cd Nowst
npm ci
Copy-Item .env.example .env
npm run dev
```

El servidor inicia en `http://localhost:3000`. La base de datos SQLite se crea automáticamente. Las claves de demostración se configuran en `.env`.

## Arquitectura

El proyecto utiliza un monolito en tres capas:

- **Presentación:** recibe solicitudes HTTP y devuelve respuestas.
- **Aplicación:** contiene las reglas de negocio y validaciones.
- **Persistencia:** gestiona las consultas y los datos en SQLite.

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Estado del servidor |
| GET | `/api/salas` | Consultar disponibilidad |
| POST | `/api/cotizaciones` | Calcular precio |
| POST | `/api/reservas` | Crear reserva |
| GET | `/api/reservas` | Consultar reservas propias |
| PATCH | `/api/reservas/:id/cancelar` | Cancelar reserva |
| PATCH | `/api/admin/salas/:id` | Actualizar sala |

Las rutas de reservas y administración requieren el encabezado `x-api-key` con la clave del rol correspondiente.

## Pruebas

```powershell
npm test
```

El proyecto incluye cinco pruebas automatizadas (dos unitarias y tres de integración) mediante `node:test`, integrado en Node.js. Las pruebas de integración utilizan SQLite en memoria.

## Interfaz web

El proyecto incluye una interfaz desarrollada con HTML,
CSS y JavaScript que consume los endpoints de la API.

Para acceder, ejecutar `npm run dev` y abrir:

http://localhost:3000


## Documentación

- [Contrato OpenAPI](docs/openapi.yaml)
- [Colección Postman](postman/Nowst.postman_collection.json): importar y configurar las claves y la fecha de prueba.
- [Bitácora de incrementos](docs/bitacora.md)
