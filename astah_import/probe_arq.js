var out=[];
var P=Packages.com.change_vision.jude.api.inf;
var acc=P.AstahAPI.getAstahAPI().getProjectAccessor();
function meths(o,label){ out.push("== "+label); var ms=o.getClass().getMethods(); var s={}; for(var i=0;i<ms.length;i++){ var m=ms[i]; var sig=String(m.getName())+"("+Array.prototype.map.call(m.getParameterTypes(),function(t){return String(t.getSimpleName())}).join(",")+")"; s[sig]=1;} var k=[]; for(var x in s)k.push(x); k.sort(); out.push(k.join("\n")); }
var f=acc.getDiagramEditorFactory();
try{ meths(f.getComponentDiagramEditor(),"ComponentEditor"); }catch(e){out.push("ERR comp "+e);}
try{ meths(f.getClassDiagramEditor(),"ClassEditor"); }catch(e){out.push("ERR cls "+e);}
// existing component diagram
var prj=acc.getProject(); var seen={};
function walk(e,d){ var ds=null; try{ds=e.getDiagrams();}catch(x){} if(ds) for(var i=0;i<ds.length;i++){ var n=String(ds[i].getName()); if(n.indexOf("Componentes")>=0 && !seen[n]){ seen[n]=1; out.push("== DIAG "+n+" "+ds[i].getClass().getName()); var ps=ds[i].getPresentations(); for(var j=0;j<ps.length;j++){ var p=ps[j]; var t=String(p.getType()); var nm=""; try{nm=String(p.getLabel());}catch(x){} var loc=""; try{ var pt=p.getLocation(); loc=pt.x+","+pt.y+" "+p.getWidth()+"x"+p.getHeight(); }catch(x){} var mdl=""; try{ mdl=String(p.getModel().getClass().getInterfaces()[0].getSimpleName()); }catch(x){} out.push(t+" | "+nm+" | "+loc+" | "+mdl); if(j<3){ try{ var pr=p.getProperties(); var it=pr.keySet().iterator(); var ks=[]; while(it.hasNext()){var kk=it.next(); ks.push(kk+"="+pr.get(kk));} out.push("   PROPS "+ks.join("; ")); }catch(x){} } } } }
  var els; try{els=e.getOwnedElements();}catch(x){return;} for(var i=0;i<els.length;i++) if(d<8) walk(els[i],d+1); }
walk(prj,0);
var w=new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log_probe_arq.txt"),"UTF-8")); w.print(out.join("\n")); w.close();
