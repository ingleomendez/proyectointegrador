var P=Packages.com.change_vision.jude.api.inf;var acc=P.AstahAPI.getAstahAPI().getProjectAccessor();var prj=acc.getProject();var out=[];
function walk(e,d){var ds=null;try{ds=e.getDiagrams();}catch(x){} if(ds)for(var i=0;i<ds.length;i++){if(String(ds[i].getName()).indexOf("Arquitectonico")>=0){var ps=ds[i].getPresentations();for(var j=0;j<ps.length;j++){var p=ps[j];var t=String(p.getType());
 if(t=="Class"){var l=p.getLocation();out.push("N "+p.getLabel()+" "+l.x+","+l.y+" "+p.getWidth()+"x"+p.getHeight());}
 if(t=="Dependency"||t=="Line"||t=="Link"){var pts=p.getAllPoints();var s="L "+p.getLabel()+" :";for(var k=0;k<pts.length;k++)s+=" ("+pts[k].getX()+","+pts[k].getY()+")";out.push(s+" shape="+p.getProperty("line.shape"));}
 }}}
 var els;try{els=e.getOwnedElements();}catch(x){return;}for(var i=0;i<els.length;i++)if(d<8)walk(els[i],d+1);}
walk(prj,0);
var w=new java.io.PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log_lp.txt"),"UTF-8"));w.print(out.join("\n"));w.close();
