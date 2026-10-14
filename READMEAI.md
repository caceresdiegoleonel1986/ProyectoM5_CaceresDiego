# Uso de IA en KairoShop

Este documento registra cómo se usó la IA durante el proyecto: los prompts, las iteraciones y las decisiones tomadas. La IA propuso alternativas; la decisión final y la validación (lint, `tsc`, tests y ejecución de la app) fueron propias.

## Índice de prompts

| # | Fase | Prompt |
|---|---|---|
| 1 | Arquitectura y dominio | Arquitectura de carpetas por capas |
| 2 | Arquitectura y dominio | Tipos del dominio (Product y Category) |
| 3 | UI | Sistema de diseño (variables CSS y dark mode) |
| 4 | UI | Componente Button |
| 5 | UI | Componente Modal |
| 6 | UI | Componente LoadingState |
| 7 | Seguridad | Checkout y uploads seguros bajo el plan Spark |
| 8 | Debugging | Pantalla en blanco al iniciar la app |
| 9 | Testing | Qué lógica es crítica y barata de testear |
| 10 | Code review | Checklist de revisión y auditoría de cobertura |

## Los 5 prompts clave

| Prompt | Tema | Iteración principal | Decisión final |
|---|---|---|---|
| [1](#1-arquitectura-de-carpetas-por-capas) | Arquitectura | Se comparó plana, por features y por capas. El estado se separó por dominio (Context, Provider, Reducer y hook) y el admin se dividió en productos y órdenes. | Capas con modularización por dominio. |
| [3](#3-sistema-de-diseño-variables-css-y-dark-mode) | Sistema de diseño | Se evaluó sin dark mode, desktop-first y mobile-first. Después los componentes reutilizaron esas variables. | Variables en `:root` y `.dark`, mobile-first. |
| [7](#7-checkout-y-uploads-seguros-bajo-el-plan-spark) | Seguridad | La primera versión usaba Cloud Functions y se descartó al confirmar que el proyecto corre en Spark. Se rehízo con transacción de Firestore y firmador serverless en Vercel. | `createOrder` con `runTransaction`, reglas estrictas y `api/presign-upload.ts` solo para admins. |
| [8](#8-pantalla-en-blanco-al-iniciar-la-app) | Debugging | Se leyó el error de consola: `useFavorite debe usarse dentro de FavoriteProvider`. | Se corrigió la composición de providers en `AppProvider`. |
| [9](#9-qué-lógica-es-crítica-y-barata-de-testear) | Testing | Primera ronda de tests y segunda ronda tras auditar la cobertura. | 75 tests; cobertura de statements de 79 % a 90 % y de branches de 58 % a 77 %. |

---

# Fase 1. Arquitectura y dominio

## 1. Arquitectura de carpetas por capas

**Prompt:** "Estoy iniciando un E-commerce con React y TS. Necesito una arquitectura de carpetas por capas que separe tipos, servicios de datos, estado global (contexto) y UI y páginas. Sugerime la estructura y explicame qué va en cada una."

**Opciones evaluadas**

- **Arquitectura plana (todo en `src/` sin capas claras)**
  - ✅ Simplicidad inicial, menos carpetas.
  - ❌ Difícil de escalar, responsabilidades mezcladas, poco mantenible.
- **Arquitectura por features (cada módulo con sus propios types, services, components)**
  - ✅ Modularización fuerte, cada feature es independiente.
  - ❌ Duplicación de patrones, curva de aprendizaje mayor, menos claridad si el equipo es pequeño.
- **Arquitectura por capas (types, services, contexts, components, pages)**
  - ✅ Separación clara de responsabilidades, fácil de entender, escalable, favorece la reutilización.
  - ❌ Requiere disciplina en imports y puede sentirse "abstracta" al inicio.

**Decisión:** arquitectura por capas con modularización por dominio.

- Claridad en responsabilidades (tipos, servicios, estado, UI).
- Escalabilidad: se agregan entidades nuevas (por ejemplo `Order`) con el mismo patrón.
- Reutilización: componentes UI genéricos separados de los de dominio.
- **Rechazadas:** la plana por no escalar y la de features por ser más compleja de mantener en este caso.

**Iteración:** la propuesta inicial incluía una carpeta `utils/` que no hizo falta, y el proyecto sumó `routes/` y `config/`. El estado quedó con un Context por dominio y el panel admin se dividió en productos y órdenes.

```text
src/
├── types/        Dominio (Product, CartItem, Order, User, Review)
├── services/     Acceso a datos (Firestore, Auth, S3) y converters
├── contexts/     Estado global por dominio (Context, Provider, Reducer)
├── hooks/        Hooks reutilizables (useDebounce)
├── components/   UI genérica (ui, states) y de dominio (common, admin)
├── pages/        Vistas completas
├── routes/       Rutas y guards
├── config/       Inicialización de Firebase
├── styles/       Estilos globales y tema
└── main.tsx      Punto de entrada
```

## 2. Tipos del dominio (Product y Category)

**Prompt:** "Definí los tipos principales para el dominio de e-commerce en React + TS. Incluí categorías tipadas y productos con soporte para reseñas y metadatos."

**Opciones evaluadas**

- **Solo `Product` con `CategoryId` como string union**
  - ✅ Simple y directo.
  - ❌ No permite enriquecer categorías con metadatos.
- **`Product` y `Category` como entidades separadas**
  - ✅ Escalable, categorías con nombre y descripción; facilita queries y una UI más rica.
  - ❌ Hay que mantener dos colecciones relacionadas.
- **`Product` extendido con rating y reviews**
  - ✅ Mejora la UX mostrando calificaciones y escala a futuras features de reseñas.
  - ❌ Aumenta la complejidad en la persistencia.

**Decisión:** `Product` extendido con rating y `Category` como entidad separada.

- Claridad en el dominio: categorías tipadas y enriquecidas.
- Consistencia: tipado fuerte, sin strings sueltos.
- **Rechazadas:** solo `Product` con `CategoryId` por ser muy limitado, y omitir el rating porque no refleja la experiencia del usuario.

---

# Fase 2. UI y sistema de diseño

## 3. Sistema de diseño (variables CSS y dark mode)

**Prompt:** "Definí un sistema base de diseño con variables CSS (--background, --surface, --card, --foreground, --muted, --primary, etc.) y sus equivalentes en modo oscuro. Usá una paleta moderna y elegante con Crimson Deep, Ruby Glow, Charcoal Black, Cloud Gray, Ivory White, Amber Accent y Emerald Hint. Documentá cómo se aplican en :root y .dark."

**Opciones evaluadas**

- **Variables sin dark mode**
  - ✅ Simplicidad.
  - ❌ No soporta accesibilidad ni preferencia de usuario.
- **Variables con dark mode pero desktop-first**
  - ✅ Claridad en pantallas grandes.
  - ❌ Requiere sobrescribir mucho para mobile y no aprovecha mobile-first.
- **Variables con dark mode y mobile-first**
  - ✅ Escalable, accesible y moderno; se adapta primero a pantallas pequeñas y luego escala con media queries.
  - ❌ Requiere disciplina en el diseño responsivo.

**Decisión:** variables CSS en `:root` y `.dark`, mobile-first.

- La base es usable en pantallas pequeñas y se expande con media queries.
- Dark mode integrado con `color-scheme` y variables.

## 4. Componente Button

**Prompt:** "Diseñá un componente Button en React + TS que use las variables globales de theme.css para colores, radios y sombras. Debe soportar estados hover, active y disabled."

**Opciones evaluadas**

- **Button básico con estilos inline**
  - ✅ Rápido de implementar.
  - ❌ No reutiliza variables globales y rompe la consistencia visual.
- **Button con clases CSS fijas**
  - ✅ Usa `theme.css` y mantiene la consistencia.
  - ❌ Poco flexible si se necesitan variantes (primary, quiet, compact).
- **Button con variantes tipadas (React + TS)**
  - ✅ Escalable, con autocompletado y validación de TypeScript.
  - ❌ Requiere más diseño inicial, pero evita combinaciones inválidas.

**Decisión:** Button con variantes tipadas y props discriminadas.

- Reutiliza las variables globales (colores, radios, sombras).
- Todos los botones comparten base y estados (`hover`, `active`, `disabled`).
- **Rechazadas:** inline styles y clases fijas sin variantes.

## 5. Componente Modal

**Prompt:** "Diseñá un componente Modal en React + TS que use props tipadas para controlar apertura y cierre (isOpen, onClose), título opcional y contenido vía children. Debe renderizarse condicionalmente y bloquear la interacción con el resto de la página."

**Opciones evaluadas**

- **Modal con librería externa (Radix, Material UI)**
  - ✅ Implementación rápida, accesibilidad ya resuelta.
  - ❌ Fuera del alcance (no se permiten librerías externas de UI) y menos control sobre la API.
- **Modal básico con estado interno y estilos inline**
  - ✅ Fácil de implementar.
  - ❌ Rompe la consistencia y no reutiliza estilos globales.
- **Modal componible con props tipadas y estilos globales**
  - ✅ API clara (`isOpen`, `onClose`, `title`, `children`), controlado por el consumidor y reutiliza clases globales (`modal-overlay`, `modal-content`).
  - ❌ La accesibilidad y las animaciones hay que definirlas manualmente.

**Decisión:** Modal componible con props tipadas y estilos globales.

- Controlado por estado externo, lo que facilita la integración con contextos y hooks.
- Escalable: se pueden añadir variantes (tamaños, animaciones) sin romper la API.
- **Rechazadas:** librerías externas e inline styles.

## 6. Componente LoadingState

**Prompt:** "Diseñá un componente LoadingState en React + TS que muestre un mensaje de carga y opcionalmente un skeleton. Debe soportar variantes inline y block, y ser accesible con rol `status` y `aria-live`."

**Opciones evaluadas**

- **LoadingState básico con solo texto**
  - ✅ Muy simple de implementar.
  - ❌ Poco visual, no transmite progreso.
- **LoadingState con skeleton opcional**
  - ✅ Mejora la percepción de carga mostrando la estructura de la UI.
  - ❌ Requiere definir skeletons adicionales.
- **LoadingState con variantes inline y block**
  - ✅ Flexible: sirve dentro de un botón o en toda la página, y es accesible con `role="status"` y `aria-live="polite"`.
  - ❌ Requiere más props y lógica condicional.

**Decisión:** LoadingState con mensaje, skeleton opcional y variantes inline y block.

- Reutilizable en distintos contextos y accesible.
- **Rechazadas:** solo texto y sin variantes.

**Iteración:** se agregó un componente Spinner accesible (`role="status"`, tamaños `sm`, `md` y `lg`) como indicador visual dentro de LoadingState, mejorando la percepción de carga y manteniendo la consistencia con el resto de la UI.

---

# Fase 3. Seguridad y backend

## 7. Checkout y uploads seguros bajo el plan Spark

**Prompt:** "¿Cómo hago un checkout y uploads seguros si solo tengo el plan Spark de Firebase (sin Cloud Functions)?"

**Alternativas evaluadas:** Functions con S3 firmado (requiere Blaze), transacción de Firestore en el cliente con reglas estrictas, o escritura libre desde el cliente.

**Decisión**

- **Checkout:** `createOrder` usa `runTransaction`: lee precio y stock actuales, descuenta stock y crea la orden. Las reglas solo permiten a un cliente bajar `stock` y tocar `rating` y `ratingCount`.
- **Uploads a S3:** la consigna exige S3 y Spark no tiene backend, así que se usa una función serverless gratuita (`api/presign-upload.ts`, Vercel). Verifica el ID token con Firebase Auth y lee el rol con ese mismo token contra Firestore, sin service account.
- **Descartadas:** Firebase Storage (no cumple S3) y credenciales de AWS en el navegador (inseguro).
- **Limitación aceptada:** las reglas no pueden recorrer los ítems para verificar el total. Está documentada en el README; la solución completa necesita un backend con Admin SDK.

**Iteraciones**

1. La primera versión usaba Cloud Functions. Se descartó al confirmar que el proyecto debe correr en Spark, y se rehízo con sus tests.
2. El modelo de estados de la orden (`created/paid`) no coincidía con la consigna. Se cambió a `pending/processing/completed/cancelled`, con normalización de datos antiguos en el converter.

---

# Fase 4. Debugging

## 8. Pantalla en blanco al iniciar la app

**Consulta:** pantalla en blanco con `npm run dev`; se pidió diagnosticar leyendo el error de consola.

- **Método:** se levantó el servidor, se abrió el navegador y se leyó el error: `useFavorite debe usarse dentro de FavoriteProvider`.
- **Causa:** `AppProvider` no montaba `AuthProvider` ni `FavoriteProvider`.
- **Solución:** se corrigió la composición de providers y se verificó en el navegador.
- **Aprendizaje:** `tsc -b` no detecta providers faltantes; hace falta ejecutar la app o un test de integración.
- **Revisión de tipos:** `tsc -b` reveló imports rotos (`useProducts`, `AdminProductsProvider`, `getProductsByIds`) que se corrigieron antes de seguir.

---

# Fase 5. Testing

## 9. Qué lógica es crítica y barata de testear

**Prompt:** "Qué lógica es crítica y barata de testear: reducers, guards de rutas, contratos con el servidor, debounce."

**Primera ronda:** reducers, providers y hooks, guards de rutas, `useDebounce`, `createOrder` (precio y stock leídos de Firestore y sin escrituras si falta stock) y `uploadFileSecurely` (tipo, tamaño y nombre generado). Firebase se mockea en el borde (`firebase/*` y `services/firebase`) para no tocar la red.

**Segunda ronda (auditoría de cobertura):** se detectaron módulos con baja cobertura y se agregaron tests de `productReducer`, `ErrorState`, `LoadingState`, `productConverter`, consultas y cambio de estado de órdenes, y los providers de Auth y de productos.

| Métrica | Antes | Después |
|---|---|---|
| Statements | 79 % | 90 % |
| Branches | 58 % | 77 % |
| Funciones | 73 % | 84 % |
| Líneas | 82 % | 93 % |

**Correcciones durante la iteración**

- La IA usó los estados `shipped` y `delivered` en los tests de órdenes, que no existen. El compilador lo detectó y se corrigió a los estados reales.
- Una primera versión usaba matchers de `jest-dom`, que no está instalado. Se reemplazaron por aserciones estándar en lugar de sumar una dependencia.

**Ejecución:** `npm test` (Vitest, Testing Library y jsdom). Resultado: 75 tests en 14 archivos.

---

# Fase 6. Code review

## 10. Checklist de revisión y auditoría de cobertura

Checklist aplicada a cada cambio: sin `any`, `tsc -b` y `eslint` limpios, reglas de Firestore coherentes con el cliente, sin secretos en el bundle y estados loading, error y vacío en cada vista.

**Hallazgos de la revisión:**

- La carpeta `coverage/` generaba advertencias de lint y se excluyó en `eslint.config.js`.
- El README y la guía de presentación mencionaban Cloud Functions y estados que ya no existían. Se corrigieron contra el código.

## Qué no hizo la IA

- No validó las reglas de Firestore contra un proyecto real: eso requiere el emulador o un despliegue.
- No decidió la configuración externa (variables de Vercel, dominios autorizados en Firebase, permisos IAM de S3), que se configuró manualmente.
