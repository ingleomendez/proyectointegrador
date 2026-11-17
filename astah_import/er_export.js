var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
function findIER(owner, rx) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getClass().getInterfaces()[0].getSimpleName() == rx) return els[i]; }
  return null;
}
var schema = findIER(findIER(prj, "IERModel"), "IERSchema");
var ds = schema.getDiagrams();
for (var i = 0; i < ds.length; i++) {
  var n = String(ds[i].getName());
  try {
    var f = ds[i].exportImage(BASE + "img_" + n, "png", 1.0);
    log("export " + n + " -> " + f + " pres=" + ds[i].getPresentations().length);
  } catch (e) { log("ERROR " + n + " " + e); }
}
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_export.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
