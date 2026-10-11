var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var be = P.editor.ModelEditorFactory.getBasicModelEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var DATA = JSON.parse(new java.lang.String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(BASE + "estados.json")), "UTF-8"));

function findByName(owner, name) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getName() == name) return els[i]; }
  return null;
}
// posiciones [x,y] por diagrama (ini = estado inicial, fin:NOMBRE = estado final)
var POS = {
  "E1_Postulacion": { ini: [60, 60], ini1: [900, 200], BORRADOR: [90, 260], PENDIENTE_DE_APROBACION: [450, 440], APROBADA: [90, 700], RECHAZADA: [1000, 700], FINALIZADA: [90, 960], "fin:FINALIZADA": [130, 1140], "fin:RECHAZADA": [1050, 900], nota0: [600, 60] },
  "E2_Avance": { ini: [500, 60], PENDIENTE_DE_REVISION: [450, 230], ACEPTADO: [60, 520], OBSERVADO: [900, 520], nota0: [700, 60] },
  "E3_Objetivos": { ini: [400, 60], PENDIENTE_DE_APROBACION: [350, 230], APROBADOS: [60, 520], RECHAZADOS: [800, 520], "fin:APROBADOS": [100, 700], nota0: [700, 60] },
  "E4_Notificacion": { ini: [200, 60], PENDIENTE: [150, 230], FALLIDA: [700, 450], ENVIADA: [150, 660], "fin:ENVIADA": [200, 840], nota0: [550, 60] }
};
function partes(lab) {
  var ls = String(lab).replace(/\\n/g, "\n").split("\n"), ev = [], gd = [], ac = [];
  for (var i = 0; i < ls.length; i++) {
    var l = ls[i].replace(/^\s+|\s+$/g, "");
    if (l.charAt(0) == "[") gd.push(l.replace(/^\[|\]$/g, ""));
    else if (l.charAt(0) == "/") ac.push(l.replace(/^\/\s*/, ""));
    else if (l) ev.push(l);
  }
  return { ev: ev.join(" "), gd: gd.join(" y "), ac: ac.join("; ") };
}

var JED = findByName(prj, "jedanix");
var PK = null;
try {
  TM.beginTransaction();
  var old = findByName(JED, "estados");
  if (old) { be["delete"](old); log("paquete previo borrado"); }
  PK = be.createPackage(JED, "estados");
  TM.endTransaction();
} catch (e) { log("PKG FAIL " + e); try { TM.abortTransaction(); } catch (e2) {} }

function build(d) {
  var ed = pa.getDiagramEditorFactory().getStateMachineDiagramEditor();
  var dg = ed.createStatemachineDiagram(PK, d.titulo);
  var pos = POS[d.key], S = {}, nt = 0, nerr = 0;
  function pt(k) { return new Pt(pos[k][0], pos[k][1]); }
  for (var i = 0; i < d.estados.length; i++) {
    var e = d.estados[i];
    S[e[0]] = ed.createState(e[0], null, pt(e[0]));
    try { S[e[0]].getModel().setDefinition(e[2].join("\n")); } catch (ex) { if (!nerr++) log("definition fail " + ex); }
  }
  var FIN = {};
  for (var i = 0; i < d.finales.length; i++) FIN[d.finales[i]] = ed.createFinalState(null, pt("fin:" + d.finales[i]));
  function tr(a, b, lab, isInit, bend) {
    var lk = ed.createTransition(a, b);
    if (bend && (bend[0] || bend[1]) && a != b) {
      try {
        var ap = lk.getAllPoints(); var p0 = ap[0], p1 = ap[ap.length - 1];
        var mid = new Pt((p0.getX() + p1.getX()) / 2 + bend[0], (p0.getY() + p1.getY()) / 2 + bend[1]);
        lk.setAllPoints(Java.to([p0, mid, p1], "java.awt.geom.Point2D[]"));
      } catch (exb) { if (!nerr++) log("bend fail " + exb); }
    }
    var p = partes(lab);
    try { var m = lk.getModel();
      if (isInit) { if (p.gd) m.setGuard(p.gd); var ac0 = p.ev + (p.ac ? " / " + p.ac : ""); if (ac0) m.setAction(ac0); }
      else { if (p.ev) m.setEvent(p.ev); if (p.gd) m.setGuard(p.gd); if (p.ac) m.setAction(p.ac); } } catch (ex) { if (!nerr++) log("transition label fail " + ex); }
    nt++;
  }
  for (var i = 0; i < d.inicial.length; i++) { var ini = ed.createInitialPseudostate(null, pt(i == 0 ? "ini" : "ini" + i)); tr(ini, S[d.inicial[i][0]], d.astah.ini[i], true); }
  for (var i = 0; i < d.trans.length; i++) { var t = d.trans[i]; try { tr(S[t[0]], S[t[1]], d.astah.trans[i][0], false, [d.astah.trans[i][1], d.astah.trans[i][2]]); } catch (ex) { log("TR FAIL " + t[0] + "->" + t[1] + " " + ex); } }
  for (var k in FIN) tr(S[k], FIN[k], "fin");
  for (var i = 0; i < d.notas.length; i++) ed.createNote(String(d.notas[i]).replace(/\\n/g, "\n"), pt("nota" + i));
  log("OK " + d.key + ": estados=" + d.estados.length + " transiciones=" + nt);
}
for (var q = 0; q < DATA.length; q++) {
  try { TM.beginTransaction(); build(DATA[q]); TM.endTransaction(); }
  catch (e) { log("DIAGRAMA FAIL " + DATA[q].key + " " + e); try { TM.abortTransaction(); } catch (e2) {} }
}
var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get(BASE + "log_est.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
