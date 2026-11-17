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
  var ents = schema.getEntities();
  for (var i = 0; i < ents.length; i++) {
    var e = ents[i];
    var at = e.getAttributes();
    var s = String(e.getLogicalName()) + ": ";
    for (var j = 0; j < at.length; j++) s += at[j].getLogicalName() + "[" + (at[j].isForeignKey() ? "FK" : "") + (at[j].isPrimaryKey() ? "PK" : "") + " id=" + at[j].getId() + "] ";
    log(s);
  }
  var ds = schema.getDiagrams();
  for (var i = 0; i < ds.length; i++) {
    var ps = ds[i].getPresentations();
    for (var j = 0; j < ps.length; j++) {
      if (String(ps[j].getType()) == "EREntity") { log(ds[i].getName() + " " + ps[j].getModel().getLogicalName() + " inv=[" + ps[j].getProperty("invisible_features") + "]"); break; }
    }
  }
} catch (e) { log("ERROR: " + e + " @" + e.lineNumber); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_v3a.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
