var out = [];
var P = Packages.com.change_vision.jude.api.inf;
var BASE = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\";
var prj = P.AstahAPI.getAstahAPI().getProjectAccessor().getProject();
var ds = prj.getDiagrams();
for (var i = 0; i < ds.length; i++) {
  var n = String(ds[i].getName());
  if (n == "Diagrama de Casos de Uso") { try { out.push(String(ds[i].exportImage(BASE + "img_CU", "png", 1.0))); } catch (e) { out.push("ERR " + e); } }
}
var w = new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(BASE + "log_exp_cu.txt"), "UTF-8"));
w.print(out.join("\n")); w.close();
