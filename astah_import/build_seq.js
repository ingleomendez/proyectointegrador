var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var be = P.editor.ModelEditorFactory.getBasicModelEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var cfg = JSON.parse(new java.lang.String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(BASE + "seq_config.json")), "UTF-8"));
var DATA = JSON.parse(new java.lang.String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(BASE + "secuencias.json")), "UTF-8"));
var SOLO = cfg.solo; // lista de indices o null = todos

function findByName(owner, name) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getName() == name) return els[i]; }
  return null;
}
function clean(t) { return String(t).replace(/<br\/>/g, " ").replace(/\s+/g, " "); }

var JED = findByName(prj, "jedanix");
var PK = null;
try {
  TM.beginTransaction();
  var old = findByName(JED, "secuencias");
  if (old && !cfg.keep) { be["delete"](old); log("paquete previo borrado"); old = null; }
  PK = old || be.createPackage(JED, "secuencias");
  TM.endTransaction();
} catch (e) { log("PKG FAIL " + e); try { TM.abortTransaction(); } catch (e2) {} }

var STEP = 38, X0 = 110, DX = 235, Y0 = 135;

function build(d) {
  var ed = pa.getDiagramEditorFactory().getSequenceDiagramEditor();
  var dgm = ed.createSequenceDiagram(PK, d.titulo);
  var xs = {}, n = d.participantes.length;
  for (var i = 0; i < n; i++) xs[d.participantes[i].id] = X0 + i * DX;
  var xmin = X0 - 70, xmax = X0 + (n - 1) * DX + 70;

  // --- pase 1: layout (y de cada item, rectangulos de fragmentos)
  var y = Y0, depth = 0, stack = [], frags = [], rows = [];
  for (var k = 0; k < d.items.length; k++) {
    var it = d.items[k], t = it[0];
    if (t == "msg") {
      rows.push({ it: it, y: y });
      y += (it[1] == it[2]) ? STEP + 14 : STEP;
    } else if (t == "note") {
      rows.push({ it: it, y: y }); y += STEP + 8;
    } else if (t == "alt" || t == "opt" || t == "loop") {
      stack.push({ op: t, cond: it[1], y0: y, depth: depth, first: true });
      depth++; y += 34;
    } else if (t == "else") {
      var f = stack[stack.length - 1];
      frags.push({ op: f.op, cond: f.cond, y0: f.y0, y1: y - 6, depth: f.depth, first: f.first });
      f.cond = it[1]; f.y0 = y; f.first = false; y += 34;
    } else if (t == "end") {
      var f = stack.pop(); depth--;
      frags.push({ op: f.op, cond: f.cond, y0: f.y0, y1: y, depth: f.depth, first: f.first });
      y += 14;
    }
  }
  // --- lifelines
  var L = {};
  for (var i = 0; i < n; i++) {
    var p = d.participantes[i];
    L[p.id] = ed.createLifeline(clean(p.nombre), xs[p.id]);
  }
  // --- mensajes y notas
  var nmsg = 0, warned = {};
  for (var k = 0; k < rows.length; k++) {
    var r = rows[k], it = r.it;
    try {
      if (it[0] == "msg") {
        var a = L[it[1]], b = L[it[2]];
        var lk = ed.createMessage(clean(it[3]), a, b, r.y);
        try { lk.setProperty("parameter_visibility", "false"); } catch (e1) { if (!warned.pv) { log("pv fail " + e1); warned.pv = 1; } }
        if (it[4] == "ret") { var okd = false; var cand = ["dotted", "dash", "dashed_line", "dashed-line", "DASHED", "1"]; for (var c = 0; c < cand.length && !okd; c++) { try { lk.setProperty("line.type", cand[c]); okd = true; if (!warned.lt) { log("line.type ok=" + cand[c]); warned.lt = 1; } } catch (e2) {} } if (!okd && !warned.lt2) { log("line.type fail"); warned.lt2 = 1; } }
        if (it[4] == "async") { try { lk.getModel().setAsynchronous(true); } catch (e3) { if (!warned.as) { log("async fail " + e3); warned.as = 1; } } }
        nmsg++;
      } else {
        var nx = xs[it[1]] - 60;
        var nt = ed.createNote(clean(it[3]), new Pt(nx, r.y - 12));
      }
    } catch (e) { log("MSG FAIL [" + k + "] " + e); }
  }
  // --- fragmentos (los externos primero para que queden debajo)
  frags.sort(function (a, b) { return a.depth - b.depth; });
  var nf = 0;
  for (var k = 0; k < frags.length; k++) {
    var f = frags[k], ind = f.depth * 9;
    try {
      var nm = (f.first ? "" : "else ") + "[" + clean(f.cond) + "]";
      var cfp = ed.createCombinedFragment(nm, f.op, new Pt(xmin + ind, f.y0), (xmax - xmin) - 2 * ind, f.y1 - f.y0);
      nf++;
      try {
        var ops = cfp.getModel().getInteractionOperands();
        if (!warned.g1) { log("operandos=" + ops.length + " guard0=" + ops[0].getGuard()); var mm = ops[0].getClass().getMethods(); var ns = []; for (var z = 0; z < mm.length; z++) { var nn = String(mm[z].getName()); if (/uard|ame/.test(nn)) ns.push(nn); } log("opmethods " + ns.join(",")); warned.g1 = 1; }
        ops[0].setGuard(clean(f.cond));
      } catch (eg) { if (!warned.g2) { log("guard fail " + eg); warned.g2 = 1; } }
    } catch (e) { log("FRAG FAIL " + f.op + " " + e); }
  }
  log("OK " + d.key + ": mensajes=" + nmsg + " fragmentos=" + nf + " alto=" + y);
}

for (var q = 0; q < DATA.length; q++) {
  if (SOLO && SOLO.indexOf(q) < 0) continue;
  try { TM.beginTransaction(); build(DATA[q]); TM.endTransaction(); }
  catch (e) { log("DIAGRAMA FAIL " + DATA[q].key + " " + e); try { TM.abortTransaction(); } catch (e2) {} }
}
var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get(BASE + "log_seq.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
