# JEDANIX — Guía para armar los diagramas de clases en Astah

Esta guía acompaña a los 5 diagramas de clases (imágenes en PNG/PDF). Está pensada para reconstruirlos a mano en **Astah UML**: cada clase trae su estereotipo, atributos, métodos y las relaciones con multiplicidad. Los diagramas se hicieron leyendo el código real del repositorio (Núcleo FastAPI, Notificaciones Node.js y Frontend Angular).

## 0. Cómo organizar el proyecto en Astah

Crea un paquete por diagrama (clic derecho en el árbol → *Create Package*) y dentro de cada uno un *Class Diagram*:

1. `1_Dominio_Nucleo` — entidades de la base de datos del Núcleo + enumeraciones.
2. `2_Nucleo_Routers_Servicios` — routers, servicios, núcleo transversal (seguridad, configuración, cliente de notificaciones).
3. `3_Nucleo_Repositorios_Excepciones` — repositorios, jerarquía de excepciones, acceso a datos.
4. `4_Notificaciones` — microservicio Node.js.
5. `5_Frontend_Angular` — componentes, servicios, guards, interceptor.

**Convenciones de notación**

- Visibilidad: `+` público, `-` privado. Atributos: `nombre: Tipo`. Multiplicidades entre corchetes `[0..1]` = opcional.
- Estereotipos: en Astah, doble clic en la clase → pestaña *Stereotype*; escribe el nombre sin «».
- **Generalización** (triángulo vacío): de la subclase hacia la superclase. **Composición** (rombo lleno en el lado del “todo”). **Asociación** simple (línea) con multiplicidad en cada extremo. **Dependencia** (flecha punteada, herramienta *Dependency*) para “usa/llama a”.
- Enumeraciones: herramienta *Enumeration*; los valores van como literales.
- Colores sugeridos (Astah: clic derecho → *Format → Fill color*): usuarios azul, empresa verde, postulación naranja, seguimiento morado, archivos gris, servicios naranja suave, repositorios verde, routers azul, externos amarillo, excepciones rojo claro.

---

## 1. Diagrama 1 — Dominio del Núcleo

### 1.1 Enumeraciones

| Enumeración | Literales |
|---|---|
| RolEnum | ESTUDIANTE, DIRECTOR, COORDINADOR, DOCENTE_ASESOR |
| UsuarioEstadoEnum | ACTIVO, INACTIVO |
| GrupoSanguineoEnum | A, B, AB, O |
| FactorRhEnum | POSITIVO, NEGATIVO |
| EmpresaEstadoEnum | ACTIVA, INACTIVA |
| TipoRespuestaEnum | TEXTO_LIBRE, SELECCION_UNICA, SELECCION_MULTIPLE |
| PostulacionEstadoEnum | BORRADOR, PENDIENTE_DE_APROBACION, APROBADA, RECHAZADA, FINALIZADA |
| ObjetivoEstadoEnum | PENDIENTE_DE_APROBACION, APROBADOS, RECHAZADOS |
| AvanceEstadoEnum | PENDIENTE_DE_REVISION, ACEPTADO, OBSERVADO |
| TipoArchivoSoporteEnum | PDF, PNG, JPG |

### 1.2 Clases (atributos y métodos)

**Usuario** (clase **abstracta**, cursiva)

Atributos:

- `- id: int {PK}`
- `- nombre_completo: str(150)`
- `- correo_institucional: str(150) {único}`
- `- contrasena_hash: str(255)`
- `- celular: str(20) [0..1]`
- `- foto_perfil: str(255) [0..1]`
- `- rol: RolEnum {discriminador}`
- `- estado: UsuarioEstadoEnum = ACTIVO`
- `- fecha_registro: datetime`

**Estudiante**

Atributos:

- `- programa_academico: str(150)`
- `- direccion_residencia: str(255)`
- `- grupo_sanguineo: GrupoSanguineoEnum`
- `- factor_rh: FactorRhEnum`
- `- eps: str(100)   «obligatoria»`

**Director**

Sin atributos propios (hereda de Usuario).

**CoordinadorPractica**

Sin atributos propios (hereda de Usuario).

**DocenteAsesor**

Sin atributos propios (hereda de Usuario).

**EmpresaReceptora**

Atributos:

- `- id: int {PK}`
- `- nombre: str(150)`
- `- descripcion: text`
- `- requisitos_generales: text`
- `- horas_requeridas: int {> 0}`
- `- telefono: str(30) [0..1]`
- `- direccion: str(255) [0..1]`
- `- estado: EmpresaEstadoEnum = ACTIVA`

**PreguntaBitacora**

Atributos:

- `- id: int {PK}`
- `- enunciado: text`
- `- tipo_respuesta: TipoRespuestaEnum`
- `- activa: bool = true`

**DocumentoRequerido**

Atributos:

- `- id: int {PK}`
- `- nombre_documento: str(150)`
- `- activa: bool = true`

**Postulacion**

Atributos:

- `- id: int {PK}`
- `- estado: PostulacionEstadoEnum = BORRADOR`
- `- fecha_postulacion: datetime [0..1]`
- `- motivo_rechazo: text [0..1]`
- `- fecha_decision: datetime [0..1]`
- `- fecha_cierre: datetime [0..1]`
- `- observacion_cierre: text [0..1]`
- `- fecha_rechazo_cierre: datetime [0..1]`

Métodos:

- `+ horas_acumuladas(): float`
- `+ horas_requeridas(): int`
- `+ pendiente_cierre(): bool`

**RespuestaBitacora**

Atributos:

- `- id: int {PK}`
- `- respuesta_texto: text`

**DocumentoPostulacion**

Atributos:

- `- id: int {PK}`
- `- archivo: str(255)`
- `- fecha_carga: datetime`

**ObjetivoPractica**

Atributos:

- `- id: int {PK}`
- `- contenido: text`
- `- estado: ObjetivoEstadoEnum = PENDIENTE_DE_APROBACION`
- `- observacion_docente: text [0..1]`
- `- fecha_envio: datetime`
- `- fecha_decision: datetime [0..1]`

Métodos:

- `+ estudiante_nombre(): str`
- `+ empresa_nombre(): str`

**AvanceSemanal**

Atributos:

- `- id: int {PK}`
- `- semana_calendario: date`
- `- actividades_a_desarrollar: text`
- `- horas_totales: Decimal(5,2) {> 0}`
- `- beneficio_economico: Decimal(10,2) {>= 0}`
- `- actividades_generales: text`
- `- ejecucion: text`
- `- observaciones_estudiante: text`
- `- estado: AvanceEstadoEnum = PENDIENTE_DE_REVISION`
- `- fecha_envio: datetime`
- `- calificacion_coordinador: Decimal(2,1) [0..1] {0.0 a 5.0}`
- `- comentario_coordinador: text [0..1]`
- `- fecha_calificacion: datetime [0..1]`
- `- observacion_docente_asesor: text [0..1]`
- `- fecha_observacion_docente: datetime [0..1]`

Métodos:

- `+ tiene_observacion_docente(): bool`
- `+ estudiante_nombre(): str`
- `+ empresa_nombre(): str`

**DiaTrabajado**

Atributos:

- `- id: int {PK}`
- `- numero_dia: smallint {1 a 6}`
- `- descripcion_dia: text`
- `- horas_dia: Decimal(4,2) {0 < h <= 24}`

**SoporteAvance**

Atributos:

- `- id: int {PK}`
- `- archivo: str(255)`
- `- tipo_archivo: TipoArchivoSoporteEnum`
- `- fecha_carga: datetime`

**ArchivoSubido**

Atributos:

- `- nombre: str(255) {PK}`
- `- contenido: bytes`
- `- tipo_contenido: str(100)`
- `- tamano_bytes: int`
- `- fecha_carga: datetime`

### 1.3 Relaciones y multiplicidades

| Relación | Tipo | Multiplicidad / nota |
|---|---|---|
| Usuario ◁— Estudiante, Director, CoordinadorPractica, DocenteAsesor | Generalización | Herencia de **tabla única**: una sola tabla `usuarios`, discriminador `rol`. CHECK: datos del Estudiante solo con rol ESTUDIANTE |
| CoordinadorPractica — EmpresaReceptora | Asociación “coordinador” | 1 coordinador ↔ 0..* empresas |
| DocenteAsesor — EmpresaReceptora | Asociación “docente asesor” | 1 docente ↔ 0..* empresas |
| Estudiante — Postulacion | Asociación “postula” | 1 ↔ 0..* (índice único parcial: solo una postulación activa) |
| EmpresaReceptora — Postulacion | Asociación “recibe” | 1 ↔ 0..* |
| EmpresaReceptora ◆— PreguntaBitacora | Composición | 1 ↔ 0..* |
| EmpresaReceptora ◆— DocumentoRequerido | Composición | 1 ↔ 0..* |
| Postulacion ◆— RespuestaBitacora | Composición | 1 ↔ 0..* (UNIQUE postulación+pregunta) |
| Postulacion ◆— DocumentoPostulacion | Composición | 1 ↔ 0..* (UNIQUE postulación+documento) |
| Postulacion ◆— ObjetivoPractica | Composición | 1 ↔ 0..1 |
| Postulacion — AvanceSemanal | Asociación “registra” | 1 ↔ 0..* (UNIQUE postulación+semana) |
| AvanceSemanal ◆— DiaTrabajado | Composición | 1 ↔ 1..6 |
| AvanceSemanal ◆— SoporteAvance | Composición | 1 ↔ 1..* |
| RespuestaBitacora — PreguntaBitacora | Asociación “responde a” | 0..* ↔ 1 |
| DocumentoPostulacion — DocumentoRequerido | Asociación “cumple” | 0..* ↔ 1 |
| Usuario — ArchivoSubido | Asociación “sube” | 0..1 ↔ 0..* (SET NULL al borrar usuario) |

Notas (herramienta *Note*, conectar con *Anchor*): estados de Postulacion (BORRADOR → PENDIENTE_DE_APROBACION → APROBADA → FINALIZADA, o RECHAZADA); “APROBADA = práctica activa, no existe entidad Matrícula”; el Coordinador es el único que cambia `AvanceSemanal.estado`; las observaciones del Docente Asesor nunca lo modifican; el contenido de los archivos vive en la base de datos.

---

## 2. Diagramas 2 y 3 — Capas del Núcleo (FastAPI)

Arquitectura en capas: **Router → Service → Repository → Modelo (SQLAlchemy)**. Los servicios lanzan excepciones de la jerarquía `ServiceError`, que `main.py` traduce a HTTP.

### 2.1 Routers (estereotipo `router`, atributo `prefijo`)

| Router | Prefijo | Operaciones (rol permitido) |
|---|---|---|
| AuthRouter | /auth | POST /login |
| UsuariosRouter | /usuarios | GET·PUT /me (todos); POST "", GET "", GET /programas-academicos, GET·PUT /{id}, PATCH /{id}/inactivar, POST /{id}/reenviar-credenciales, PATCH /{id}/reactivar (Director) |
| EmpresasRouter | /empresas | GET "" y GET /{id} (autenticado); POST, PUT, PATCH inactivar, preguntas y documentos-requeridos CRUD (Director) |
| PostulacionesRouter | /postulaciones | POST "", PUT /{id}, POST /{id}/enviar, GET /me (Estudiante); GET /pendientes, PATCH /{id}/decision, PATCH /{id}/cierre (Director); GET /matriculados (Director, Coordinador, Docente Asesor); GET /{id} |
| ObjetivosRouter | /objetivos | POST "", GET /me (Estudiante); GET /postulacion/{id} (Director); GET /pendientes, PATCH /{id}/decision (Docente Asesor) |
| AvancesRouter | /avances | POST "", GET /me (Estudiante); GET /postulacion/{id} (Director); GET /coordinador, PATCH /{id}/calificacion (Coordinador); GET /docente, PATCH /{id}/observacion (Docente Asesor); GET /{id} |
| ArchivosRouter | /archivos y /uploads | POST /archivos (subir), GET /uploads/{nombre} (descarga pública) |

Dependencias: cada Router → su Service (`AuthRouter` y `UsuariosRouter` → UsuarioService; `EmpresasRouter` → EmpresaReceptoraService; `PostulacionesRouter` → PostulacionService; `ObjetivosRouter` → ObjetivoPracticaService; `AvancesRouter` → AvanceSemanalService). Todos los routers dependen de `Deps` (autenticación/rol). `AuthRouter` valida con los esquemas Pydantic.

### 2.2 Servicios (estereotipo `service`)

Cada servicio tiene los atributos `- db: Session` y uno por repositorio que usa (composición ◆ hacia el repositorio).

**UsuarioService**

Atributos: `- db`, `- repo`, `- avance_repo`

Métodos:

- `+ listar(rol: RolEnum | None = None): list[Usuario]`
- `+ obtener(usuario_id: int): Usuario`
- `- _validar_programa(programa: str | None, actual: str | None = None): None`
- `+ crear_usuario(data: UsuarioCreate): Usuario`
- `+ actualizar_usuario_director(usuario_id: int, data: UsuarioUpdateDirector, confirmar_cambio_rol: bool = False): Usuario`
- `+ reenviar_credenciales(usuario_id: int): Usuario`
- `+ actualizar_perfil(usuario_id: int, data: PerfilUpdate): Usuario`
- `+ inactivar_usuario(usuario_id: int, forzar: bool = False): Usuario`
- `+ reactivar_usuario(usuario_id: int): Usuario`
- `+ login(data: LoginRequest): TokenResponse`

**EmpresaReceptoraService**

Atributos: `- db`, `- repo`, `- postulacion_repo`

Métodos:

- `+ crear_empresa(data: EmpresaReceptoraCreate): EmpresaReceptora`
- `+ actualizar_empresa(empresa_id: int, data: EmpresaReceptoraUpdate): EmpresaReceptora`
- `+ agregar_pregunta(empresa_id: int, data: PreguntaBitacoraCreate, confirmar_duplicado: bool = False): PreguntaBitacora`
- `+ agregar_documento_requerido(empresa_id: int, data: DocumentoRequeridoCreate): DocumentoRequerido`
- `+ actualizar_pregunta(empresa_id: int, pregunta_id: int, data: PreguntaBitacoraUpdate, confirmar_duplicado: bool = False): PreguntaBitacora`
- `+ eliminar_pregunta(empresa_id: int, pregunta_id: int, confirmar: bool = False): None`
- `+ actualizar_documento_requerido(empresa_id: int, documento_id: int, data: DocumentoRequeridoUpdate): DocumentoRequerido`
- `+ eliminar_documento_requerido(empresa_id: int, documento_id: int, confirmar: bool = False): None`
- `+ inactivar_empresa(empresa_id: int, forzar: bool = False): EmpresaReceptora`
- `+ listar(solo_activas: bool = False): list[EmpresaReceptora]`
- `+ obtener(empresa_id: int): EmpresaReceptora`

**PostulacionService**

Atributos: `- db`, `- repo`, `- empresa_repo`, `- usuario_repo`, `- avance_repo`

Métodos:

- `+ obtener(postulacion_id: int): Postulacion`
- `+ listar_mias(estudiante_id: int): list[Postulacion]`
- `+ listar_pendientes_director(empresa_id: int | None = None): list[Postulacion]`
- `+ listar_matriculados(): list[Postulacion]`
- `+ listar_matriculados_por_coordinador(coordinador_id: int): list[Postulacion]`
- `+ listar_matriculados_por_docente_asesor(docente_asesor_id: int): list[Postulacion]`
- `+ crear_postulacion(estudiante_id: int, data: PostulacionCreate): Postulacion`
- `+ actualizar_borrador(estudiante_id: int, postulacion_id: int, data: PostulacionUpdate): Postulacion`
- `+ enviar_borrador(estudiante_id: int, postulacion_id: int): Postulacion`
- `- _validar_pertenencia(empresa, pregunta_ids: list[int], documento_ids: list[int]): None`
- `- _validar_completitud(empresa, pregunta_ids_respondidas: set[int], documento_ids_cargados: set[int]): None`
- `+ decidir_postulacion(postulacion_id: int, data: PostulacionDecision): Postulacion`
- `+ decidir_cierre(postulacion_id: int, data: PostulacionCierre): Postulacion`
- `- _horas_aceptadas(postulacion_id: int): float`
- `- _correos_involucrados(postulacion: Postulacion): list[str]`
- `- _notificar_directores(evento: str, datos: dict): None`

**AvanceSemanalService**

Atributos: `- db`, `- repo`, `- postulacion_repo`, `- objetivo_repo`

Métodos:

- `+ obtener(avance_id: int): AvanceSemanal`
- `+ listar_mios(estudiante_id: int): list[AvanceSemanal]`
- `+ listar_por_postulacion(postulacion_id: int): list[AvanceSemanal]`
- `+ listar_por_coordinador(coordinador_id: int, solo_pendientes: bool = False): list[AvanceSemanal]`
- `+ listar_por_docente_asesor(docente_asesor_id: int): list[AvanceSemanal]`
- `+ registrar_avance(estudiante_id: int, data: AvanceSemanalCreate): AvanceSemanal`
- `+ calificar_avance(avance_id: int, data: AvanceCalificacion): AvanceSemanal`
- `+ observar_avance_docente(avance_id: int, data: AvanceObservacionDocente): AvanceSemanal`

**ObjetivoPracticaService**

Atributos: `- db`, `- repo`, `- postulacion_repo`

Métodos:

- `+ obtener_de_mi_practica(estudiante_id: int): ObjetivoPractica`
- `+ obtener(objetivo_id: int): ObjetivoPractica`
- `+ obtener_de_postulacion(postulacion_id: int): ObjetivoPractica`
- `+ listar_pendientes_docente(docente_asesor_id: int): list[ObjetivoPractica]`
- `+ enviar_objetivos(estudiante_id: int, data: ObjetivoPracticaCreate): ObjetivoPractica`
- `+ decidir_objetivos(objetivo_id: int, data: ObjetivoPracticaDecision): ObjetivoPractica`

Composiciones (servicio ◆→ repositorio, 1 ↔ 1): UsuarioService → UsuarioRepository, AvanceSemanalRepository; EmpresaReceptoraService → EmpresaReceptoraRepository, PostulacionRepository; PostulacionService → PostulacionRepository, EmpresaReceptoraRepository, UsuarioRepository, AvanceSemanalRepository; AvanceSemanalService → AvanceSemanalRepository, PostulacionRepository, ObjetivoPracticaRepository; ObjetivoPracticaService → ObjetivoPracticaRepository, PostulacionRepository.

Dependencias hacia `NotificacionesClient`: UsuarioService, PostulacionService, AvanceSemanalService y ObjetivoPracticaService (llaman `notificar` después del commit).

### 2.3 Repositorios (estereotipo `repository`, atributo `- db: Session`)

**UsuarioRepository**

Atributos: `- db`

Métodos:

- `+ get_by_id(usuario_id: int): Usuario | None`
- `+ get_by_correo(correo_institucional: str): Usuario | None`
- `+ existe_correo(correo_institucional: str): bool`
- `+ listar(rol: RolEnum | None = None): list[Usuario]`
- `+ crear(usuario: Usuario): Usuario`
- `+ guardar(usuario: Usuario): Usuario`
- `+ contar_empresas_asignadas(usuario_id: int): int`

**EmpresaReceptoraRepository**

Atributos: `- db`

Métodos:

- `+ get_by_id(empresa_id: int): EmpresaReceptora | None`
- `+ listar(solo_activas: bool = False): list[EmpresaReceptora]`
- `+ crear(empresa: EmpresaReceptora): EmpresaReceptora`
- `+ guardar(empresa: EmpresaReceptora): EmpresaReceptora`
- `+ agregar_pregunta(empresa: EmpresaReceptora, pregunta: PreguntaBitacora): PreguntaBitacora`
- `+ existe_enunciado_duplicado(empresa_id: int, enunciado: str, excluir_id: int | None = None): bool`
- `+ get_pregunta(empresa_id: int, pregunta_id: int): PreguntaBitacora | None`
- `+ get_documento_requerido(empresa_id: int, documento_id: int): DocumentoRequerido | None`
- `+ contar_respuestas_de_pregunta(pregunta_id: int, solo_en_curso: bool = False): int`
- `+ contar_cargas_de_documento(documento_id: int, solo_en_curso: bool = False): int`
- `+ eliminar(entidad: PreguntaBitacora | DocumentoRequerido): None`
- `+ agregar_documento_requerido(empresa: EmpresaReceptora, documento: DocumentoRequerido): DocumentoRequerido`

**PostulacionRepository**

Atributos: `- db`

Métodos:

- `+ get_by_id(postulacion_id: int): Postulacion | None`
- `+ get_activa_de_estudiante(estudiante_id: int): Postulacion | None`
- `+ listar_por_estudiante(estudiante_id: int): list[Postulacion]`
- `+ listar_pendientes(empresa_id: int | None = None): list[Postulacion]`
- `+ listar_matriculados(): list[Postulacion]`
- `+ listar_matriculados_por_coordinador(coordinador_id: int): list[Postulacion]`
- `+ listar_matriculados_por_docente_asesor(docente_asesor_id: int): list[Postulacion]`
- `+ crear(postulacion: Postulacion): Postulacion`
- `+ guardar(postulacion: Postulacion): Postulacion`
- `+ agregar_respuesta_bitacora(postulacion: Postulacion, respuesta: RespuestaBitacora): RespuestaBitacora`
- `+ agregar_documento(postulacion: Postulacion, documento: DocumentoPostulacion): DocumentoPostulacion`

**AvanceSemanalRepository**

Atributos: `- db`

Métodos:

- `+ get_by_id(avance_id: int): AvanceSemanal | None`
- `+ get_por_postulacion_y_semana(postulacion_id: int, semana_calendario: date): AvanceSemanal | None`
- `+ listar_por_postulacion(postulacion_id: int): list[AvanceSemanal]`
- `+ listar_por_coordinador(coordinador_id: int, solo_pendientes: bool = False): list[AvanceSemanal]`
- `+ listar_por_docente_asesor(docente_asesor_id: int): list[AvanceSemanal]`
- `+ contar_sin_revisar_por_responsable(usuario_id: int): int`
- `+ crear(avance: AvanceSemanal): AvanceSemanal`
- `+ guardar(avance: AvanceSemanal): AvanceSemanal`
- `+ agregar_dia_trabajado(avance: AvanceSemanal, dia: DiaTrabajado): DiaTrabajado`
- `+ agregar_soporte(avance: AvanceSemanal, soporte: SoporteAvance): SoporteAvance`

**ObjetivoPracticaRepository**

Atributos: `- db`

Métodos:

- `+ get_by_postulacion_id(postulacion_id: int): ObjetivoPractica | None`
- `+ listar_pendientes_por_docente_asesor(docente_asesor_id: int): list[ObjetivoPractica]`
- `+ crear(objetivo: ObjetivoPractica): ObjetivoPractica`
- `+ guardar(objetivo: ObjetivoPractica): ObjetivoPractica`

Cada repositorio depende (flecha punteada) del paquete de modelos de dominio (diagrama 1) y recibe la `Session` de SQLAlchemy.

### 2.4 Excepciones

| Clase | Hereda de | HTTP |
|---|---|---|
| ServiceError (abstracta) | Exception | — |
| NoEncontradoError | ServiceError | 404 |
| ReglaDeNegocioError | ServiceError | 400 / 422 |
| ConflictoError | ServiceError | 409 |
| RequiereConfirmacionError (`+ detalle: dict`) | ServiceError | 409 con `requiere_confirmacion: true` |

### 2.5 Componentes transversales (`core/`)

- **Settings** (`pydantic-settings`): `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM = 'HS256'`, `ACCESS_TOKEN_EXPIRE_MINUTES = 120`, `NOTIFICACIONES_SERVICE_URL`, `NOTIFICACIONES_TIMEOUT_SECONDS = 2.0`, `NOTIFICACIONES_REINTENTOS = 24`, `NOTIFICACIONES_ESPERA_SEGUNDOS = 10.0`, `NOTIFICACIONES_ASINCRONO = true`, `NOTIFICACIONES_API_KEY`, `ENVIRONMENT`, `CORS_ORIGINS`. Métodos: `+ cors_origins_lista(): list[str]`.
- **Security** (utilidad): `hash_password`, `verify_password` (bcrypt), `create_access_token` (JWT HS256, `sub` = id de usuario, `rol`), `decode_access_token`.
- **Deps** (utilidad): `get_current_usuario(credenciales, db): Usuario` (401 si el token falta, venció o la cuenta está inactiva) y `requiere_rol(*roles)` (403).
- **Database** (utilidad): `engine` (con `pool_pre_ping`), `SessionLocal`, `Base`, `get_db()` (una sesión por petición).
- **NotificacionesClient**: `+ notificar(evento, destinatario_correo, datos)` — hilo en segundo plano, reintenta HTTP 429/500/502/503/504 (24 × 10 s), envía la cabecera `X-API-Key`, nunca propaga errores.
- **AppMain (FastAPI)**: CORS desde `CORS_ORIGINS`, `GET /health`, manejadores que traducen `ServiceError` a HTTP.
- **Esquemas Pydantic** (DTO): auth (LoginRequest, TokenResponse), usuario, empresa_receptora, postulacion, avance_semanal, objetivo_practica — patrón `*Create`, `*Update`, `*Out`, `*ListItem`, `*Decision`. En Astah basta un paquete «DTO» con las clases listadas en el diagrama 2.

Dependencias externas: `NotificacionesClient` → microservicio Notificaciones (HTTP POST /eventos); `Database` → PostgreSQL del Núcleo (Neon).

---

## 3. Diagrama 4 — Microservicio de Notificaciones (Node.js 22 / Express 5)

| Clase / módulo | Estereotipo | Atributos | Métodos |
|---|---|---|---|
| Index (`src/index.js`) | arranque | — | `+ main()`, `- prepararBaseDeDatos()` (reintenta con espera creciente 2–15 s), `- esperar(ms)`, `- apagar(señal)` |
| App (`src/app.js`) | Express | `+ app` | `GET /salud` (abierto), `use(requiereClaveInterna)`, `use(eventosRouter)`, `use(notificacionesRouter)`, manejador de errores (EventoInvalidoError → 400) |
| claveInterna | middleware | — | `+ requiereClaveInterna(claveEsperada)` (401 si `X-API-Key` no coincide), `- iguales(a, b)` |
| EventosRouter | router | — | `POST /eventos` → 202; `GET /eventos/tipos` |
| NotificacionesRouter | router | — | `GET /notificaciones?estado&correo&limite`, `POST /notificaciones/:id/reenviar` |
| NotificacionService | service | — | `+ registrarEvento(cuerpo)`, `+ procesar(id)`, `+ pendientesDeReintento()`, `+ listar(estado?, correo?, limite = 50)`, `+ reenviar(id)`, `- validarEvento(cuerpo)` |
| EventoInvalidoError | exception | — | HTTP 400 |
| Plantillas | module | `- PLANTILLAS` (15 eventos), `- CAMPOS_SENSIBLES` | `+ eventosSoportados()`, `+ esEventoSoportado(evento)`, `+ asuntoDe(...)`, `+ renderizar(...)`, `+ sinCamposSensibles(datos)`, `+ escaparHtml(valor)` |
| Mailer | module | — | `+ enviarCorreo({para, asunto, texto, html})` (canal BREVO / SMTP / SIMULADO), `- enviarPorBrevo(...)`, `- obtenerTransporte()`, `+ parsearRemitente(texto)` |
| JobReintentos | job | `- temporizador` | `+ iniciar()` (cada 60 s), `+ detener()`, `+ ejecutarCiclo()` (reprocesa pendientes/fallidas con intentos < 5) |
| Config | configuración | `entorno, puerto = 4000, databaseUrl, smtp{...}, brevoApiKey, remitente, frontendUrl, claveInterna, reintentos{intervaloSegundos = 60, maxIntentos = 5}, modoSimulado` | — |
| Db | pool `pg` | `+ pool` (max 5, connectionTimeout 20 s, idleTimeout 10 s, keepAlive) | `+ inicializarEsquema()` (ejecuta `sql/schema.sql`, idempotente) |
| **Notificacion** (entidad) | entity | `id: int {PK}`, `evento: str`, `destinatario_correo: str`, `asunto: str`, `datos: jsonb`, `estado: NotificacionEstado`, `canal: str [0..1]`, `intentos: int = 0`, `ultimo_error: str [0..1]`, `creada_en`, `actualizada_en`, `enviada_en [0..1]` | — |
| NotificacionEstado | enumeración | PENDIENTE, ENVIADA, FALLIDA | — |

**Eventos soportados (15):** usuario.creado, usuario.credenciales_reenviadas, usuario.reactivado, postulacion.enviada, postulacion.aprobada, postulacion.rechazada, practica.cerrada, practica.cierre_rechazado, avance.registrado, avance.calificado, avance.observado, avance.observacion_docente, objetivos.pendientes, objetivos.aprobados, objetivos.rechazados.

**Relaciones (dependencias salvo que se indique):**

- NotificacionesClient (Núcleo) → claveInterna → EventosRouter (HTTP POST /eventos con `X-API-Key`).
- Index → App (crea), Index → Db (prepara), Index → JobReintentos (`iniciar`).
- App → claveInterna, App → NotificacionesRouter.
- EventosRouter y NotificacionesRouter → NotificacionService.
- NotificacionService → Plantillas, Mailer, Db, EventoInvalidoError (lanza).
- JobReintentos → NotificacionService (`procesar(id)`).
- Mailer → Config, Brevo (HTTPS API v3), SMTP/consola.
- NotificacionService — Notificacion: asociación 1 ↔ 0..*; Notificacion → NotificacionEstado.
- Db → PostgreSQL de Notificaciones (Neon), base de datos **propia**, sin claves foráneas hacia el Núcleo.

---

## 4. Diagrama 5 — Frontend Angular

### 4.1 Servicios (`@Injectable({providedIn: 'root'})`)

Todos los servicios HTTP tienen `- http: HttpClient` y `- baseUrl: string = environment.apiUrl + '/<recurso>'`; cada método devuelve `Observable<...>`.

| Servicio | Atributos adicionales | Métodos |
|---|---|---|
| AuthService | `- router: Router`, `- usuarioSignal: Signal<SesionUsuario \| null>`, `+ usuario` (solo lectura), `+ estaAutenticado: Computed<boolean>` | `+ login(credenciales)`, `+ logout()`, `+ actualizarNombre(nombreCompleto)`, `+ obtenerToken()`, `- leerSesionGuardada()` |
| UsuarioService | — | `obtenerMiPerfil`, `actualizarMiPerfil(data)`, `listar(rol?)`, `programasAcademicos()`, `obtener(id)`, `crear(data)`, `actualizar(id, data, confirmarCambioRol = false)`, `inactivar(id, forzar = false)`, `reenviarCredenciales(id)`, `reactivar(id)` |
| EmpresaService | — | `listar`, `obtener(empresaId)`, `crear`, `actualizar`, `agregarPregunta`, `actualizarPregunta`, `eliminarPregunta(…, confirmar = false)`, `agregarDocumentoRequerido`, `actualizarDocumentoRequerido`, `eliminarDocumentoRequerido(…, confirmar = false)`, `inactivar(empresaId, forzar = false)` |
| PostulacionService | — | `crear`, `actualizarBorrador`, `enviarBorrador`, `listarMias`, `obtener`, `listarPendientes(empresaId?)`, `decidir`, `decidirCierre`, `listarMatriculados` |
| ObjetivoService | — | `enviar(data)`, `obtenerMios()`, `obtenerDePostulacion(postulacionId)`, `listarPendientes()`, `decidir(objetivoId, data)` |
| AvanceService | — | `registrar`, `listarMios`, `obtener(id)`, `listarDePostulacion`, `listarCoordinador(soloPendientes = false)`, `calificar(id, data)`, `listarDocente`, `observar(id, data)` |
| ArchivoService | — | `subir(archivo: File, permitirImagenes = false)`, `descargar(ruta, nombre)`, `urlPublica(ruta)` |
| EstadoEstudianteService | `- postulacionService`, `- postulaciones: Signal<PostulacionOut[]>`, `+ cargado: Signal<boolean>`, `+ postulacionActiva`, `+ ultimaPostulacion`, `+ contexto: Computed<ContextoEstudiante>` | `+ refrescar()`, `+ limpiar()` |

### 4.2 Núcleo transversal

- **authInterceptor** (`HttpInterceptorFn`): agrega `Authorization: Bearer`; ante 401 llama `logout()` y va a `/login`; en peticiones POST/PUT/PATCH/DELETE llama `despertarNotificaciones()`. Depende de AuthService, environment y Utils.
- **Guards**: `authGuard` (exige sesión), `roleGuard(rolesPermitidos: RolEnum[])`, `inicioRolGuard` (redirige a la pantalla de inicio del rol). Dependen de AuthService.
- **Utilidades**: `despertarNotificaciones()` (GET no-cors a `/salud` del microservicio, máximo 1 vez cada 5 min), `menuDeRol`, `accesosDeRol`, `rutaInicioDeRol`, `NOMBRE_ROL`.
- **environment**: `apiUrl`, `notificacionesUrl`.
- **Modelos TypeScript**: interfaces espejo de los esquemas Pydantic (`*Create`, `*Update`, `*Out`, `*ListItem`) y enums.
- **Shell** (componente de layout): usa AuthService, EstadoEstudianteService y Router; métodos `alternarMenu()`, `cerrarMenu()`, `cerrarSesion()`.
- **app.routes / app.config**: rutas por rol (/director, /estudiante, /coordinador, /docente-asesor, /perfil), aplica los guards y registra el interceptor.

### 4.3 Componentes y servicios que inyectan (dependencias punteadas)

| Grupo | Componente → servicios |
|---|---|
| Común | Login → Auth; Perfil → Archivo, Auth, Usuario; InicioRol → Auth, EstadoEstudiante |
| Director | UsuariosLista → Auth, Usuario; UsuarioForm → Usuario; EmpresasListaDirector → Empresa; EmpresaDetalleDirector → Empresa; EmpresaForm → Empresa, Usuario; SolicitudesLista → Postulacion; SolicitudDetalle → Archivo, Empresa, Postulacion, Usuario; MatriculadosLista → Postulacion; MatriculadoDetalle → Avance, Empresa, Objetivo, Postulacion, Usuario; CierrePractica → Avance, Empresa, Postulacion |
| Estudiante | Inicio → Auth; EmpresasLista → Empresa, Postulacion; EmpresaDetalle → Empresa, Postulacion; PostulacionNueva → Archivo, Empresa, Postulacion; PostulacionesLista → Postulacion; PostulacionDetalle → Postulacion; MiPractica → Avance, Empresa, Objetivo, Postulacion; Objetivos → Objetivo; AvancesLista → Archivo, Avance, Objetivo, Postulacion; AvanceNuevo → Archivo, Avance; AvanceDetalle → Archivo, Avance |
| Revisión (Coordinador y Docente Asesor comparten estas pantallas) | EstudiantesLista → Auth, Avance, Objetivo, Postulacion; EstudianteDetalle → Auth, Avance, Objetivo, Postulacion; AvanceRevision → Archivo, Auth, Avance |

Estereotipo de todos: `component`. En Astah puedes agruparlos en paquetes (Director, Estudiante, Revisión, Común) y dibujar una dependencia hacia cada servicio de la tabla.

Dependencias externas: los servicios HTTP pasan por el interceptor y llegan a la API del Núcleo (`https://jedanix-nucleo.onrender.com`); `despertarNotificaciones` llama a `/salud` del microservicio de Notificaciones.

---

## 5. Consejos para Astah

- Crea primero las enumeraciones y luego las clases; así puedes elegir el tipo del atributo en la lista.
- Para clases con muchos atributos, pega el bloque en el campo *Definition* de Astah (doble clic → *Attributes → Add*) y respeta `{PK}`, `{único}`, rangos `{1 a 6}` como parte del nombre o de la restricción.
- Para las multiplicidades en composiciones el extremo del rombo es 1; la multiplicidad escrita en la tabla es la de la parte.
- Los atributos de clases del frontend en Angular usan señales; en Astah represéntalos con el tipo `Signal<...>`/`Computed<...>`.
