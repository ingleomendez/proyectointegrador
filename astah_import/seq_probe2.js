var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
try {
  function fb(o,n){var e=o.getOwnedElements();for(var i=0;i<e.length;i++)if(e[i].getName()==n)return e[i];return null;}
  var ds = fb(fb(prj,"jedanix"),"secuencias").getDiagrams(); var d = null;
  for (var i = 0; i < ds.length; i++) if (String(ds[i].getName()).indexOf("CU-01") >= 0) d = ds[i];
  var ps = d.getPresentations(); var shown = 0;
  for (var i = 0; i < ps.length && shown < 2; i++) {
    var p = ps[i];
    if (String(p.getType()) == "Message" || String(p.getType()).indexOf("Message") >= 0) {
      shown++;
      log("TYPE " + p.getType() + " model=" + p.getModel());
      var m = p.getModel().getClass().getMethods();
      var names = [];
      for (var j = 0; j < m.length; j++) { var n = String(m[j].getName()); if (/^(set|is)/.test(n)) names.push(n); }
      log("MODEL " + names.join(","));
      var pr = p.getProperties(); var ks = pr.keySet().toArray(); var kk = [];
      for (var j = 0; j < ks.length; j++) kk.push(ks[j] + "=" + pr.get(ks[j]));
      log("PROPS " + kk.join(" | "));
    }
  }
  var types = {}; for (var i = 0; i < ps.length; i++) types[String(ps[i].getType())] = 1;
  log("TYPES " + Object.keys(types).join(","));
} catch (e) { log("FAIL " + e); }
var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log_seqprobe2.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
