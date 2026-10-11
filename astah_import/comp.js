var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var proj = pa.getProject();
var LOG = [];
var vals = P.model.AggregationKind.values();
var comp = null;
for (var i = 0; i < vals.length; i++) { LOG.push("kind " + vals[i].name()); if (String(vals[i].name()).indexOf("COMPOS") >= 0) comp = vals[i]; }
var IDX = {};
function indexar(el, path) {
  var kids = el.getOwnedElements();
  for (var i = 0; i < kids.length; i++) {
    var k = kids[i];
    if (P.model.IPackage["class"].isInstance(k)) indexar(k, path === "" ? String(k.getName()) : path + "." + k.getName());
    else if (P.model.IClass["class"].isInstance(k) && path.indexOf("jedanix") === 0) { var nm = String(k.getName()); if (nm !== "") IDX[path + "." + nm] = k; }
  }
}
indexar(proj, "");
var DEFS = eval("(" + String(new java.lang.String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\defs.json")), "UTF-8")) + ")");
var n = 0;
try {
  P.editor.TransactionManager.beginTransaction();
  for (var d = 0; d < DEFS.length; d++) {
    var comps = DEFS[d].comp || [];
    for (var ci = 0; ci < comps.length; ci++) {
      var W = IDX[comps[ci][0]], Pp = IDX[comps[ci][1]];
      if (!W || !Pp) { LOG.push("no encontrada " + comps[ci]); continue; }
      var wa = W.getAttributes();
      for (var q = 0; q < wa.length; q++) {
        var asc = wa[q].getAssociation();
        if (asc && wa[q].getType() === Pp) {
          var ends = asc.getMemberEnds();
          for (var e1 = 0; e1 < ends.length; e1++) {
            if (ends[e1].getType() === W) { ends[e1].setAggregationKind(comp); n++; }
          }
        }
      }
    }
  }
  P.editor.TransactionManager.endTransaction();
} catch (e) { LOG.push("ERROR " + e); try { P.editor.TransactionManager.abortTransaction(); } catch (e2) {} }
LOG.push("composiciones aplicadas: " + n);
var w = new java.io.OutputStreamWriter(new java.io.FileOutputStream("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log.txt"), "UTF-8");
w.write(LOG.join("\n")); w.close();
print(LOG.join(" / "));
