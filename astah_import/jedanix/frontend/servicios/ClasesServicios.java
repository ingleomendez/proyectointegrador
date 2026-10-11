package jedanix.frontend.servicios;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.frontend.comun.*;
import jedanix.frontend.core.*;
import jedanix.frontend.director.*;
import jedanix.frontend.estudiante.*;
import jedanix.frontend.revision.*;

/** Injectable providedIn root */
class AuthService {
    private HttpClient http;
    private Router router;
    private Signal<SesionUsuario> usuarioSignal;
    private Signal<SesionUsuario> usuario;
    private Computed<boolean> estaAutenticado;
    public Observable<TokenResponse> login(LoginRequest credenciales) { throw new UnsupportedOperationException(); }
    public void logout() { throw new UnsupportedOperationException(); }
    public void actualizarNombre(String nombreCompleto) { throw new UnsupportedOperationException(); }
    public String obtenerToken() { throw new UnsupportedOperationException(); }
    public SesionUsuario leerSesionGuardada() { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class UsuarioService {
    private HttpClient http;
    private String baseUrl;
    public Observable<UsuarioOut> obtenerMiPerfil() { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> actualizarMiPerfil(PerfilUpdate data) { throw new UnsupportedOperationException(); }
    public Observable<List<UsuarioListItem>> listar(RolEnum rol) { throw new UnsupportedOperationException(); }
    public Observable<List<String>> programasAcademicos() { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> obtener(int id) { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> crear(UsuarioCreate data) { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> actualizar(int id, UsuarioUpdateDirector data, boolean confirmarCambioRol) { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> inactivar(int id, boolean forzar) { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> reenviarCredenciales(int id) { throw new UnsupportedOperationException(); }
    public Observable<UsuarioOut> reactivar(int id) { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class EmpresaService {
    private HttpClient http;
    private String baseUrl;
    public Observable<List<EmpresaReceptoraListItem>> listar() { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> obtener(int empresaId) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> crear(EmpresaReceptoraCreate data) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> actualizar(int empresaId, EmpresaReceptoraUpdate data) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> agregarPregunta(int empresaId, PreguntaBitacoraCreate data) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> actualizarPregunta(int empresaId, int preguntaId, PreguntaBitacoraUpdate data) { throw new UnsupportedOperationException(); }
    public Observable<Void> eliminarPregunta(int empresaId, int preguntaId, boolean confirmar) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> agregarDocumentoRequerido(int empresaId, DocumentoRequeridoCreate data) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> actualizarDocumentoRequerido(int empresaId, int documentoId, DocumentoRequeridoUpdate data) { throw new UnsupportedOperationException(); }
    public Observable<Void> eliminarDocumentoRequerido(int empresaId, int documentoId, boolean confirmar) { throw new UnsupportedOperationException(); }
    public Observable<EmpresaReceptoraOut> inactivar(int empresaId, boolean forzar) { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class PostulacionService {
    private HttpClient http;
    private String baseUrl;
    public Observable<PostulacionOut> crear(PostulacionCreate data) { throw new UnsupportedOperationException(); }
    public Observable<PostulacionOut> actualizarBorrador(int postulacionId, PostulacionUpdate data) { throw new UnsupportedOperationException(); }
    public Observable<PostulacionOut> enviarBorrador(int postulacionId) { throw new UnsupportedOperationException(); }
    public Observable<List<PostulacionOut>> listarMias() { throw new UnsupportedOperationException(); }
    public Observable<PostulacionOut> obtener(int postulacionId) { throw new UnsupportedOperationException(); }
    public Observable<List<PostulacionListItem>> listarPendientes(int empresaId) { throw new UnsupportedOperationException(); }
    public Observable<PostulacionOut> decidir(int postulacionId, PostulacionDecision data) { throw new UnsupportedOperationException(); }
    public Observable<PostulacionOut> decidirCierre(int postulacionId, PostulacionCierre data) { throw new UnsupportedOperationException(); }
    public Observable<List<PostulacionListItem>> listarMatriculados() { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class ObjetivoService {
    private HttpClient http;
    private String baseUrl;
    public Observable<ObjetivoPracticaOut> enviar(ObjetivoPracticaCreate data) { throw new UnsupportedOperationException(); }
    public Observable<ObjetivoPracticaOut> obtenerMios() { throw new UnsupportedOperationException(); }
    public Observable<ObjetivoPracticaOut> obtenerDePostulacion(int postulacionId) { throw new UnsupportedOperationException(); }
    public Observable<List<ObjetivoPracticaOut>> listarPendientes() { throw new UnsupportedOperationException(); }
    public Observable<ObjetivoPracticaOut> decidir(int objetivoId, ObjetivoPracticaDecision data) { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class AvanceService {
    private HttpClient http;
    private String baseUrl;
    public Observable<AvanceSemanalOut> registrar(AvanceSemanalCreate data) { throw new UnsupportedOperationException(); }
    public Observable<List<AvanceSemanalListItem>> listarMios() { throw new UnsupportedOperationException(); }
    public Observable<AvanceSemanalOut> obtener(int id) { throw new UnsupportedOperationException(); }
    public Observable<List<AvanceSemanalListItem>> listarDePostulacion(int postulacionId) { throw new UnsupportedOperationException(); }
    public Observable<List<AvanceSemanalListItem>> listarCoordinador(boolean soloPendientes) { throw new UnsupportedOperationException(); }
    public Observable<AvanceSemanalOut> calificar(int id, AvanceCalificacion data) { throw new UnsupportedOperationException(); }
    public Observable<List<AvanceSemanalListItem>> listarDocente() { throw new UnsupportedOperationException(); }
    public Observable<AvanceSemanalOut> observar(int id, AvanceObservacionDocente data) { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class ArchivoService {
    private HttpClient http;
    private String baseUrl;
    public Observable<ArchivoSubidoOut> subir(File archivo, boolean permitirImagenes) { throw new UnsupportedOperationException(); }
    public Observable<Void> descargar(String ruta, String nombre) { throw new UnsupportedOperationException(); }
    public String urlPublica(String ruta) { throw new UnsupportedOperationException(); }
}

/** Injectable providedIn root */
class EstadoEstudianteService {
    private PostulacionService postulacionService;
    private Signal<List<PostulacionOut>> postulaciones;
    private Signal<boolean> cargado;
    private Computed<PostulacionOut> postulacionActiva;
    private Computed<PostulacionOut> ultimaPostulacion;
    private Computed<ContextoEstudiante> contexto;
    public void refrescar() { throw new UnsupportedOperationException(); }
    public void limpiar() { throw new UnsupportedOperationException(); }
}
