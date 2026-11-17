var out = [];
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var TM = P.editor.TransactionManager;
var dg = null, ds = prj.getDiagrams();
for (var i = 0; i < ds.length; i++) if (String(ds[i].getName()) == "Diagrama de Casos de Uso") dg = ds[i];
try {
  TM.beginTransaction();
  var ps = dg.getPresentations();
  for (var j = 0; j < ps.length; j++) {
    var m = null; try { m = ps[j].getModel(); } catch (e) {}
    if (m == null) continue;
    try { if (String(m.getName()) == "Coordinador de práctica") { m.setName("Coordinador de Práctica"); out.push("actor renombrado"); } } catch (e) {}
  }
  TM.endTransaction();
} catch (e) { out.push("ERROR " + e); try { TM.abortTransaction(); } catch (e2) {} }
try { out.push(String(dg.exportImage(BASE + "img_CU", "png", 1.0))); } catch (e) { out.push("export " + e); }
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_fix_cu3.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
