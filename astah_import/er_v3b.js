var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var ed = pa.getDiagramEditorFactory().getERDiagramEditor();
var TM = P.editor.TransactionManager;
function findIER(owner, rx) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getClass().getInterfaces()[0].getSimpleName() == rx) return els[i]; }
  return null;
}
var schema = findIER(findIER(prj, "IERModel"), "IERSchema");
try {
  TM.beginTransaction();
  var ents = schema.getEntities();
  for (var i = 0; i < ents.length; i++) {
    var e = ents[i];
    if (String(e.getPhysicalName()) == "empresas_receptoras") {
      var nk = e.getNonPrimaryKeys();
      for (var j = 0; j < nk.length; j++) {
        if (String(nk[j].getPhysicalName()) == "horas_requeridas") {
          nk[j].setLogicalName("Horas de práctica exigidas por el convenio");
          log("horas renombrado");
        }
      }
    }
  }
  var ds = schema.getDiagrams();
  for (var i = 0; i < ds.length; i++) {
    var dg = ds[i];
    if (String(dg.getName()) != "MER_JEDANIX") continue;
    var ps = dg.getPresentations();
    for (var j = 0; j < ps.length; j++) {
      if (String(ps[j].getType()) != "EREntity") continue;
      var fks = ps[j].getModel().getForeignKeys();
      var ids = [];
      for (var k = 0; k < fks.length; k++) ids.push(String(fks[k].getId()));
      if (ids.length > 0) {
        ps[j].setProperty("invisible_features", ids.join(","));
        log(ps[j].getModel().getLogicalName() + " ocultas=" + ids.length + " lee=[" + ps[j].getProperty("invisible_features") + "]");
      }
    }
  }
  TM.endTransaction();
  log("OK");
} catch (e) { log("ERROR: " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_v3b.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
