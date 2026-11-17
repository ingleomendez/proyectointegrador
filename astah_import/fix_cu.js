var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var TM = P.editor.TransactionManager;
var be = pa.getModelEditorFactory().getBasicModelEditor();
var Pt = java.awt.geom.Point2D.Double;
function tn(e) { try { return String(e.getClass().getInterfaces()[0].getSimpleName()); } catch (x) { return "?"; } }
var MAP = [["practica", "práctica"], ["Coordinador de practica", "Coordinador de práctica"]];
function fix(s) { return s.replace(/practica/g, "práctica").replace(/Practica/g, "Práctica"); }
var dg = null, ds = prj.getDiagrams();
for (var i = 0; i < ds.length; i++) if (String(ds[i].getName()) == "Diagrama de Casos de Uso") dg = ds[i];
try {
  TM.beginTransaction();
  var ps = dg.getPresentations();
  var pres = {};
  for (var j = 0; j < ps.length; j++) {
    var m = null; try { m = ps[j].getModel(); } catch (e) {}
    if (m == null) continue;
    var t = tn(m);
    if (t == "IUseCase" || t == "IActor") {
      var n = String(m.getName()), n2 = fix(n);
      if (n2 != n) { m.setName(n2); log("renombrado: " + n.replace(/\s+/g, " ") + " -> " + n2.replace(/\s+/g, " ")); }
      pres[String(m.getName()).replace(/\s+/g, " ")] = ps[j];
    }
  }
  // curva del enlace Estudiante -> CU-11 para no cruzar CU-05
  var c05 = null, c11 = null;
  for (var k in pres) { if (k.indexOf("CU-05") == 0) c05 = pres[k]; if (k.indexOf("CU-11") == 0) c11 = pres[k]; }
  for (var j = 0; j < ps.length; j++) {
    var p = ps[j];
    if (String(p.getType()) != "Association") continue;
    try {
      var a = p.getSource().getModel(), b = p.getTarget().getModel();
      var sa = String(a.getName()), sb = String(b.getName());
      if (sa == "Estudiante" && sb.indexOf("CU-11") == 0) {
        var pts = p.getAllPoints();
        var r5 = c05.getRectangle();
        var bend = new Pt(r5.getMaxX() + 150, r5.getY() + 22);
        p.setAllPoints([pts[0], bend, pts[pts.length - 1]]);
        log("enlace Estudiante-CU-11 curvado en " + bend.getX() + "," + bend.getY());
      }
    } catch (e) { log("enlace " + e); }
  }
  TM.endTransaction();
  log("OK");
} catch (e) { log("ERROR " + e + " @" + e.lineNumber); try { TM.abortTransaction(); } catch (e2) {} }
try { log(String(dg.exportImage(BASE + "img_CU", "png", 1.0))); } catch (e) { log("export " + e); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_fix_cu.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
