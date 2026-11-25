# Bitácora de incrementos y cambios — Nowst

Criterio 2 del RdA 1 — Arquitectura de Software

El registro relaciona los cambios del repositorio con los casos de uso, reglas y escenarios de calidad del Criterio 1. Las fechas deben corresponder al historial real de Git (`git log --date=short --pretty=format:"%h | %ad | %s"`).

| Fecha real | Commit | Incremento | Drivers atendidos | Archivos o componentes | Verificación y resultado | Pendientes |
|---|---|---|---|---|---|---|
| 2026-11-23 | `803eee2` | Estructura base | Base de arquitectura para CU-01 a CU-04 | `src/`, `.gitignore`, `.env.example`, `package.json` | Commit inicial y publicación comprobados. No se ejecutaron pruebas funcionales en esta etapa. | Configurar servidor y persistencia. |
| 2026-11-23 | `85687d8` | Configuración del servidor y base de datos | CU-01 a CU-04; soporte de QA-05 | `app.js`, `server.js`, repositorio SQLite, configuración y dependencias | Inicio de servidor y creación de base local con tres salas; publicación comprobada. | Implementar consultas y cotizaciones. |
| 2026-11-24 | `bcd5f13` | Consulta de salas y cálculo de precios | CU-01, CU-02; R-01, R-03, R-04; QA-01, QA-02, QA-07 | `NowstService.js`, `NowstRepository.js`, `routes.js`, `app.js`, `server.js` | Consulta de disponibilidad comprobada en Postman. Se corrigió el error por no estar disponible `hayReserva()` y se volvió a ejecutar la consulta. | Implementar reservas y administración; sugerir horarios alternativos. |
| 2026-11-25 | `6006884` | Gestión de reservas y permisos | CU-03, CU-04; R-01 a R-04; QA-03, QA-04, QA-06, QA-07 | Servicio, repositorio, rutas y `.env.example` | Pruebas manuales de reservas y permisos confirmadas por el desarrollador. Se corrigió el envío de la clave en Params trasladándola a Headers. | Automatizar pruebas y documentar API. |
| 2026-11-25 | `6b2180a` | Contrato API y pruebas automatizadas | CU-01 a CU-04; QA-01, QA-02, QA-03, QA-04, QA-06, QA-07 (verificación funcional parcial) | `docs/openapi.yaml`, `tests/nowst.test.js`, colección Postman y servicio | Se prepararon 5 pruebas automatizadas (2 unitarias, 3 de integración). Resultado de `npm test`: COMPLETAR con el resultado real. | Documentación final; metas cuantitativas pendientes. |
| 2026-11-25 | Commit de documentación | Documentación y bitácora final | Trazabilidad CU-01 a CU-04 y R-01 a R-04 | `README.md`, `docs/bitacora.md` | Revisión de instrucciones y ejecución final: COMPLETAR con resultado real. | Mejoras futuras de seguridad, rendimiento y disponibilidad. |
| 2026-11-25 | Pendiente | Implementación de interfaz web | CU-01, CU-02, CU-03, CU-04 | `public/`, `app.js`, `README.md` | Verificación de funcionalidades mediante la interfaz web conectada a la API REST. | Mejorar el diseño y la experiencia del usuario. |

## Trazabilidad de escenarios de calidad

| Driver | Implementación / evidencia | Alcance de validación |
|---|---|---|
| QA-01 | Consulta de salas y alternativas | Prueba funcional de integración; p95 bajo carga no medido. |
| QA-02 | Cálculo de precio por tarifa, personas y tiempo | Prueba unitaria de precio y comprobación HTTP tras cambiar tarifa; p95 y 100 cálculos no acreditados. |
| QA-03 | Consulta de reservas propias y rechazo de cancelación ajena | Prueba de integración de acceso ajeno; no se ejecutaron los 100 intentos propuestos. |
| QA-04 | Control de permisos administrativos | Prueba de integración de estudiante y administrador; no se ejecutaron los 100 intentos propuestos. |
| QA-05 | Ruta `/health` e inicio del servidor | Comprobación local; disponibilidad de 30 días no medida. |
| QA-06 | Transacción y detección de horarios superpuestos | Prueba de integración secuencial; no se ejecutaron 100 pares concurrentes. |
| QA-07 | Validación de aforo y horarios | Prueba unitaria de aforo y consulta fuera de horario; no se acreditaron las 100 reservas inválidas propuestas. |

## Pendientes y mejoras futuras

- Mejorar el sistema de autenticación de usuarios.
- Realizar pruebas de rendimiento y concurrencia.
- Validar las tarifas y horarios del establecimiento.
- Mejorar el diseño de la interfaz web.