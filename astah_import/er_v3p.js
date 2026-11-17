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
function meths(o, t) {
  log("== " + t);
  var m = o.getClass().getInterfaces()[0].getMethods();
  var s = [];
  for (var i = 0; i < m.length; i++) s.push(m[i].getReturnType().getSimpleName() + " " + m[i].getName());
  s.sort(); log(s.join("\n"));
}
try {
  var e = schema.getEntities()[0];
  meths(e, "entity");
  var ps = schema.getDiagrams()[0].getPresentations();
  for (var j = 0; j < ps.length; j++) if (String(ps[j].getType()) == "EREntity") { meths(ps[j], "pres"); break; }
} catch (x) { log("ERR " + x); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_v3p.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
