var out = [];
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var prj = P.AstahAPI.getAstahAPI().getProjectAccessor().getProject();
var seen = {};
var all = [];
function tn(e) { try { return String(e.getClass().getInterfaces()[0].getSimpleName()); } catch (x) { return "?"; } }
function addDs(e) {
  var ds = null; try { ds = e.getDiagrams(); } catch (x) { return; }
  if (ds == null) return;
  for (var i = 0; i < ds.length; i++) { var id = String(ds[i].getId()); if (!seen[id]) { seen[id] = 1; all.push(ds[i]); } }
}
function walk(e, d) {
  addDs(e);
  var els; try { els = e.getOwnedElements(); } catch (x) { return; }
  for (var i = 0; i < els.length; i++) if (d < 8) walk(els[i], d + 1);
}
walk(prj, 0);
for (var i = 0; i < all.length; i++) {
  var n = String(all[i].getName()), t = tn(all[i]);
  var ok = "";
  try { ok = String(all[i].exportImage(BASE + "img_all\\" + (i < 10 ? "0" : "") + i, "png", 1.0)); } catch (e) { ok = "ERR " + e; }
  out.push(i + " | " + t + " | " + n + " | " + ok);
}
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_list_diag.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
