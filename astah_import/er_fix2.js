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
var ds = schema.getDiagrams();
try {
  TM.beginTransaction();
  for (var i = 0; i < ds.length; i++) {
    var dg = ds[i];
    if (String(dg.getName()).indexOf("Relacional") < 0) continue;
    var ps = dg.getPresentations();
    for (var j = 0; j < ps.length; j++) {
      var p = ps[j];
      if (String(p.getType()) == "EREntity" && String(p.getModel().getPhysicalName()) == "objetivo_practica") {
        p.setLocation(new Pt(10, 700));
        log("objetivo_practica movido");
      }
    }
  }
  TM.endTransaction(); log("FIX2 OK");
} catch (e) { log("ERROR: " + e); try { TM.abortTransaction(); } catch (e2) {} }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_fix2.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
