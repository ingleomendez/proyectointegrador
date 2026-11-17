var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var counts = {};
function tn(e) { try { return String(e.getClass().getInterfaces()[0].getSimpleName()); } catch (x) { return "?"; } }
function walk(e, depth) {
  var els;
  try { els = e.getOwnedElements(); } catch (x) { return; }
  for (var i = 0; i < els.length; i++) {
    var t = tn(els[i]);
    counts[t] = (counts[t] || 0) + 1;
    if (t == "IUseCase" || t == "IActor" || t.indexOf("Requirement") >= 0) {
      var d = ""; try { d = String(els[i].getDefinition()).replace(/\s+/g, " ").substring(0, 160); } catch (x) {}
      log(t + " | " + els[i].getName() + " | " + d);
    }
    if (depth < 8) walk(els[i], depth + 1);
  }
}
walk(prj, 0);
var s = "";
for (var k in counts) s += k + "=" + counts[k] + "; ";
log("TIPOS: " + s);
// diagramas de casos de uso: elementos y enlaces
try {
  var ds = prj.getDiagrams();
  for (var i = 0; i < ds.length; i++) log("DIAG " + ds[i].getName() + " [" + tn(ds[i]) + "]");
} catch (x) { log("diag " + x); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_dump_cu.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
