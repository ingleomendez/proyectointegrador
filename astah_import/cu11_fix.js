var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var be = P.editor.ModelEditorFactory.getBasicModelEditor();
var TM = P.editor.TransactionManager;
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
  for (var k = 0; k < diagrams.length; k++) if (String(diagrams[k].getName()) == "Diagrama de Casos de Uso") d = diagrams[k];
  var ps = d.getPresentations();
  var est = null, uc11 = null, nEstUc11 = 0;
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i], m = p.getModel(), t = String(p.getType());
    if (t == "Class" && String(m.getName()) == "Estudiante") est = p;
    if (t == "UseCase" && String(m.getName()).indexOf("CU-11") == 0) uc11 = p;
  }
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i];
    if (String(p.getType()) == "Association") {
      var a = String(p.getSourceEnd().getModel().getName()), b = String(p.getTargetEnd().getModel().getName());
      if ((a == "Estudiante" && b.indexOf("CU-11") == 0) || (b == "Estudiante" && a.indexOf("CU-11") == 0)) nEstUc11++;
    }
  }
  log("est=" + (est != null) + " uc11=" + (uc11 != null) + " asociacionesPrevias=" + nEstUc11);
  TM.beginTransaction();
  try {
    uc11.getModel().setName("CU-11\nGestionar objetivos de la practica");
    log("renombrado: " + String(uc11.getModel().getName()).replace(/\n/g, "\\n"));
    if (nEstUc11 == 0) {
      var as = be.createAssociation(est.getModel(), uc11.getModel(), "", "", "");
      var ed = pa.getDiagramEditorFactory().getUseCaseDiagramEditor();
      ed.setDiagram(d);
      ed.createLinkPresentation(as, est, uc11);
      log("asociacion Estudiante-CU-11 creada");
    }
    TM.endTransaction();
    log("OK");
  } catch (e) { try { TM.abortTransaction(); } catch (e2) {} log("ERROR: " + e); }
} catch (e) { log("ERROR GENERAL: " + e); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_cu11fix.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
