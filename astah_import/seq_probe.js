var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
try {
  var ms = pa.getDiagramEditorFactory().getSequenceDiagramEditor().getClass().getMethods();
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i]; var ps = m.getParameterTypes(); var a = [];
    for (var j = 0; j < ps.length; j++) a.push(ps[j].getSimpleName());
    log("SEQ " + m.getReturnType().getSimpleName() + " " + m.getName() + "(" + a.join(",") + ")");
  }
} catch (e) { log("FAIL seq " + e); }
try {
  var ms = P.editor.ModelEditorFactory.getBasicModelEditor().getClass().getMethods();
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i]; if (!/Interaction|Lifeline|Message|Fragment|Note/i.test(m.getName())) continue;
    var ps = m.getParameterTypes(); var a = [];
    for (var j = 0; j < ps.length; j++) a.push(ps[j].getSimpleName());
    log("BASIC " + m.getReturnType().getSimpleName() + " " + m.getName() + "(" + a.join(",") + ")");
  }
} catch (e) { log("FAIL basic " + e); }
var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log_seqprobe.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
