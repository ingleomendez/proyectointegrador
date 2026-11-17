var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var ed = pa.getDiagramEditorFactory().getERDiagramEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;
function findIER(owner, rx) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getClass().getInterfaces()[0].getSimpleName() == rx) return els[i]; }
  return null;
}
var schema = findIER(findIER(prj, "IERModel"), "IERSchema");
var ents = schema.getEntities();
var EN = {};  // fisico -> entidad
for (var i = 0; i < ents.length; i++) EN[String(ents[i].getPhysicalName())] = ents[i];
// relaciones desde el diagrama grande
var RELS = [];
var big = null, ds0 = schema.getDiagrams();
for (var i = 0; i < ds0.length; i++) if (String(ds0[i].getName()) == "MER_JEDANIX") big = ds0[i];
var bp = big.getPresentations();
for (var j = 0; j < bp.length; j++) {
  if (String(bp[j].getType()).indexOf("Relationship") >= 0) {
    try { RELS.push({ rel: bp[j].getModel(), a: String(bp[j].getSource().getModel().getPhysicalName()), b: String(bp[j].getTarget().getModel().getPhysicalName()) }); } catch (e) { log("rel " + e); }
  }
}
log("relaciones=" + RELS.length);
// [fisico, x, y, soloNombre]
var VISTAS = [
  ["Cuentas y parametrización", "1_Cuentas", [["usuarios", 330, 40, false], ["archivos_subidos", 40, 60, false], ["empresas_receptoras", 830, 40, false], ["preguntas_bitacora", 640, 430, false], ["documentos_requeridos", 1060, 430, false]]],
  ["Postulación y objetivos", "2_Postulacion", [["usuarios", 40, 40, true], ["empresas_receptoras", 420, 40, true], ["objetivo_practica", 40, 300, false], ["postulaciones", 420, 300, false], ["respuestas_bitacora", 800, 300, false], ["preguntas_bitacora", 1180, 300, true], ["documentos_postulacion", 420, 620, false], ["documentos_requeridos", 800, 620, true]]],
  ["Seguimiento semanal", "3_Seguimiento", [["postulaciones", 40, 40, true], ["avances_semanales", 40, 240, false], ["dias_trabajados", 520, 200, false], ["soportes_avance", 520, 420, false]]],
  ["Notificaciones", "4_Notificaciones", [["notificaciones", 40, 40, false]]]
];
function crear(prefijo, tipo, fisico) {
  for (var v = 0; v < VISTAS.length; v++) {
    var vis = VISTAS[v];
    var nombre = prefijo + vis[1];
    var dg = ed.createERDiagram(schema, nombre);
    ed.setDiagram(dg);
    try { dg.setModelType(tipo); } catch (e) { log("modelType " + e); }
    try { dg.setNotation("IE"); } catch (e) { log("notation " + e); }
    var pres = {};
    for (var k = 0; k < vis[2].length; k++) {
      var d = vis[2][k];
      var en = EN[d[0]];
      var np = ed.createNodePresentation(en, new Pt(d[1], d[2]));
      pres[d[0]] = np;
      if (fisico) {
        try { np.setProperty("type_and_length_visibility", "true"); np.setProperty("null_option_visibility", "true"); } catch (e) { log("prop " + e); }
      } else {
        var fks = en.getForeignKeys(), ids = [];
        for (var q = 0; q < fks.length; q++) ids.push(String(fks[q].getId()));
        if (ids.length > 0) np.setProperty("invisible_features", ids.join(","));
      }
      if (d[3]) { try { np.setProperty("er_displaylevel", "entity"); } catch (e) { log("nivel " + e); } }
    }
    for (var r = 0; r < RELS.length; r++) {
      var R = RELS[r];
      if (pres[R.a] && pres[R.b]) { try { ed.createLinkPresentation(R.rel, pres[R.a], pres[R.b]); } catch (e) { log("link " + e); } }
    }
    log("creado " + nombre);
  }
}
try {
  TM.beginTransaction();
  crear("MER_", "Logical Model", false);
  crear("REL_", "Physical Model", true);
  TM.endTransaction();
  log("OK");
} catch (e) { log("ERROR: " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_v3c.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
