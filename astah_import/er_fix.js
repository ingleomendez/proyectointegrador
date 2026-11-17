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
var ds = schema.getDiagrams();
try {
  TM.beginTransaction();
  // acento en el logico de la notificacion
  var ents = schema.getEntities();
  for (var i = 0; i < ents.length; i++) {
    if (String(ents[i].getPhysicalName()) == "notificaciones") {
      var pk = ents[i].getPrimaryKeys(); if (pk.length > 0) pk[0].setLogicalName("Id notificación");
    }
  }
  for (var i = 0; i < ds.length; i++) {
    var dg = ds[i], nombre = String(dg.getName());
    ed.setDiagram(dg);
    var fisico = (nombre.indexOf("Relacional") >= 0);
    var ps = dg.getPresentations();
    for (var j = 0; j < ps.length; j++) {
      var p = ps[j], t = String(p.getType());
      if (t == "EREntity" && fisico) {
        try { p.setProperty("type_and_length_visibility", "true"); p.setProperty("null_option_visibility", "true"); } catch (e) { log("prop " + e); }
      }
      if (t.indexOf("Relationship") >= 0 && String(p.getModel().getName()) == "asesora") {
        try {
          var pts = p.getAllPoints();
          var a = pts[0], b = pts[pts.length - 1];
          var mid = new Pt((a.getX() + b.getX()) / 2, (a.getY() + b.getY()) / 2 + 70);
          p.setAllPoints([new Pt(a.getX(), a.getY()), mid, new Pt(b.getX(), b.getY())]);
          log(nombre + ": curva asesora ok (" + pts.length + " puntos)");
        } catch (e) { log("bend " + e); }
      }
    }
    var txt = fisico
      ? "Base de datos jedanix_notificaciones (PostgreSQL, Neon): propia del microservicio de Notificaciones, sin claves foráneas hacia jedanix_nucleo."
      : "Base de datos jedanix_notificaciones: propia del microservicio de Notificaciones, sin relaciones con el Núcleo.";
    ed.createNote(txt, new Pt(1210, 1060));
    ed.createNote("Base de datos jedanix_nucleo (PostgreSQL, Neon): 12 tablas del Núcleo de Prácticas.", new Pt(830, 1180));
  }
  TM.endTransaction();
  log("FIX OK");
} catch (e) { log("ERROR: " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_fix.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
