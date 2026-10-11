// JEDANIX - construye los 5 diagramas de clases en el proyecto abierto de Astah
var P = Packages.com.change_vision.jude.api.inf;
var api = P.AstahAPI.getAstahAPI();
var pa = api.getProjectAccessor();
var proj = pa.getProject();
var LOGF = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log.txt";
var LOG = [];
function log(s) { LOG.push(String(s)); }
function flush() {
  var w = new java.io.OutputStreamWriter(new java.io.FileOutputStream(LOGF), "UTF-8");
  w.write(LOG.join("\n")); w.close();
}
// ---- indice de clases por nombre completo jedanix.pkg.Nombre
var IDX = {};
var JED = null;
function indexar(el, path) {
  var kids = el.getOwnedElements();
  for (var i = 0; i < kids.length; i++) {
    var k = kids[i];
    if (P.model.IPackage["class"].isInstance(k)) {
      if (path === "" && String(k.getName()) === "jedanix") JED = k;
      indexar(k, path === "" ? String(k.getName()) : path + "." + k.getName());
    } else if (P.model.IClass["class"].isInstance(k) && path.indexOf("jedanix") === 0) {
      var nm = String(k.getName());
      if (nm !== "") IDX[path + "." + nm] = k;
    }
  }
}
indexar(proj, "");
var editor = pa.getDiagramEditorFactory().getClassDiagramEditor();
var Pt = java.awt.geom.Point2D.Double;

function hacer(def) {
  var nodos = {};   // fq -> nodo
  var clases = {};  // fq -> IClass
  var diag = editor.createClassDiagram(JED, def.nombre);
  var all = [];
  for (var r = 0; r < def.filas.length; r++) for (var c = 0; c < def.filas[r].length; c++) all.push(def.filas[r][c]);
  for (var i = 0; i < all.length; i++) {
    var fq = all[i];
    var cls = IDX[fq];
    if (!cls) { log("NO ENCONTRADA: " + fq); continue; }
    var nd = editor.createNodePresentation(cls, new Pt(0, 0));
    nodos[fq] = nd; clases[fq] = cls;
    var est = (def.estereotipo || {})[fq];
    if (est) { try { cls.addStereotype(est); } catch (e) { log("estereotipo " + fq + ": " + e); } }
    var col = (def.color || {})[fq];
    if (col) { try { nd.setProperty("fill.color", col); } catch (e) { log("color " + fq + ": " + e); } }
    if ((def.sinOps || {})[fq]) {
      try { nd.setProperty("operation_compartment_visibility", "false"); nd.setProperty("attribute_compartment_visibility", "false"); } catch (e) { log("compartimentos " + fq + ": " + e); }
    }
  }
  // posicion por filas con tamaños reales
  var y = 40, GX = def.gx || 60, GY = def.gy || 110;
  var anchos = [], maxW = 0;
  for (var r = 0; r < def.filas.length; r++) {
    var wsum = 0, cnt = 0;
    for (var c = 0; c < def.filas[r].length; c++) { var nn = nodos[def.filas[r][c]]; if (nn) { wsum += nn.getWidth(); cnt++; } }
    wsum += GX * (cnt > 0 ? cnt - 1 : 0);
    anchos.push(wsum); if (wsum > maxW) maxW = wsum;
  }
  for (var r = 0; r < def.filas.length; r++) {
    var fila = def.filas[r], x = 40 + (maxW - anchos[r]) / 2, hmax = 0;
    for (var c = 0; c < fila.length; c++) {
      var n = nodos[fila[c]]; if (!n) continue;
      n.setLocation(new Pt(x, y));
      x += n.getWidth() + GX;
      if (n.getHeight() > hmax) hmax = n.getHeight();
    }
    y += hmax + GY;
  }
  // relaciones
  var nl = 0, errores = 0, vistos = {};
  for (var fq in clases) {
    var cls = clases[fq];
    var gens = cls.getGeneralizations();
    for (var g = 0; g < gens.length; g++) {
      var sup = gens[g].getSuperType();
      var supFq = null;
      for (var k in clases) { if (clases[k] === sup) { supFq = k; break; } }
      if (supFq) { try { editor.createLinkPresentation(gens[g], nodos[fq], nodos[supFq]); nl++; } catch (e) { errores++; log("gen " + fq + ": " + e); } }
    }
    var atts = cls.getAttributes();
    for (var a = 0; a < atts.length; a++) {
      var as = atts[a].getAssociation();
      if (!as) continue;
      var aid = String(as.getId());
      if (vistos[aid]) continue;
      var t = atts[a].getType();
      var tFq = null;
      for (var k in clases) { if (clases[k] === t) { tFq = k; break; } }
      if (!tFq) continue;
      vistos[aid] = true;
      try { editor.createLinkPresentation(as, nodos[fq], nodos[tFq]); nl++; }
      catch (e) { try { editor.createLinkPresentation(as, nodos[tFq], nodos[fq]); nl++; } catch (e2) { errores++; log("asoc " + fq + "->" + tFq + ": " + e2); } }
    }
  }
  var comps = def.comp || [];
  for (var ci = 0; ci < comps.length; ci++) {
    var W = clases[comps[ci][0]], Pt_ = clases[comps[ci][1]];
    if (!W || !Pt_) continue;
    var wa = W.getAttributes();
    for (var q = 0; q < wa.length; q++) {
      var asc = wa[q].getAssociation();
      if (asc && wa[q].getType() === Pt_) {
        var ends = asc.getMemberEnds();
        for (var e1 = 0; e1 < ends.length; e1++) {
          if (ends[e1].getType() === W) { try { ends[e1].setAggregationKind(P.model.IAttribute.COMPOSITION); } catch (ex) { log("comp: " + ex); } }
        }
      }
    }
  }
  log(def.nombre + ": nodos=" + all.length + " enlaces=" + nl + " errores=" + errores);
}

var DEFS = eval("(" + String(new java.lang.String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\defs.json")), "UTF-8")) + ")");
var SEL = (typeof SELECCION === "undefined") ? null : SELECCION;
try {
  P.editor.TransactionManager.beginTransaction();
  for (var d = 0; d < DEFS.length; d++) {
    if (SEL !== null && SEL.indexOf(d) < 0) continue;
    try { hacer(DEFS[d]); } catch (e) { log("ERROR en " + DEFS[d].nombre + ": " + e + (e.javaException ? " / " + e.javaException : "")); }
  }
  P.editor.TransactionManager.endTransaction();
} catch (e) {
  log("ERROR GENERAL: " + e);
  try { P.editor.TransactionManager.abortTransaction(); } catch (e3) {}
}
flush();
print("terminado, ver log.txt");
