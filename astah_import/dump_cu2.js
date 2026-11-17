var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var ds = prj.getDiagrams(), dg = null;
for (var i = 0; i < ds.length; i++) if (String(ds[i].getName()) == "Diagrama de Casos de Uso") dg = ds[i];
function nm(m) { return m == null ? "null" : String(m.getName()).replace(/\s+/g, " "); }
var ps = dg.getPresentations();
for (var j = 0; j < ps.length; j++) {
  var p = ps[j], t = String(p.getType());
  if (t == "Association" || t == "Include" || t == "Extend" || t == "Generalization" || t.indexOf("Link") >= 0 || p.getSource) {
    try {
      var s = p.getSource(), d = p.getTarget();
      log(t + ": " + nm(s.getModel()) + " -> " + nm(d.getModel()));
    } catch (e) {}
  }
}
log("n=" + ps.length);
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_dump_cu2.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
