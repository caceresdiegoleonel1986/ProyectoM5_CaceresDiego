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
| Build y deploy | Redeploy luego de cambiar variables de entorno. | El timestamp del deploy es posterior al cambio. | [ ] |
| Variables de entorno: seguridad | Las variables `VITE_*` contienen solo configuración pública. | Ninguna clave AWS ni token privado tiene prefijo `VITE_`. | [ ] |
| Variables de entorno: seguridad | AWS keys y secretos están solo en el entorno serverless, sin prefijo `VITE_`. | Solo están disponibles para Vercel Functions y no aparecen en el bundle del cliente. | [ ] |
| Variables de entorno: seguridad | No hay secretos hardcodeados en archivos versionados. | La búsqueda no encuentra credenciales reales. Revisar cada coincidencia antes de aprobar. | [ ] |
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

Para buscar credenciales AWS potencialmente expuestas en archivos versionados:

```sh
git grep -nE '(AKIA|ASIA)[A-Z0-9]{16}|AWS_SECRET_ACCESS_KEY=[^[:space:]<]+' -- . ':!.env.example'
```

Una coincidencia no siempre es un secreto: comprobar el contexto y no incluir valores reales en logs, capturas o reportes.