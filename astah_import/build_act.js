var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var be = P.editor.ModelEditorFactory.getBasicModelEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var DATA = JSON.parse(new java.lang.String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(BASE + "actividades.json")), "UTF-8"));
function fb(o, n) { var e = o.getOwnedElements(); for (var i = 0; i < e.length; i++) if (e[i].getName() == n) return e[i]; return null; }

var LW = 330, X0 = 40, Y0 = 170, ROW = 105, TOP = 60;
var COLORS = ["#E3F2FD", "#E8F5E9", "#FFF3E0", "#F3E5F5", "#ECEFF1"];

var JED = fb(prj, "jedanix"), PK = null;
try {
  TM.beginTransaction();
  var old = fb(JED, "actividades"); if (old) { be["delete"](old); log("paquete previo borrado"); }
  PK = be.createPackage(JED, "actividades");
  TM.endTransaction();
} catch (e) { log("PKG FAIL " + e); try { TM.abortTransaction(); } catch (e2) {} }

function lines(t) { return String(t).split("\n"); }
function estW(t) { var m = 0, ls = lines(t); for (var i = 0; i < ls.length; i++) m = Math.max(m, ls[i].length); return m * 7.4 + 30; }
function estH(t) { return 22 + 16 * lines(t).length; }

function build(d) {
  var ed = pa.getDiagramEditorFactory().getActivityDiagramEditor();
  ed.createActivityDiagram(PK, d.titulo);
  var nl = d.lanes.length, maxRow = 0, i;
  for (i = 0; i < d.nodes.length; i++) maxRow = Math.max(maxRow, d.nodes[i].row);
  var H = Y0 + maxRow * ROW + 120 - TOP;
  // carriles (rectángulos con tamaño explícito) + título
  for (i = 0; i < nl; i++) {
    var r = ed.createRect(new Pt(X0 + i * LW, TOP), LW, H);
    try { r.setProperty("fill.color", COLORS[i % COLORS.length]); } catch (e1) { log("lane color fail " + e1); }
    ed.createText(d.lanes[i], new Pt(X0 + i * LW + 20, TOP + 8));
  }
  var N = {}, nerr = 0;
  for (i = 0; i < d.nodes.length; i++) {
    var n = d.nodes[i], cx = X0 + n.lane * LW + LW / 2, y = Y0 + n.row * ROW, p = null;
    try {
      if (n.t == "ini") p = ed.createInitialNode("Inicio", new Pt(cx - 10, y));
      else if (n.t == "fin") p = ed.createFinalNode("Fin", new Pt(cx - 10, y));
      else if (n.t == "act") p = ed.createAction(n.txt, new Pt(cx - estW(n.txt) / 2, y));
      else if (n.t == "dec") {
        p = ed.createDecisionMergeNode(null, new Pt(cx - 15, y));
        ed.createText(n.txt, new Pt(cx + 24, y - 4));
      } else if (n.t == "fork") p = ed.createForkNode(null, new Pt(cx - 60, y), n.w, 8);
      else if (n.t == "ff") p = ed.createFlowFinalNode("Fin de flujo", new Pt(cx - 10, y));
      N[n.id] = p;
    } catch (e) { log("NODE FAIL " + n.id + " " + e); }
  }
  var nf = 0;
  var byId = {}; for (i = 0; i < d.nodes.length; i++) byId[d.nodes[i].id] = d.nodes[i];
  function B(p) { var l = p.getLocation(); return { l: l.getX(), t: l.getY(), r: l.getX() + p.getWidth(), b: l.getY() + p.getHeight(), cx: l.getX() + p.getWidth() / 2, cy: l.getY() + p.getHeight() / 2 }; }
  function P2(x, y) { return new Pt(x, y); }
  function route(f, lk) {
    var na = byId[f.a], nb = byId[f.b], a = B(N[f.a]), b = B(N[f.b]), pts = null;
    if (na.t == "fork") pts = [P2(b.cx, a.b), P2(b.cx, b.t)];
    else if (nb.t == "fork") pts = [P2(a.cx, a.b), P2(a.cx, b.t)];
    else if (f.bx < 0) {
      var ch = Math.min(a.l, b.l) - Math.abs(f.bx);
      pts = [P2(a.l, a.cy), P2(ch, a.cy), P2(ch, b.cy), P2(b.l, b.cy)];
    } else if (f.bx > 0) {
      var ch2 = Math.max(a.r, b.r) + f.bx;
      var startX = (na.lane > nb.lane) ? a.l : a.r;
      if (na.lane > nb.lane) { ch2 = b.r + f.bx; }
      pts = [P2(startX, a.cy), P2(ch2, a.cy), P2(ch2, b.cy), P2(b.r, b.cy)];
    } else if (na.lane != nb.lane && nb.row > na.row) {
      var sx = (b.cx > a.cx) ? a.r : a.l;
      pts = [P2(sx, a.cy), P2(b.cx, a.cy), P2(b.cx, b.t)];
    }
    if (pts) lk.setAllPoints(Java.to(pts, "java.awt.geom.Point2D[]"));
  }
  for (i = 0; i < d.flows.length; i++) {
    var f = d.flows[i];
    try {
      var lk = ed.createFlow(N[f.a], N[f.b]);
      if (f.g) { try { lk.getModel().setGuard(f.g); } catch (eg) { if (!nerr++) log("guard fail " + eg); } }
      try { route(f, lk); } catch (eb) { if (nerr++ < 3) log("route fail " + f.a + "->" + f.b + " " + eb); }
      nf++;
    } catch (e) { log("FLOW FAIL " + f.a + "->" + f.b + " " + e); }
  }
  log("OK " + d.key + ": nodos=" + d.nodes.length + " flujos=" + nf);
}
for (var q = 0; q < DATA.length; q++) {
  try { TM.beginTransaction(); build(DATA[q]); TM.endTransaction(); }
  catch (e) { log("DIAGRAMA FAIL " + DATA[q].key + " " + e); try { TM.abortTransaction(); } catch (e2) {} }
}
var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get(BASE + "log_act.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
