var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var be = P.editor.ModelEditorFactory.getBasicModelEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;
function fb(o, n) { var e = o.getOwnedElements(); for (var i = 0; i < e.length; i++) if (e[i].getName() == n) return e[i]; return null; }
try {
  TM.beginTransaction();
  var JED = fb(prj, "jedanix");
  var old = fb(JED, "actividades"); if (old) be["delete"](old);
  var PK = be.createPackage(JED, "actividades");
  var ed = pa.getDiagramEditorFactory().getActivityDiagramEditor();
  var dg = ed.createActivityDiagram(PK, "TEST");
  var p1 = null, p2 = null, p3 = null;
  try { p1 = ed.createPartition(null, null, "Estudiante", true); log("p1 ok loc=" + p1.getLocation() + " w=" + p1.getWidth() + " h=" + p1.getHeight()); } catch (e) { log("p1 fail " + e); }
  try { p2 = ed.createPartition(p1, null, "Director", true); log("p2 ok(p1,null) loc=" + p2.getLocation() + " w=" + p2.getWidth()); } catch (e) { log("p2 fail " + e); }
  try { p3 = ed.createPartition(p2, null, "Sistema", true); log("p3 ok loc=" + p3.getLocation() + " w=" + p3.getWidth()); } catch (e) { log("p3 fail " + e); }
  var i0 = ed.createInitialNode("Inicio", new Pt(60, 60));
  var a1 = ed.createAction("Enviar solicitud", new Pt(60, 150));
  var a2 = ed.createAction("Revisar", new Pt(300, 250));
  var d1 = ed.createDecisionMergeNode(null, new Pt(320, 340));
  ed.createFlow(i0, a1); ed.createFlow(a1, a2); var fl = ed.createFlow(a2, d1);
  try { fl.getModel().setGuard("ok"); log("guard ok"); } catch (e) { log("guard fail " + e); }
  TM.endTransaction();
  log("DONE");
} catch (e) { log("FAIL " + e); try { TM.abortTransaction(); } catch (e2) {} }
var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log_acttest.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
