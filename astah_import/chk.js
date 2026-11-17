var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var prj = P.AstahAPI.getAstahAPI().getProjectAccessor().getProject();
var out = [];
function tn(e) { try { return String(e.getClass().getInterfaces()[0].getSimpleName()); } catch (x) { return "?"; } }
function walk(e, d) {
  var els; try { els = e.getOwnedElements(); } catch (x) { return; }
  for (var i = 0; i < els.length; i++) {
    if (tn(els[i]) == "IEREntity") out.push(els[i].getPhysicalName() + "=" + (els[i].getPrimaryKeys().length + els[i].getNonPrimaryKeys().length));
    if (d < 5) walk(els[i], d + 1);
  }
}
walk(prj, 0);
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_chk.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
