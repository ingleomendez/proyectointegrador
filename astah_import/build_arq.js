var out = [];
function log(s) { out.push(String(s)); }
var P = Packages.com.change_vision.jude.api.inf;
var pa = P.AstahAPI.getAstahAPI().getProjectAccessor();
var prj = pa.getProject();
var be = P.editor.ModelEditorFactory.getBasicModelEditor();
var ed = pa.getDiagramEditorFactory().getClassDiagramEditor();
var TM = P.editor.TransactionManager;
var Pt = java.awt.geom.Point2D.Double;

function findByName(owner, name) {
  var els = owner.getOwnedElements();
  for (var i = 0; i < els.length; i++) { if (els[i].getName() == name) return els[i]; }
  return null;
}
function mk(el, x, y, w, h, color, parent) {
  var p = parent ? ed.createNodePresentation(el, parent, new Pt(x, y)) : ed.createNodePresentation(el, new Pt(x, y));
  if (color) { try { p.setProperty("fill.color", color); } catch (e) { log("color fail " + e); } }
  return p;
}
function dep(a, b, label, thick, dashed) {
  try {
    var d = be.createDependency(a.el, b.el, label);
    var lp = ed.createLinkPresentation(d, a.pr, b.pr);
    if (thick) { try { lp.setProperty("line.width", "3"); } catch (e) {} }
    return lp;
  } catch (e) { log("dep fail " + label + " : " + e); }
}
function limpiar(nombre) {
  var JED = findByName(prj, "jedanix");
  var old = findByName(JED, nombre);
  if (old) { be.delete(old); log("borrado previo " + nombre); }
  return JED;
}
function diagramaDe(rx) {
  var ds = prj.getDiagrams();
  for (var i = 0; i < ds.length; i++) {
    var ifs = ds[i].getClass().getInterfaces();
    for (var j = 0; j < ifs.length; j++) { if (rx.test(ifs[j].getName())) return ds[i]; }
  }
  return null;
}

// ---- limpieza de pruebas
try {
  TM.beginTransaction();
  ["TestNodo", "TestComp", "TestArt"].forEach(function (n) { var e = findByName(prj, n); if (e) { be.delete(e); log("borrado " + n); } });
  TM.endTransaction();
} catch (e) { log("limpieza fail " + e); try { TM.abortTransaction(); } catch (e2) {} }

// =================== COMPONENTES ===================
if (typeof SOLO === "undefined" || SOLO !== "desp") {
try {
  TM.beginTransaction();
  var JED = limpiar("arq_componentes");
  var arq = be.createPackage(JED, "arq_componentes");
  var dc = diagramaDe(/IComponentDiagram/);
  log("diagrama comp = " + (dc ? dc.getName() : "NULL"));
  dc.setName("Diagrama de Componentes - JEDANIX");
  ed.setDiagram(dc);
  function sub(name, x, y, w, h, color) {
    var r = ed.createRect(new Pt(x, y), w, h);
    try { r.setProperty("fill.color", color); } catch (e) { log("rect color fail " + e); }
    var t = ed.createText(name, new Pt(x + 10, y + 10));
    return { el: null, pr: r };
  }
  function comp(parent, name, x, y, def, stereo, color) {
    var c = be.createComponent(arq, name);
    if (def) c.setDefinition(def);
    if (stereo) { try { c.addStereotype(stereo); } catch (e) { log("stereo fail " + e); } }
    return { el: c, pr: mk(c, x, y, 210, 50, color || "#FFFFFF", null) };
  }
  var fe = sub("Frontend SPA - Angular 22 + Material", 30, 40, 300, 440, "#E3F2FD");
  var nu = sub("Nucleo de Practicas - FastAPI (Python)", 380, 40, 300, 620, "#E8F5E9");
  var no = sub("Servicio de Notificaciones - Node 22 + Express 5", 730, 40, 300, 620, "#FFF3E0");
  var feP = comp(fe, "Paneles por rol", 70, 100, "Director, Coordinador, Docente asesor, Estudiante");
  var feS = comp(fe, "Servicios HTTP", 70, 195, "ApiService, EmpresaService, PostulacionService, AvanceService");
  var feA = comp(fe, "Autenticacion", 70, 290, "AuthService, authGuard, authInterceptor (JWT)");
  var feW = comp(fe, "Despertador", 70, 385, "despertarNotificaciones(): fetch /salud (no-cors), maximo cada 5 min, desde authInterceptor en peticiones no GET");
  var nuSeg = comp(nu, "Seguridad", 420, 100, "JWT HS256 (python-jose), bcrypt, requiere_rol (RBAC)");
  var nuR = comp(nu, "Routers REST", 420, 195, "/auth /usuarios /empresas /postulaciones /objetivos /avances /archivos /health");
  var nuSv = comp(nu, "Servicios de negocio", 420, 290, "Reglas de CU-01 a CU-12, excepciones de dominio");
  var nuC = comp(nu, "Cliente de notificaciones", 420, 385, "HTTP fire-and-forget, hilo daemon, 24 reintentos x 10 s (429/500/502/503/504)");
  var nuRp = comp(nu, "Repositorios", 420, 480, "SQLAlchemy 2, Alembic; archivos en tabla archivos_subidos");
  var nuDb = comp(nu, "BD jedanix_nucleo", 420, 575, "PostgreSQL en Neon", "database", "#ECEFF1");
  var noA = comp(no, "API de eventos", 770, 100, "POST /eventos, GET /eventos/tipos, GET /notificaciones, POST /notificaciones/:id/reenviar, GET /salud; cabecera X-API-Key");
  var noPl = comp(no, "Plantillas", 770, 195, "15 tipos de evento, HTML + texto");
  var noEn = comp(no, "Despachador de correo", 770, 290, "Brevo API, SMTP o simulado");
  var noJ = comp(no, "Job de reintentos", 770, 385, "cada 60 s, maximo 5 intentos");
  var noRp = comp(no, "Repositorio pg", 770, 480, "Pool max 5, prepararBaseDeDatos() con reintentos");
  var noDb = comp(no, "BD jedanix_notificaciones", 770, 575, "Tabla notificaciones: PENDIENTE / ENVIADA / FALLIDA. PostgreSQL en Neon", "database", "#ECEFF1");
  var br = comp(null, "Brevo", 1120, 300, "API transaccional v3; remitente verificado antiyakecho@gmail.com", "external system", "#F3E5F5");
  dep(feP, feS, "usa");
  dep(feS, feA, "adjunta JWT");
  dep(feA, nuR, "REST/HTTPS JSON + Bearer JWT", true);
  dep(feW, noA, "GET /salud (despertar)");
  dep(nuR, nuSeg, "valida rol");
  dep(nuR, nuSv, "delega");
  dep(nuSv, nuRp, "usa");
  dep(nuSv, nuC, "evento");
  dep(nuRp, nuDb, "SQL / TLS");
  dep(nuC, noA, "POST /eventos + X-API-Key", true);
  dep(noA, noPl, "genera mensaje");
  dep(noPl, noEn, "envia");
  dep(noA, noRp, "guarda");
  dep(noJ, noRp, "lee pendientes");
  dep(noJ, noEn, "reintenta");
  dep(noRp, noDb, "SQL / TLS");
  dep(noEn, br, "HTTPS 443 POST /v3/smtp/email");
  TM.endTransaction();
  log("COMPONENTES OK");
} catch (e) { log("COMPONENTES FAIL " + e); try { TM.abortTransaction(); } catch (e2) {} }
}

// =================== DESPLIEGUE ===================
try {
  TM.beginTransaction();
  var JED2 = limpiar("arq_despliegue");
  var arq2 = be.createPackage(JED2, "arq_despliegue");
  var dd = diagramaDe(/IDeploymentDiagram/);
  log("diagrama desp = " + (dd ? dd.getName() : "NULL"));
  dd.setName("Diagrama de Despliegue - JEDANIX");
  ed.setDiagram(dd);
  function nodo(name, stereo, x, y, w, h, color, parent, def) {
    var n = be.createNode(arq2, name);
    if (stereo) { try { n.addStereotype(stereo); } catch (e) { log("stereo fail " + e); } }
    if (def) n.setDefinition(def);
    return { el: n, pr: mk(n, x, y, w, h, color, parent ? parent.pr : null) };
  }
  function arte(name, x, y, w, h, parent, def) {
    var a = be.createArtifact(arq2, name);
    if (def) a.setDefinition(def);
    return { el: a, pr: mk(a, x, y, w, h, "#FFFFFF", parent.pr) };
  }
  var nDev = nodo("PC del desarrollador", "device", 40, 40, 260, 140, "#ECEFF1");
  var aGit = arte("Git + VS Code (monorepo JEDANIX)", 60, 90, 220, 70, nDev, "git push origin main");
  var nGh = nodo("GitHub", "cloud", 580, 40, 340, 160, "#ECEFF1");
  var aRepo = arte("ingleomendez/proyectointegrador", 600, 90, 300, 90, nGh, "jedanix-frontend/, jedanix-nucleo-practicas/, jedanix-notificaciones/, render.yaml (Blueprint)");
  var nCf = nodo("Cloudflare Pages (plan Free)", "cloud - CDN", 40, 400, 300, 160, "#FFF3E0", null, "https://jedanix-practicas.pages.dev");
  var aDist = arte("dist/jedanix-frontend/browser", 60, 460, 260, 80, nCf, "index.html, main.js, styles.css. Build: npm run build (NODE_VERSION=22)");
  var nUsr = nodo("Computador del usuario", "device", 620, 400, 320, 230, "#E3F2FD");
  var nNav = nodo("Navegador web", "execution environment", 640, 450, 280, 160, "#FFFFFF", nUsr);
  var aSpa = arte("SPA JEDANIX (Angular 22 + Material)", 660, 500, 240, 80, nNav, "JWT en la sesion del navegador");
  var nRn = nodo("Render - jedanix-nucleo", "Web Service Free", 40, 780, 330, 240, "#E8F5E9", null, "https://jedanix-nucleo.onrender.com - duerme tras 15 min sin trafico");
  var nRnE = nodo("Python 3 + Uvicorn", "execution environment", 60, 830, 290, 170, "#FFFFFF", nRn);
  var aNu = arte("jedanix-nucleo-practicas", 80, 880, 250, 80, nRnE, "FastAPI, SQLAlchemy 2, Alembic; migraciones al arrancar");
  var nRt = nodo("Render - jedanix-notificaciones", "Web Service Free", 700, 780, 330, 240, "#E8F5E9", null, "https://jedanix-notificaciones.onrender.com - duerme tras 15 min sin trafico");
  var nRtE = nodo("Node 22", "execution environment", 720, 830, 290, 170, "#FFFFFF", nRt);
  var aNo = arte("jedanix-notificaciones", 740, 880, 250, 80, nRtE, "Express 5, pg, job de reintentos; escucha en $PORT");
  var nNe = nodo("Neon (plan Free)", "cloud", 40, 1240, 600, 240, "#F3E5F5", null, "Un proyecto Neon por servicio, TLS obligatorio");
  var nDb1 = nodo("PostgreSQL (nucleo)", "database server", 60, 1290, 260, 170, "#FFFFFF", nNe);
  var aDb1 = arte("jedanix_nucleo", 80, 1340, 220, 80, nDb1, "usuarios, empresas, postulaciones, objetivos, avances, archivos_subidos");
  var nDb2 = nodo("PostgreSQL (notificaciones)", "database server", 340, 1290, 280, 170, "#FFFFFF", nNe);
  var aDb2 = arte("jedanix_notificaciones", 360, 1340, 240, 80, nDb2, "tabla notificaciones: PENDIENTE / ENVIADA / FALLIDA");
  var nBr = nodo("Brevo", "cloud - SaaS", 960, 1240, 260, 170, "#FCE4EC", null, "api.brevo.com");
  var aBr = arte("API transaccional v3", 980, 1290, 220, 80, nBr, "remitente verificado antiyakecho@gmail.com");
  var nMail = nodo("Buzon del destinatario", "device", 1300, 1240, 240, 170, "#ECEFF1");
  var aMail = arte("Correo electronico", 1320, 1290, 200, 80, nMail, "puede caer en spam");
  dep(aGit, aRepo, "git push (HTTPS)");
  dep(aRepo, aDist, "deploy: webhook GitHub -> build");
  dep(aRepo, aNu, "deploy: auto-deploy (Blueprint)");
  dep(aRepo, aNo, "deploy: auto-deploy (Blueprint)");
  dep(aDist, aSpa, "HTTPS 443 - descarga de la SPA");
  dep(aSpa, aNu, "HTTPS 443 REST/JSON + Bearer JWT", true);
  dep(aSpa, aNo, "HTTPS GET /salud (despertar, no-cors)");
  dep(aNu, aNo, "HTTPS POST /eventos + X-API-Key", true);
  dep(aNu, aDb1, "TCP 5432 - SQL sobre TLS");
  dep(aNo, aDb2, "TCP 5432 - SQL sobre TLS");
  dep(aNo, aBr, "HTTPS 443 POST /v3/smtp/email");
  dep(aBr, aMail, "SMTP / entrega de correo");
  TM.endTransaction();
  log("DESPLIEGUE OK");
} catch (e) { log("DESPLIEGUE FAIL " + e); try { TM.abortTransaction(); } catch (e2) {} }

var s = out.join("\n");
java.nio.file.Files.write(java.nio.file.Paths.get("C:\\Users\\USUARIO\\OneDrive\\Documentos\\JEDANIX\\astah_import\\log_arq.txt"), new java.lang.String(s).getBytes("UTF-8"));
s.length;
