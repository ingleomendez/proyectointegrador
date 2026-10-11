var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
try {
  var diagrams = [];
  function walk(pkg) {
    var ds = pkg.getDiagrams(); for (var i = 0; i < ds.length; i++) diagrams.push(ds[i]);
    var els = pkg.getOwnedElements();
    for (var j = 0; j < els.length; j++) { if (els[j] instanceof P.model.IPackage) walk(els[j]); }
  }
  walk(prj);
  var d = null;
  for (var k = 0; k < diagrams.length; k++) { log("diag: " + diagrams[k].getName() + " [" + diagrams[k].getClass().getSimpleName() + "]"); if (String(diagrams[k].getName()) == "Diagrama de Casos de Uso") d = diagrams[k]; }
  if (d == null) { log("NO ENCONTRADO"); }
  else {
    var ps = d.getPresentations();
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var t = String(p.getType());
      var m = p.getModel();
      var s = "P " + t + " | " + (m != null ? String(m.getName()).replace(/\n/g, "\\n") : "null");
      if (t == "Association" || p instanceof P.presentation.ILinkPresentation) {
        try {
          s += " | src=" + p.getSourceEnd().getModel().getName() + " tgt=" + p.getTargetEnd().getModel().getName();
          var ends = m.getMemberEnds();
          s += " | ends=" + ends[0].getName() + "/" + ends[1].getName();
        } catch (e) { s += " | err " + e; }
      }
      log(s);
    }
  }
} catch (e) { log("ERROR: " + e); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_cu11probe.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
