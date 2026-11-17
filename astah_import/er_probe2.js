var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
try {
  var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
  var prj = pa.getProject();
  function walk(el, depth, path) {
    var els = el.getOwnedElements();
    for (var i = 0; i < els.length; i++) {
      var e = els[i], cn = String(e.getClass().getInterfaces()[0].getSimpleName());
      var pad = new Array(depth + 1).join("  ");
      if (cn.indexOf("IER") == 0 || cn == "IPackage" || cn == "IModel") {
        var extra = "";
        if (cn == "IEREntity") {
          var at = e.getERAttributes ? "" : "";
          extra = " L=" + e.getLogicalName() + " P=" + e.getPhysicalName() + " type=" + e.getType();
        }
        log(pad + cn + " " + e.getName() + extra);
      }
      if (cn == "IPackage" || cn.indexOf("IERPackage") == 0 || cn == "IERModel" || cn == "IERSchema") walk(e, depth + 1);
      else if (cn == "IEREntity") {
        var s = [];
        var pk = e.getPrimaryKeys(), npk = e.getNonPrimaryKeys();
        for (var k = 0; k < pk.length; k++) s.push(pk[k].getName() + "(PK)");
        for (var k = 0; k < npk.length; k++) s.push(npk[k].getName());
        log(pad + "   attrs: " + s.join(", "));
        var rels = e.getChildrenRelationships();
        for (var r = 0; r < rels.length; r++) log(pad + "   hijo-rel: " + rels[r].getName() + " -> " + rels[r].getChild().getName() + " card=" + rels[r].getCardinality() + " " + rels[r].getClass().getInterfaces()[0].getSimpleName());
      }
    }
  }
  walk(prj, 0);
  // diagramas ER: contenido
  var seen = [];
  function walkD(pkg) {
    var ds = pkg.getDiagrams();
    for (var i = 0; i < ds.length; i++) {
      var ifs = ds[i].getClass().getInterfaces()[0].getSimpleName();
      if (ifs == "IERDiagram") {
        var ps = ds[i].getPresentations(); var n = {};
        for (var j = 0; j < ps.length; j++) { var t = String(ps[j].getType()); n[t] = (n[t] || 0) + 1; }
        var d = []; for (var k in n) d.push(k + "=" + n[k]);
        log("DIAGRAMA " + ds[i].getName() + " notation=" + ds[i].getNotation() + " modelType=" + ds[i].getModelType() + " :: " + d.join(" ") + " owner=" + ds[i].getOwner().getName());
      }
    }
    var els = pkg.getOwnedElements();
    for (var k2 = 0; k2 < els.length; k2++) { try { walkD(els[k2]); } catch (e2) {} }
  }
  walkD(prj);
} catch (e) { log("ERROR: " + e + " @" + e.lineNumber); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_probe2.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
