var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var me = P.editor.ModelEditorFactory.getERModelEditor();
var ed = pa.getDiagramEditorFactory().getERDiagramEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;

function findIER(owner, rx) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getClass().getInterfaces()[0].getSimpleName() == rx) return els[i]; }
  return null;
}
var erm = findIER(prj, "IERModel");
var schema = findIER(erm, "IERSchema");
log("schema=" + schema.getName());

// ---------- datos del modelo ----------
var ENUMS = ["rol_enum", "usuario_estado_enum", "grupo_sanguineo_enum", "factor_rh_enum", "empresa_estado_enum", "tipo_respuesta_enum",
  "postulacion_estado_enum", "avance_estado_enum", "tipo_archivo_soporte_enum", "objetivo_estado_enum", "notificacion_estado"];
// atributo: [fisico, logico, tipo, longitud, notNull, defecto]
var T = [
  { key: "usu", fis: "usuarios", log: "Usuario", def: "Cuentas de los cuatro roles (herencia de tabla unica, columna rol).", x: 380, y: 40, a: [
    ["id", "Id usuario", "INTEGER", "", true, true],
    ["nombre_completo", "Nombre completo", "VARCHAR", "150", true],
    ["correo_institucional", "Correo institucional (único)", "VARCHAR", "150", true],
    ["contrasena_hash", "Contraseña (hash)", "VARCHAR", "255", true],
    ["celular", "Celular", "VARCHAR", "20", false],
    ["foto_perfil", "Foto de perfil", "VARCHAR", "255", false],
    ["rol", "Rol", "rol_enum", "", true],
    ["estado", "Estado", "usuario_estado_enum", "", true, false, "ACTIVO"],
    ["fecha_registro", "Fecha de registro", "TIMESTAMP", "", true],
    ["programa_academico", "Programa académico", "VARCHAR", "150", false],
    ["direccion_residencia", "Dirección de residencia", "VARCHAR", "255", false],
    ["grupo_sanguineo", "Grupo sanguineo", "grupo_sanguineo_enum", "", false],
    ["factor_rh", "Factor RH", "factor_rh_enum", "", false],
    ["eps", "EPS", "VARCHAR", "100", false]] },
  { key: "emp", fis: "empresas_receptoras", log: "Empresa receptora", def: "Empresa que recibe practicantes; define su bitácora y documentos.", x: 860, y: 40, a: [
    ["id", "Id empresa", "INTEGER", "", true, true],
    ["nombre", "Nombre", "VARCHAR", "150", true],
    ["descripcion", "Descripción", "TEXT", "", true],
    ["requisitos_generales", "Requisitos generales", "TEXT", "", true],
    ["horas_requeridas", "Horas requeridas", "INTEGER", "", true],
    ["telefono", "Teléfono", "VARCHAR", "30", false],
    ["direccion", "Dirección", "VARCHAR", "255", false],
    ["estado", "Estado", "empresa_estado_enum", "", true, false, "ACTIVA"]] },
  { key: "pre", fis: "preguntas_bitacora", log: "Pregunta de bitácora", def: "Pregunta de la bitácora de postulación definida por empresa.", x: 1260, y: 40, a: [
    ["id", "Id pregunta", "INTEGER", "", true, true],
    ["enunciado", "Enunciado", "TEXT", "", true],
    ["tipo_respuesta", "Tipo de respuesta", "tipo_respuesta_enum", "", true],
    ["activa", "Activa", "BOOLEAN", "", true, false, "true"]] },
  { key: "doc", fis: "documentos_requeridos", log: "Documento requerido", def: "Documento que la empresa exige al postularse.", x: 1260, y: 300, a: [
    ["id", "Id documento requerido", "INTEGER", "", true, true],
    ["nombre_documento", "Nombre del documento", "VARCHAR", "150", true],
    ["activa", "Activo", "BOOLEAN", "", true, false, "true"]] },
  { key: "pos", fis: "postulaciones", log: "Postulación", def: "Solicitud del estudiante; una vez APROBADA es la matrícula y la práctica.", x: 380, y: 480, a: [
    ["id", "Id postulación", "INTEGER", "", true, true],
    ["estado", "Estado", "postulacion_estado_enum", "", true, false, "BORRADOR"],
    ["fecha_postulacion", "Fecha de postulación", "TIMESTAMP", "", false],
    ["motivo_rechazo", "Motivo de rechazo", "TEXT", "", false],
    ["fecha_decision", "Fecha de decisión", "TIMESTAMP", "", false],
    ["fecha_cierre", "Fecha de cierre", "TIMESTAMP", "", false],
    ["observacion_cierre", "Observación de cierre", "TEXT", "", false],
    ["fecha_rechazo_cierre", "Fecha de rechazo del cierre", "TIMESTAMP", "", false]] },
  { key: "res", fis: "respuestas_bitacora", log: "Respuesta de bitácora", def: "Respuesta del estudiante a una pregunta de la bitácora.", x: 860, y: 470, a: [
    ["id", "Id respuesta", "INTEGER", "", true, true],
    ["respuesta_texto", "Respuesta", "TEXT", "", true]] },
  { key: "dpo", fis: "documentos_postulacion", log: "Documento de postulación", def: "Archivo PDF que cumple un documento requerido.", x: 1260, y: 560, a: [
    ["id", "Id documento de postulación", "INTEGER", "", true, true],
    ["archivo", "Archivo", "VARCHAR", "255", true],
    ["fecha_carga", "Fecha de carga", "TIMESTAMP", "", true]] },
  { key: "obj", fis: "objetivo_practica", log: "Objetivo de la práctica", def: "Objetivos de la práctica; los decide el Docente Asesor.", x: 40, y: 480, a: [
    ["id", "Id objetivo", "INTEGER", "", true, true],
    ["contenido", "Contenido", "TEXT", "", true],
    ["estado", "Estado", "objetivo_estado_enum", "", true, false, "PENDIENTE_DE_APROBACION"],
    ["observacion_docente", "Observación del docente", "TEXT", "", false],
    ["fecha_envio", "Fecha de envío", "TIMESTAMP", "", true],
    ["fecha_decision", "Fecha de decisión", "TIMESTAMP", "", false]] },
  { key: "ava", fis: "avances_semanales", log: "Avance semanal", def: "Avance reportado por semana; único por postulación y semana.", x: 380, y: 880, a: [
    ["id", "Id avance", "INTEGER", "", true, true],
    ["semana_calendario", "Semana calendario", "DATE", "", true],
    ["actividades_a_desarrollar", "Actividades a desarrollar", "TEXT", "", true],
    ["horas_totales", "Horas totales", "NUMERIC", "5,2", true],
    ["beneficio_economico", "Beneficio económico", "NUMERIC", "10,2", true],
    ["actividades_generales", "Actividades generales", "TEXT", "", true],
    ["ejecucion", "Ejecución", "TEXT", "", true],
    ["observaciones_estudiante", "Observaciones del estudiante", "TEXT", "", true],
    ["estado", "Estado", "avance_estado_enum", "", true, false, "PENDIENTE_DE_REVISION"],
    ["fecha_envio", "Fecha de envío", "TIMESTAMP", "", true],
    ["calificacion_coordinador", "Calificación del coordinador", "NUMERIC", "2,1", false],
    ["comentario_coordinador", "Comentario del coordinador", "TEXT", "", false],
    ["fecha_calificacion", "Fecha de calificación", "TIMESTAMP", "", false],
    ["observacion_docente_asesor", "Observación del docente asesor", "TEXT", "", false],
    ["fecha_observacion_docente", "Fecha de observación docente", "TIMESTAMP", "", false]] },
  { key: "día", fis: "dias_trabajados", log: "Día trabajado", def: "Detalle de cada día trabajado del avance (de 1 a 6).", x: 40, y: 1000, a: [
    ["id", "Id día", "INTEGER", "", true, true],
    ["numero_dia", "Número de día", "SMALLINT", "", true],
    ["descripcion_dia", "Descripción del día", "TEXT", "", true],
    ["horas_dia", "Horas del día", "NUMERIC", "4,2", true]] },
  { key: "sop", fis: "soportes_avance", log: "Soporte de avance", def: "Archivo de soporte (PDF, PNG o JPG) del avance.", x: 860, y: 1000, a: [
    ["id", "Id soporte", "INTEGER", "", true, true],
    ["archivo", "Archivo", "VARCHAR", "255", true],
    ["tipo_archivo", "Tipo de archivo", "tipo_archivo_soporte_enum", "", true],
    ["fecha_carga", "Fecha de carga", "TIMESTAMP", "", true]] },
  { key: "arc", fis: "archivos_subidos", log: "Archivo subido", def: "Contenido binario de los archivos cargados (max. 10 MB).", x: 40, y: 40, a: [
    ["nombre", "Nombre del archivo", "VARCHAR", "255", true, true],
    ["contenido", "Contenido", "BYTEA", "", true],
    ["tipo_contenido", "Tipo de contenido", "VARCHAR", "100", true],
    ["tamano_bytes", "Tamaño en bytes", "INTEGER", "", true],
    ["fecha_carga", "Fecha de carga", "TIMESTAMP", "", true]] },
  { key: "not", fis: "notificaciones", log: "Notificación", def: "BASE DE NOTIFICACIONES (independiente): correo por enviar o enviado.", x: 1260, y: 840, a: [
    ["id", "Id notificacion", "INTEGER", "", true, true],
    ["evento", "Evento", "VARCHAR", "60", true],
    ["destinatario_correo", "Correo del destinatario", "VARCHAR", "255", true],
    ["asunto", "Asunto", "VARCHAR", "255", true],
    ["datos", "Datos de la plantilla", "JSONB", "", true],
    ["estado", "Estado", "notificacion_estado", "", true, false, "PENDIENTE"],
    ["canal", "Canal", "VARCHAR", "20", false],
    ["intentos", "Intentos", "INTEGER", "", true],
    ["ultimo_error", "Último error", "TEXT", "", false],
    ["creada_en", "Creada en", "TIMESTAMP", "", true],
    ["actualizada_en", "Actualizada en", "TIMESTAMP", "", true],
    ["enviada_en", "Enviada en", "TIMESTAMP", "", false]] }
];
// relaciones: [padre, hijo, nombreLogico, fk fisico, fk logico, verbo hijo, requerido, cardinalidad]
var R = [
  ["usu", "emp", "coordina", "coordinador_id", "Coordinador responsable", "coordina", true, "0orMore"],
  ["usu", "emp", "asesora", "docente_asesor_id", "Docente asesor responsable", "asesora", true, "0orMore"],
  ["emp", "pre", "define", "empresa_id", "Empresa", "define", true, "0orMore"],
  ["emp", "doc", "exige", "empresa_id", "Empresa", "exige", true, "0orMore"],
  ["usu", "pos", "postula", "estudiante_id", "Estudiante", "postula", true, "0orMore"],
  ["emp", "pos", "recibe", "empresa_id", "Empresa", "recibe", true, "0orMore"],
  ["pos", "res", "contiene", "postulacion_id", "Postulación", "contiene", true, "0orMore"],
  ["pre", "res", "es respondida en", "pregunta_id", "Pregunta", "es respondida en", true, "0orMore"],
  ["pos", "dpo", "adjunta", "postulacion_id", "Postulación", "adjunta", true, "0orMore"],
  ["doc", "dpo", "es cumplido por", "documento_requerido_id", "Documento requerido", "es cumplido por", true, "0orMore"],
  ["pos", "obj", "plantea", "postulacion_id", "Postulación", "plantea", true, "0or1"],
  ["pos", "ava", "registra", "postulacion_id", "Postulación", "registra", true, "0orMore"],
  ["ava", "día", "detalla", "avance_id", "Avance", "detalla", true, "1orMore"],
  ["ava", "sop", "adjunta", "avance_id", "Avance", "adjunta", true, "1orMore"],
  ["usu", "arc", "sube", "usuario_id", "Usuario que sube", "sube", false, "0orMore"]
];

var E = {};   // key -> entidad
var RL = [];  // relaciones creadas

function dtype(name) {
  var ds = schema.getDatatypes();
  for (var i = 0; i < ds.length; i++) { if (String(ds[i].getName()).toUpperCase() == name.toUpperCase()) return ds[i]; }
  var d = me.createERDatatype(erm, name);
  return d;
}

try {
  TM.beginTransaction();
  // limpiar entidades previas (incluye Entity0)
  var prev = schema.getEntities();
  for (var i = prev.length - 1; i >= 0; i--) { try { me.delete(prev[i]); } catch (e) { log("no se pudo borrar " + prev[i].getName() + " " + e); } }
  log("entidades previas borradas: " + prev.length);
  for (var k = 0; k < ENUMS.length; k++) dtype(ENUMS[k]);
  for (var t = 0; t < T.length; t++) {
    var d = T[t];
    var en = me.createEREntity(schema, d.log, d.fis);
    en.setDefinition(d.def);
    E[d.key] = en;
    for (var a = 0; a < d.a.length; a++) {
      var c = d.a[a];
      var at = me.createERAttribute(en, c[1], c[0], dtype(c[2]));
      if (c[3]) at.setLengthPrecision(c[3]);
      if (c[5] === true) at.setPrimaryKey(true);
      at.setNotNull(c[4] === true);
      if (c[6]) at.setDefaultValue(c[6]);
    }
  }
  log("entidades creadas");
  for (var r = 0; r < R.length; r++) {
    var q = R[r];
    var rel = me.createNonIdentifyingRelationship(E[q[0]], E[q[1]], q[2], "fk_" + E[q[1]].getPhysicalName() + "_" + q[3]);
    try { rel.setParentRequired(q[6]); } catch (e) { log("parentRequired " + e); }
    try { rel.setVerbPhraseChild(q[5]); } catch (e) { log("verbo " + e); }
    var fks = rel.getForeignKeys();
    if (fks.length > 0) { fks[0].setPhysicalName(q[3]); fks[0].setLogicalName(q[4]); }
    var antes = rel.getCardinality();
    try { rel.setCardinality(q[7]); } catch (e) { log("card " + q[7] + " " + e); }
    log("rel " + q[0] + "->" + q[1] + " fks=" + fks.length + " card antes=" + antes + " ahora=" + rel.getCardinality());
    RL.push(rel);
  }
  TM.endTransaction();
  log("MODELO OK");
} catch (e) { log("ERROR modelo: " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }

// ---------- diagramas ----------
function dibujar(nombre, tipo) {
  try {
    var ds = schema.getDiagrams(); var dg = null;
    for (var i = 0; i < ds.length; i++) { if (String(ds[i].getName()) == nombre) dg = ds[i]; }
    if (!dg) { log("no existe diagrama " + nombre); return; }
    TM.beginTransaction();
    ed.setDiagram(dg);
    try { dg.setModelType(tipo); } catch (e) { log("modelType " + e); }
    try { dg.setNotation("IE"); } catch (e) { log("notation " + e); }
    var pres = {};
    for (var t = 0; t < T.length; t++) {
      var d = T[t];
      pres[d.key] = ed.createNodePresentation(E[d.key], new Pt(d.x, d.y));
    }
    for (var r = 0; r < R.length; r++) {
      try { ed.createLinkPresentation(RL[r], pres[R[r][0]], pres[R[r][1]]); } catch (e) { log("link " + r + " " + e); }
    }
    TM.endTransaction();
    log("DIAGRAMA " + nombre + " OK (" + dg.getModelType() + " / " + dg.getNotation() + ")");
  } catch (e) { log("ERROR diagrama " + nombre + ": " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }
}
// los diagramas deben estar vacios antes de dibujar
dibujar("MER_JEDANIX", "Logical Model");
dibujar("Modelo_Relacional_JEDANIX", "Physical Model");

var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_build.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
