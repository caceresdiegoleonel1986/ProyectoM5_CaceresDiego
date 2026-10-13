Notes — Blog System (NoSQL)

Este documento registra el uso de IA como auditor en el modelado de colecciones para un sistema de Blog con Posts, Authors y Comments.

---

# 📚 Arquitectura del Proyecto — E-commerce (React + TS)

El proyecto sigue una **arquitectura por capas con modularización por dominio**, lo que asegura claridad, escalabilidad y mantenibilidad.

---

## 📌 Prompt usado
Estoy iniciando un E-commerce con React y TS. necesito una arquitectura de carpetas por capas que separe:

tipos

servicios de datos

estado global (contexto)

UI y páginas
Sugerime la estructura y explicame que va en cada una.

Código

---

## 📖 Opciones evaluadas

- **Arquitectura plana (todo en src/ sin capas claras)**  
  - ✅ Ventajas: simplicidad inicial, menos carpetas.  
  - ❌ Desventajas: difícil de escalar, responsabilidades mezcladas, poco mantenible.

- **Arquitectura por features (cada módulo con sus propios types, services, components, etc.)**  
  - ✅ Ventajas: modularización fuerte, cada feature es independiente.  
  - ❌ Desventajas: duplicación de patrones, curva de aprendizaje mayor, menos claridad si el equipo es pequeño.

- **Arquitectura por capas (types, services, contexts, components, pages, etc.)**  
  - ✅ Ventajas: separación clara de responsabilidades, fácil de entender, escalable, favorece reutilización.  
  - ❌ Desventajas: requiere disciplina en imports, puede sentirse más “abstracta” al inicio.

---

## ✅ Decisión tomada

- **Aceptada:** arquitectura por capas con modularización por dominio.  
- **Motivos:**  
  - Claridad en responsabilidades (tipos, servicios, estado, UI).  
  - Escalabilidad: se pueden agregar nuevas entidades (ej. `Order`) siguiendo el mismo patrón.  
  - Reutilización: componentes UI genéricos separados de los de dominio.  
  - Consistencia: todos los devs saben dónde va cada pieza.

- **Rechazadas:**  
  - Arquitectura plana → no escalable.  
  - Arquitectura por features → más compleja de mantener en este caso.

---

## 🏗️ Estructura de carpetas

src/
├── types/        → Definición del dominio (ej: Product, CartItem, User)
├── services/     → Acceso a datos y APIs (REST, Firebase, localStorage)
├── contexts/     → Estado global y providers (AuthContext, CartContext)
├── hooks/        → Custom hooks para consumir contextos (useCart, useAuth)
├── components/   → UI genérica (Button, Input) + UI de dominio (ProductCard)
├── pages/        → Vistas completas y rutas (HomePage, CartPage, LoginPage)
├── styles/       → Configuración de estilos globales y temas
├── utils/        → Helpers y funciones puras (formatPrice, dateUtils)
└── main.tsx      → Punto de entrada, montaje de AppProviders

---

# 📝 AI Notes — Blog System (NoSQL)

Este documento registra el uso de IA como auditor en el modelado de colecciones para un sistema de Blog con Posts, Authors y Comments.

## 📌 Prompt usado
Estoy modelando un sistema de Blog en NoSQL con Posts, Authors y Comments. Necesito decidir si los comentarios deben guardarse como una subcolección dentro de cada Post (ej: posts/{postId}/comments) o como una colección aparte (ej: comments con referencia a postId). Explicá ventajas y desventajas de cada enfoque en términos de consultas, escalabilidad y consistencia, y recomendá cuál conviene para este caso.

Código

## 📖 Opciones evaluadas

- **Subcolección dentro de cada Post (`posts/{postId}/comments`)**  
  - ✅ Ventajas: jerarquía natural, consultas simples por post, reglas de seguridad granulares.  
  - ❌ Desventajas: difícil escalar si hay millones de comentarios, consultas globales complicadas, migraciones más complejas.

- **Colección aparte (`comments` con campo `postId`)**  
  - ✅ Ventajas: mejor escalabilidad, consultas flexibles (por post, autor, fecha), indexación potente.  
  - ❌ Desventajas: relación menos jerárquica, reglas de seguridad más complejas, requiere dos lecturas (post + comments).

## ✅ Decisión tomada
- **Aceptada:** colección aparte `comments` con referencia a `postId`.  
- **Motivos:**  
  - Escalabilidad ante posts virales.  
  - Consultas globales más eficientes (últimos comentarios del sitio, comentarios por autor).  
  - Flexibilidad para crecer y hacer análisis.  

- **Rechazada:** subcolección dentro de cada post.  
- **Motivos:**  
  - Limitaciones en consultas globales.  
  - Riesgo de hotspot en posts con muchos comentarios.  
  - Complejidad en migraciones y agregaciones.

---

📌 Prompt 4 — UI design (estilos globales y dark mode)
Código
Definí un sistema base de diseño con variables CSS (--background, --surface, --card, --foreground, --muted, --primary, etc.) y sus equivalentes en modo oscuro. Usá una paleta moderna y elegante con Crimson Deep, Ruby Glow, Charcoal Black, Cloud Gray, Ivory White, Amber Accent y Emerald Hint. Documentá cómo se aplican en :root y .dark.
📖 Opciones evaluadas
Variables sin dark mode

✅ Simplicidad.

❌ No soporta accesibilidad ni preferencia de usuario.

Variables con dark mode pero desktop‑first

✅ Claridad en pantallas grandes.

❌ Requiere sobrescribir mucho para mobile, no aprovecha mobile‑first.

Variables con dark mode + mobile‑first

✅ Escalable, accesible, moderno.

✅ Se adapta primero a pantallas pequeñas y luego escala con media queries.

❌ Requiere disciplina en diseño responsivo.

✅ Decisión tomada
Aceptada: sistema de diseño con variables CSS en :root y .dark, mobile‑first.

Motivos:

Mobile‑first asegura que la base sea usable en pantallas pequeñas y luego se expanda con media queries.

Dark mode integrado con color-scheme y variables.

---

## 📌 Prompt 5 — UI design (Button)
Diseñá un componente Button en React + TS que use las variables globales de theme.css para colores, radios y sombras. Debe soportar estados hover, active y disabled.

Código

---

## 📖 Opciones evaluadas

- **Button básico con estilos inline**  
  - ✅ Rápido de implementar.  
  - ❌ No reutiliza variables globales, rompe consistencia visual.

- **Button con clases CSS fijas**  
  - ✅ Usa theme.css, mantiene consistencia.  
  - ❌ Poco flexible si se necesitan variantes (primary, quiet, compact).

- **Button con variantes tipadas (React + TS)**  
  - ✅ Escalable, soporta distintos estilos (`primary`, `quiet`, `compact`).  
  - ✅ Aprovecha autocompletado y validación de TypeScript.  
  - ❌ Requiere más diseño inicial, pero evita combinaciones inválidas.

---

## ✅ Decisión tomada

- **Aceptada:** Button con variantes tipadas y props discriminadas en React + TS.  
- **Motivos:**  
  - Reutiliza variables globales de `theme.css` (colores, radios, sombras).  
  - Escalable: se pueden agregar variantes sin romper la API.  
  - Consistencia: todos los botones comparten base y estados (`hover`, `active`, `disabled`).  
  - TypeScript asegura combinaciones válidas y autocompletado claro.

- **Rechazadas:**  
  - Inline styles → rompe consistencia.  
  - Clases fijas sin variantes → poco flexible para crecer.

---

## 📌 Prompt 6 — UI design (Modal)
Diseñá un componente Modal en React + TS que use props tipadas para controlar apertura/cierre (isOpen, onClose), título opcional y contenido vía children. Debe renderizarse condicionalmente y bloquear la interacción con el resto de la página.

Código

---

## 📖 Opciones evaluadas

- **Modal con librería externa (ej. Radix, Material UI)**  
  - ✅ Implementación rápida, accesibilidad ya resuelta.  
  - ❌ Fuera de scope: no se permiten librerías externas de UI, menos control sobre API.

- **Modal básico con estado interno y estilos inline**  
  - ✅ Fácil de implementar.  
  - ❌ Rompe consistencia, difícil de escalar, no reutiliza estilos globales.

- **Modal componible con props tipadas y estilos globales**  
  - ✅ Escalable, API clara (`isOpen`, `onClose`, `title`, `children`).  
  - ✅ Reutiliza variables y clases globales (`modal-overlay`, `modal-content`).  
  - ✅ Controlado por el consumidor: el componente maneja estructura, el usuario define contenido.  
  - ❌ Requiere definir manualmente accesibilidad y animaciones.

---

## ✅ Decisión tomada

- **Aceptada:** Modal componible en React + TS con props tipadas y estilos globales.  
- **Motivos:**  
  - API explícita y fácil de mantener.  
  - Reutiliza estilos globales y mantiene consistencia visual.  
  - Controlado por estado externo (`isOpen`), lo que facilita integración con contextos o hooks.  
  - Escalable: se pueden añadir variantes (ej. tamaños, animaciones) sin romper la API.

- **Rechazadas:**  
  - Librerías externas → fuera de alcance.  
  - Inline styles → rompe consistencia y mantenibilidad.

---

## 📌 Prompt 7 — UI design (ProductGrid)
Diseñá un componente ProductGrid en React + TS que reciba un array de productos tipados y los renderice en un layout de grilla responsivo. Cada producto debe mostrar imagen, nombre y precio.

Código

---

## 📖 Opciones evaluadas

- **Renderizado con estilos inline (grid en style)**  
  - ✅ Rápido de implementar, sin dependencias adicionales.  
  - ❌ Menos mantenible, difícil de reutilizar estilos, rompe consistencia con theme.css.

- **Renderizado con clases CSS globales (ej. `.product-grid`)**  
  - ✅ Reutiliza theme.css, mantiene consistencia visual.  
  - ✅ Facilita aplicar media queries mobile‑first.  
  - ❌ Requiere definir clases adicionales y mantenerlas sincronizadas.

- **Renderizado con TailwindCSS utilitario**  
  - ✅ Muy flexible, mobile‑first por defecto.  
  - ✅ Permite ajustar rápidamente columnas y gaps.  
  - ❌ Puede generar ruido visual en JSX si no se organiza bien.

---

## ✅ Decisión tomada

- **Aceptada:** ProductGrid con layout de grilla responsivo y tipado fuerte en React + TS.  
- **Motivos:**  
  - Escalable: soporta cualquier cantidad de productos.  
  - Consistencia: usa tipado `Product` para garantizar datos correctos.  
  - Responsivo: mobile‑first con `auto-fill` y `minmax` asegura que las tarjetas se adapten a distintos tamaños de pantalla.  
  - Flexibilidad: se puede migrar fácilmente a clases CSS o Tailwind según necesidad futura.

- **Rechazadas:**  
  - Inline styles → rompe consistencia y mantenibilidad.  
  - Clases globales sin tipado → menos seguras y más propensas a errores.

---

## 📌 Prompt 8 — UI design (Spinner)
Diseñá un componente Spinner en React + TS que use props tipadas para tamaño (sm, md, lg) y un label accesible. Debe renderizarse como un elemento con rol status y clases globales para animación.

Código

---

## 📖 Opciones evaluadas

- **Spinner básico con estilos inline**  
  - ✅ Fácil de implementar.  
  - ❌ No reutiliza clases globales, rompe consistencia visual.

- **Spinner con librería externa (ej. Material UI, Radix)**  
  - ✅ Accesibilidad ya resuelta.  
  - ❌ Fuera de alcance: dependencia externa, menos control sobre API.

- **Spinner componible con props tipadas y clases globales**  
  - ✅ Escalable, soporta distintos tamaños (`sm`, `md`, `lg`).  
  - ✅ Reutiliza estilos globales (`ui-spinner`, `ui-spinner--sm`, etc.).  
  - ✅ Accesible: usa `role="status"` y `aria-label`.  
  - ❌ Requiere definir manualmente animaciones en CSS.

---

## ✅ Decisión tomada

- **Aceptada:** Spinner componible en React + TS con props tipadas y clases globales.  
- **Motivos:**  
  - API clara y tipada (`size`, `label`).  
  - Reutiliza estilos globales y mantiene consistencia con el sistema de diseño.  
  - Accesible: incluye atributos ARIA para lectores de pantalla.  
  - Escalable: se pueden añadir variantes de tamaño sin romper la API.

- **Rechazadas:**  
  - Inline styles → rompe consistencia.  
  - Librerías externas → fuera de alcance del proyecto.

---

Diseñá un componente LoadingState en React + TS que muestre un mensaje de carga y opcionalmente un skeleton. Debe soportar variantes inline y block, y ser accesible con rol `status` y `aria-live`.
📖 Opciones evaluadas
LoadingState básico con solo texto

✅ Muy simple de implementar.

❌ Poco visual, no transmite progreso claramente.

LoadingState con skeleton opcional

✅ Mejora la percepción de carga mostrando estructura de la UI.

✅ Escalable: se pueden pasar distintos skeletons como children.

❌ Requiere definir skeletons adicionales.

LoadingState con variantes inline y block

✅ Flexible: se adapta a distintos contextos (ej. dentro de un botón o en toda la página).

✅ Accesible: usa role="status" y aria-live="polite".

❌ Requiere más props y lógica condicional.

✅ Decisión tomada
Aceptada: LoadingState con mensaje de carga, soporte para skeleton opcional y variantes inline/block.

Motivos:

Escalable y reutilizable en distintos contextos.

Accesible para lectores de pantalla.

Consistente con el sistema de diseño global.

Rechazadas:

Solo texto → demasiado básico.

Sin variantes → poca flexibilidad en distintos layouts.

📌 Evolución posterior
Se agregó Spinner como indicador visual dentro de LoadingState, mejorando la percepción de carga y manteniendo consistencia con el resto de la UI.

---

## 📌 Prompt 10 — UI design (EmptyState)
Diseñá un componente EmptyState en React + TS que muestre un título, descripción opcional, variantes para distintos contextos (no-products, no-results) y un botón de acción opcional. Debe ser accesible con rol status y aria-live.

Código

---

## 📖 Opciones evaluadas

- **EmptyState básico con solo texto**  
  - ✅ Muy simple de implementar.  
  - ❌ Poco flexible, no diferencia entre distintos casos de vacío.

- **EmptyState con variantes (`no-products`, `no-results`)**  
  - ✅ Escalable, permite mensajes específicos según el contexto.  
  - ✅ Mejora la experiencia del usuario al dar feedback claro.  
  - ❌ Requiere props adicionales y lógica condicional.

- **EmptyState con acción opcional**  
  - ✅ Permite guiar al usuario a la siguiente acción (ej. agregar producto, cambiar búsqueda).  
  - ✅ Reutilizable en distintos flujos.  
  - ❌ Depende de que se pase `onAction` y `actionLabel`.

---

## ✅ Decisión tomada

- **Aceptada:** EmptyState con variantes y acción opcional.  
- **Motivos:**  
  - Escalable y adaptable a distintos contextos de catálogo o búsqueda.  
  - Accesible: usa `role="status"` y `aria-live="polite"`.  
  - Consistente con el sistema de diseño global.  
  - Mejora la UX al dar feedback claro y guiar al usuario con un CTA.

- **Rechazadas:**  
  - Solo texto → demasiado básico.  
  - Sin variantes → poca flexibilidad en distintos escenarios.

  ---

  ## 📌 Prompt 11 — UI design (ErrorState)
Diseñá un componente ErrorState en React + TS que muestre un mensaje de error y opcionalmente un botón de reintento. Debe ser accesible con rol alert.

Código

---

## 📖 Opciones evaluadas

- **ErrorState básico con solo mensaje**  
  - ✅ Muy simple de implementar.  
  - ❌ Poco útil para el usuario, no ofrece recuperación.

- **ErrorState con botón de reintento opcional**  
  - ✅ Escalable, permite manejar errores recuperables.  
  - ✅ Mejora la experiencia del usuario al dar una acción inmediata.  
  - ❌ Requiere que se pase `onRetry` para funcionar.

- **ErrorState con variantes de error (ej. red, permisos)**  
  - ✅ Más específico en feedback.  
  - ❌ Aumenta complejidad y props, puede ser innecesario en primera versión.

---

## ✅ Decisión tomada

- **Aceptada:** ErrorState con mensaje obligatorio y botón de reintento opcional.  
- **Motivos:**  
  - Accesible: usa `role="alert"` para que lectores de pantalla lo anuncien.  
  - Escalable: se puede extender con variantes en el futuro.  
  - Consistente con el sistema de estados (`LoadingState`, `EmptyState`).  
  - Mejora la UX al dar feedback claro y acción inmediata.

- **Rechazadas:**  
  - Solo mensaje → demasiado básico.  
  - Variantes múltiples → innecesario en esta etapa inicial.

---

