var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
function dump(cls) {
  try {
    var c = java.lang.Class.forName(cls);
    log("== " + cls);
    var ms = c.getMethods();
    var arr = [];
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i]; var ps = m.getParameterTypes(); var s = [];
      for (var j = 0; j < ps.length; j++) s.push(ps[j].getSimpleName());
      arr.push("  " + m.getReturnType().getSimpleName() + " " + m.getName() + "(" + s.join(", ") + ")");
    }
    arr.sort(); log(arr.join("\n"));
  } catch (e) { log("no existe " + cls + " : " + e); }
}
try {
  var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
  dump("com.change_vision.jude.api.inf.editor.ModelEditorFactory");
  dump("com.change_vision.jude.api.inf.editor.ERModelEditor");
  dump("com.change_vision.jude.api.inf.editor.IERDiagramEditor");
  dump("com.change_vision.jude.api.inf.editor.ERDiagramEditor");
  dump("com.change_vision.jude.api.inf.editor.DiagramEditorFactory");
  dump("com.change_vision.jude.api.inf.model.IERSchema");
  dump("com.change_vision.jude.api.inf.model.IEREntity");
  dump("com.change_vision.jude.api.inf.model.IERAttribute");
  dump("com.change_vision.jude.api.inf.model.IERRelationship");
  dump("com.change_vision.jude.api.inf.model.IERDiagram");
  dump("com.change_vision.jude.api.inf.model.IERDatatype");
  // diagramas existentes de tipo ER
  var prj = pa.getProject();
  var found = [];
  function walk(pkg) {
    var ds = pkg.getDiagrams();
    for (var i = 0; i < ds.length; i++) {
      var ifs = ds[i].getClass().getInterfaces(); var n = [];
      for (var j = 0; j < ifs.length; j++) n.push(ifs[j].getSimpleName());
      found.push(ds[i].getName() + " [" + n.join(",") + "]");
    }
    var els = pkg.getOwnedElements();
    for (var k = 0; k < els.length; k++) { if (els[k] instanceof P.model.IPackage) walk(els[k]); }
  }
  walk(prj);
  log("== diagramas\n" + found.join("\n"));
} catch (e) { log("ERROR: " + e); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_er_probe.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
