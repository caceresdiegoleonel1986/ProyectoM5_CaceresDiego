# Checklist de producción

Completar en cada release. No marcar una verificación manual sin haberla realizado.

- Fecha:
- Versión / commit:
- Responsable:
- URL desplegada:

| Área | Qué verificar | Señal de OK | Estado |
|---|---|---|---|
| Build y deploy | `npm run build` pasa en local. | Build sin errores y consola del navegador limpia durante la prueba rápida. | [ ] |
| Build y deploy | Deploy en Vercel sin errores de build. | Build log en verde. | [ ] |
| Build y deploy | Si cambiaron variables de entorno, hacer redeploy. | El timestamp del deploy es posterior al cambio; marcar N/A si no hubo cambios. | [ ] |
| Variables de entorno: seguridad | Las variables `VITE_*` contienen solo configuración pública. | Ninguna clave AWS ni token privado tiene prefijo `VITE_`. | [ ] |
| Variables de entorno: seguridad | AWS keys y secretos están solo en el entorno serverless, sin prefijo `VITE_`. | Solo están disponibles para Vercel Functions y no aparecen en el bundle del cliente. | [ ] |
| Variables de entorno: seguridad | No hay secretos hardcodeados en archivos versionados ni en el historial. | Ejecutar un escáner general de secretos y revisar hallazgos; la búsqueda AWS de abajo es solo un control complementario. | [ ] |
| Flujos críticos | Login y logout funcionan en la URL pública. | El usuario entra y sale sin errores. | [ ] |
| Flujos críticos | Un usuario sin rol admin no accede a pantallas de administración. | Probar en incógnito sin permisos: redirige o bloquea. | [ ] |
| Flujos críticos | El catálogo lista productos y muestra el detalle. | Los productos se ven y el detalle carga. | [ ] |
| Flujos críticos | El carrito permite agregar, quitar y actualizar cantidades. | Los totales cambian como se espera. | [ ] |
| Flujos críticos | Checkout crea una orden una sola vez, incluso ante doble click. | Hay una sola orden en la base de datos. | [ ] |
| Flujos críticos | Customer ve sus órdenes y admin ve las que corresponden. | Cada rol ve solo los datos permitidos. | [ ] |
| Flujos críticos | Upload, si aplica: la imagen se sube, su URL persiste y se ve. | La imagen aparece en el catálogo después de crear el producto. | [ ] |
| Seguridad Firestore | Las rules bloquean lecturas y escrituras indebidas por rol. | Una operación sin permiso devuelve error. | [ ] |
| Seguridad Firestore | Las queries con `orderBy(createdAt)` funcionan con los datos desplegados. | El listado carga sin errores de timestamp o índice en consola. | [ ] |
| Calidad: tests | `npm run test` pasa localmente. | Todos los tests quedan en verde. | [ ] |
| Calidad: tests | La suite cubre reducer, hook o componente y al menos un flow test. | Hay tests para las tres capas. | [ ] |
| Calidad: tests | Los tests no dependen de una red real. | Pasan con el wifi desconectado. | [ ] |
| Debugging | Si algo falla, revisar Network: status y endpoint. | Se identifica el request que falla y su código de estado. | [ ] |
| Debugging | Si algo falla, revisar Vercel Logs: Functions y Runtime. | El error permite identificar la variable o permiso faltante. | [ ] |

## Criterios de calidad del producto

Revisar también estos criterios cuando cambie el área correspondiente y confirmar antes del release que no haya regresiones.

| Área | Qué verificar | Señal de OK | Estado |
|---|---|---|---|
| Arquitectura | La implementación respeta la separación por dominio y responsabilidades. | Tipos, servicios, estado, UI, páginas y rutas están en sus módulos correspondientes; el cambio es fácil de localizar. | [ ] |
| TypeScript | El código de producción evita `any` explícitos e implícitos y conserva tipos de dominio coherentes. | `npm run build` y `npm run lint` pasan; `noImplicitAny` está habilitado y no quedan usos injustificados de `any`. | [ ] |
| Autenticación y roles | Email y Google funcionan, la sesión persiste y los guards aplican roles. | Se prueba login, logout, sesión restaurada y acceso customer/admin en la URL desplegada. | [ ] |
| Estado global | Contexts, reducers y hooks mantienen responsabilidades claras y transiciones válidas. | El cambio tiene tests de reducer y de hook o componente donde corresponda. | [ ] |
| Catálogo y órdenes | Búsqueda, filtros, debounce, carrito, checkout y persistencia de órdenes funcionan juntos. | El flujo se completa en producción y el pedido aparece una sola vez para el usuario correcto. | [ ] |
| Administración | CRUD, filtros y experiencia de admin funcionan; las imágenes cargadas quedan asociadas al producto. | Alta, edición y eliminación respetan permisos y los cambios se ven en el catálogo. | [ ] |
| Firestore | Las consultas usan filtros y límites adecuados, realtime solo donde aporta, y estados loading/error visibles. | Revisar `where`, `limit` y `onSnapshot` del flujo modificado; rules permiten solo lecturas y escrituras autorizadas. | [ ] |
| Uploads | La Function valida identidad y rol antes de firmar el POST de S3. | Prueba positiva de admin y negativa de no-admin; URL persistida y objeto visible. | [ ] |
| UI y accesibilidad | Las vistas probadas funcionan en viewport móvil y escritorio; componentes y estados visuales están tipados y reutilizados. | Sin overflow u overlap; loading, empty y error se entienden y controles clave son operables. | [ ] |
| Tests | Los cambios importantes tienen cobertura de lógica, UI y al menos un flujo integral; mocks no requieren red real. | `npm run test` pasa y el test de flujo cubre el comportamiento afectado. | [ ] |
| Evidencia de IA | La evidencia refleja usos reales en arquitectura, testing, debugging y code review, con prompts y decisiones. | Revisar [READMEAI.md](READMEAI.md); cada ejemplo explica qué se aceptó, descartó y cómo se validó. | [ ] |
| Producción y rendimiento | Build, variables protegidas y configuración de deploy están revisados; warnings de bundle tienen seguimiento. | Build local y Vercel pasan; no hay secretos en cliente y cada warning relevante tiene resolución o decisión documentada. | [ ] |

Como control complementario, buscar credenciales AWS evidentes en archivos versionados actualmente:

```sh
git grep -nE '(AKIA|ASIA)[A-Z0-9]{16}|AWS_SECRET_ACCESS_KEY=[^[:space:]<]+' -- . ':!.env.example'
```

Esta búsqueda no cubre otros tipos de secretos ni el historial de Git. Una coincidencia no siempre es un secreto: comprobar el contexto y no incluir valores reales en logs, capturas o reportes.