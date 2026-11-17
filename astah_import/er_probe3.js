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
  log("== " + ds[i].getName() + " type=" + ds[i].getModelType() + " level=" + ds[i].getInitialDisplayLevel());
  var pr = ds[i].getProperties(); var it = pr.keySet().iterator();
  var ks = []; while (it.hasNext()) { var k = it.next(); ks.push(k + "=" + pr.get(k)); }
  ks.sort(); log(ks.join("\n"));
  // presentacion de entidad
  var ps = ds[i].getPresentations();
  for (var j = 0; j < ps.length; j++) {
    var t = String(ps[j].getType());
    if (t == "EREntity") {
      var pp = ps[j].getProperties(); var it2 = pp.keySet().iterator(); var k2 = [];
      while (it2.hasNext()) { var kk = it2.next(); k2.push(kk + "=" + pp.get(kk)); }
      k2.sort(); log("entidad " + ps[j].getLabel() + " :: " + k2.join(" | ")); break;
    }
  }
  for (var j = 0; j < ps.length; j++) {
    var t = String(ps[j].getType());
    if (t.indexOf("Relationship") >= 0) {
      var pp = ps[j].getProperties(); var it2 = pp.keySet().iterator(); var k2 = [];
      while (it2.hasNext()) { var kk = it2.next(); k2.push(kk + "=" + pp.get(kk)); }
      k2.sort(); log("relacion tipo=" + t + " :: " + k2.join(" | ")); break;
    }
  }
  break;
}
// metodos de ILinkPresentation
var c = java.lang.Class.forName("com.change_vision.jude.api.inf.presentation.ILinkPresentation");
var ms = c.getMethods(); var a = [];
for (var i = 0; i < ms.length; i++) { var m = ms[i]; var pt = m.getParameterTypes(); var s = []; for (var j = 0; j < pt.length; j++) s.push(pt[j].getSimpleName()); a.push(m.getReturnType().getSimpleName() + " " + m.getName() + "(" + s.join(",") + ")"); }
a.sort(); log("== ILinkPresentation\n" + a.join("\n"));
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_probe3.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
