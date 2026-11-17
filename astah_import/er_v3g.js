var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;
function findIER(owner, rx) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getClass().getInterfaces()[0].getSimpleName() == rx) return els[i]; }
  return null;
}
var schema = findIER(findIER(prj, "IERModel"), "IERSchema");
// diagrama -> [fisico que se desplaza, dx]
var AJ = {
  "REL_1_Cuentas": { dx: 150, mover: ["usuarios", "empresas_receptoras", "preguntas_bitacora", "documentos_requeridos"] },
  "REL_2_Postulacion": { dx: 170, mover: ["postulaciones", "empresas_receptoras", "respuestas_bitacora", "preguntas_bitacora", "documentos_postulacion", "documentos_requeridos"] },
  "REL_3_Seguimiento": { dx: 70, mover: ["dias_trabajados", "soportes_avance"] }
};
try {
  TM.beginTransaction();
  var ds = schema.getDiagrams();
  for (var i = 0; i < ds.length; i++) {
    var n = String(ds[i].getName());
    if (!AJ[n]) continue;
    var ps = ds[i].getPresentations();
    for (var j = 0; j < ps.length; j++) {
      if (String(ps[j].getType()) != "EREntity") continue;
      var f = String(ps[j].getModel().getPhysicalName());
      for (var k = 0; k < AJ[n].mover.length; k++) {
        if (AJ[n].mover[k] == f) { var l = ps[j].getLocation(); ps[j].setLocation(new Pt(l.getX() + AJ[n].dx, l.getY())); log(n + " mueve " + f); }
      }
    }
  }
  TM.endTransaction();
  log("OK");
} catch (e) { log("ERROR: " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_v3g.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
