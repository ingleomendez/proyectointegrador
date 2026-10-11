# Guía Astah — Diagramas de Componentes y de Despliegue de JEDANIX

Imágenes de referencia (están en esta misma carpeta):
`Componentes_JEDANIX.png` y `Despliegue_JEDANIX.png` (también en PDF).

Crea ambos diagramas **en el mismo proyecto** donde ya están el diagrama de casos de uso y los 5 de clases.

---

## Parte 1 — Diagrama de componentes

**Crear el diagrama:** clic derecho sobre el proyecto (árbol, izquierda) → *Create Diagram* → *UML Diagrams* → **Component Diagram**. Nómbralo `Componentes_JEDANIX`.

**Herramientas de la barra:** *Component*, *Interface*, *Provided/Required Interface*, *Dependency*, *Package* (para agrupar), *Note*.

### Paso 1 — 3 paquetes (subsistemas)

Usa la herramienta **Package** y crea tres cajas. Ponles el estereotipo `subsystem` (clic derecho → *Stereotype…*).

| Paquete | Color sugerido |
|---|---|
| Frontend SPA — Angular 22 + Material | azul claro |
| Núcleo de Prácticas — FastAPI (Python) | verde claro |
| Servicio de Notificaciones — Node 22 + Express 5 | naranja claro |

### Paso 2 — Componentes (dentro de cada paquete)

Herramienta **Component**, arrastrar dentro del paquete.

**Frontend SPA**

| Componente | Nota (en la descripción) |
|---|---|
| Paneles por rol | Director · Coordinador · Docente asesor · Estudiante |
| Servicios HTTP | ApiService, EmpresaService, PostulacionService, AvanceService |
| Autenticación | AuthService, authGuard, authInterceptor (JWT) |
| Despertador | despertarNotificaciones(): fetch /salud (no-cors, cada 5 min) |

**Núcleo**

| Componente | Nota |
|---|---|
| Seguridad | JWT HS256 (python-jose), bcrypt, requiere_rol (RBAC) |
| Routers REST | /auth /usuarios /empresas /postulaciones /objetivos /avances /archivos /health |
| Servicios de negocio | Reglas de CU-01…CU-12, excepciones de dominio |
| Cliente de notificaciones | HTTP fire-and-forget, hilo daemon, 24 reintentos × 10 s |
| Repositorios | SQLAlchemy 2, Alembic, archivos en tabla `archivos_subidos` |
| BD jedanix_nucleo | estereotipo `database` — PostgreSQL (Neon) |

**Notificaciones**

| Componente | Nota |
|---|---|
| API de eventos | POST /eventos, GET /notificaciones, POST /notificaciones/:id/reenviar, GET /salud, cabecera X-API-Key |
| Plantillas | 15 tipos de evento, HTML + texto |
| Despachador de correo | Brevo API · SMTP · simulado |
| Job de reintentos | cada 60 s, máx. 5 intentos |
| Repositorio pg | Pool (max 5), prepararBaseDeDatos() |
| BD jedanix_notificaciones | estereotipo `database` — tabla notificaciones (PENDIENTE/ENVIADA/FALLIDA) |

**Fuera de los paquetes:** un componente **Brevo** con estereotipo `external system` (API transaccional v3).

### Paso 3 — Conexiones

Herramienta **Dependency** (flecha punteada) para todo; en cada flecha escribe el texto de la columna *Etiqueta*.

| Desde → Hacia | Etiqueta |
|---|---|
| Paneles por rol → Servicios HTTP | usa |
| Servicios HTTP → Autenticación | adjunta JWT |
| Autenticación → Routers REST | «REST/HTTPS» JSON + Bearer JWT *(flecha gruesa)* |
| Despertador → API de eventos | GET /salud (despertar) *(punteada)* |
| Routers REST → Seguridad | valida rol |
| Routers REST → Servicios de negocio | delega |
| Servicios de negocio → Repositorios | usa |
| Servicios de negocio → Cliente de notificaciones | evento |
| Repositorios → BD jedanix_nucleo | SQL / TLS |
| Cliente de notificaciones → API de eventos | POST /eventos + X-API-Key *(flecha gruesa)* |
| API de eventos → Plantillas | genera mensaje |
| Plantillas → Despachador de correo | — |
| API de eventos → Repositorio pg | guarda |
| Job de reintentos → Repositorio pg | lee pendientes |
| Job de reintentos → Despachador de correo | reintenta |
| Repositorio pg → BD jedanix_notificaciones | SQL / TLS |
| Despachador de correo → Brevo | HTTPS :443 POST /v3/smtp/email |

> Opcional (más "UML puro"): en las conexiones entre subsistemas usa **Provided/Required Interface** (bolita y media luna) con el nombre de la interfaz: `REST Núcleo`, `REST Notificaciones`.

---

## Parte 2 — Diagrama de despliegue

**Crear el diagrama:** clic derecho sobre el proyecto → *Create Diagram* → *UML Diagrams* → **Deployment Diagram**. Nómbralo `Despliegue_JEDANIX`.

**Herramientas:** *Node*, *Execution Environment*, *Device*, *Artifact*, *Communication Path / Association*, *Dependency*.

### Paso 1 — Nodos (cajas 3D)

| Nodo | Tipo / estereotipo | Notas (texto dentro) |
|---|---|---|
| PC del desarrollador | Device | Git + VS Code |
| GitHub | Node `cloud` | repo `ingleomendez/proyectointegrador` |
| Cloudflare Pages (plan Free) | Node `cloud · CDN` | https://jedanix-practicas.pages.dev |
| Computador del usuario | Device | contiene Navegador web (Execution Environment) |
| Render — jedanix-nucleo | Node `Web Service (Free)` | https://jedanix-nucleo.onrender.com — duerme tras 15 min |
| Render — jedanix-notificaciones | Node `Web Service (Free)` | https://jedanix-notificaciones.onrender.com — duerme tras 15 min |
| Neon (plan Free) | Node `cloud` | un proyecto por servicio, TLS obligatorio |
| Brevo | Node `cloud · SaaS` | api.brevo.com |
| Buzón del destinatario | Device | correo electrónico |

**Dentro de nodos** (arrástralos adentro):

| Contenedor | Execution Environment / Node interno |
|---|---|
| Computador del usuario | Navegador web |
| Render — jedanix-nucleo | Python 3 + Uvicorn |
| Render — jedanix-notificaciones | Node 22 |
| Neon | 2 × PostgreSQL 16/17 (Node `database server`) |

### Paso 2 — Artefactos (herramienta *Artifact*, dentro del nodo correspondiente)

| Artefacto | Va dentro de |
|---|---|
| Git + VS Code (monorepo JEDANIX) | PC del desarrollador |
| Repo proyectointegrador (jedanix-frontend/, jedanix-nucleo-practicas/, jedanix-notificaciones/, render.yaml) | GitHub |
| dist/jedanix-frontend/browser (index.html, main.js, styles.css) | Cloudflare Pages |
| SPA JEDANIX (Angular 22 + Material) | Navegador web |
| jedanix-nucleo-practicas (FastAPI, SQLAlchemy, Alembic) | Python 3 + Uvicorn |
| jedanix-notificaciones (Express 5, pg, job de reintentos) | Node 22 |
| BD jedanix_nucleo | PostgreSQL #1 de Neon |
| BD jedanix_notificaciones | PostgreSQL #2 de Neon |
| API transaccional v3 | Brevo |
| Correo electrónico | Buzón del destinatario |

### Paso 3 — Conexiones

Herramienta **Communication Path** (línea continua) o **Dependency** (punteada, para los `«deploy»`). Escribe el texto en cada una.

| Desde → Hacia | Tipo | Etiqueta |
|---|---|---|
| Git + VS Code → Repo (GitHub) | continua | git push (HTTPS) |
| Repo → dist (Cloudflare) | punteada | «deploy» webhook GitHub → build |
| Repo → jedanix-nucleo-practicas | punteada | «deploy» auto-deploy (Blueprint) |
| Repo → jedanix-notificaciones | punteada | «deploy» auto-deploy (Blueprint) |
| dist (Cloudflare) → SPA JEDANIX | continua | HTTPS :443 — descarga de la SPA |
| SPA JEDANIX → jedanix-nucleo-practicas | continua gruesa | HTTPS :443 REST/JSON — Authorization: Bearer JWT |
| SPA JEDANIX → jedanix-notificaciones | punteada | HTTPS GET /salud (despertar, no-cors) |
| jedanix-nucleo-practicas → jedanix-notificaciones | continua gruesa | HTTPS POST /eventos — X-API-Key |
| jedanix-nucleo-practicas → BD jedanix_nucleo | continua | TCP 5432 — SQL sobre TLS |
| jedanix-notificaciones → BD jedanix_notificaciones | continua | TCP 5432 — SQL sobre TLS |
| jedanix-notificaciones → API transaccional v3 | continua | HTTPS :443 POST /v3/smtp/email |
| API transaccional v3 → Correo electrónico | continua | SMTP / entrega de correo |

---

## Qué decir al explicarlos (30 segundos)

- **Componentes:** "El Frontend Angular habla solo con el Núcleo por REST+JWT. El Núcleo guarda todo en su base y, cuando pasa algo importante, avisa al servicio de Notificaciones con `POST /eventos`. Notificaciones tiene su propia base y manda el correo por Brevo."
- **Despliegue:** "Todo es gratis y en la nube: Cloudflare Pages sirve la SPA, dos servicios en Render (que se duermen tras 15 min), dos bases en Neon y Brevo para el correo. Un `git push` a GitHub despliega solo."

## Colores sugeridos (clic derecho → *Format* → *Fill color*)

Azul `#E3F2FD` frontend/usuario · Verde `#E8F5E9` Núcleo/Render · Naranja `#FFF3E0` Notificaciones/Cloudflare · Gris `#ECEFF1` bases y dispositivos · Lila `#F3E5F5` Neon/externos.
