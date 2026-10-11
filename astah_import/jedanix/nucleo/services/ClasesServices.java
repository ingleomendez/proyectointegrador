package jedanix.nucleo.services;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.nucleo.core.*;
import jedanix.nucleo.dominio.*;
import jedanix.nucleo.excepciones.*;
import jedanix.nucleo.repositories.*;
import jedanix.nucleo.routers.*;

/** service */
class UsuarioService {
    private Session db;
    private UsuarioRepository repo;
    private AvanceSemanalRepository avance_repo;
    private NotificacionesClient notificaciones;
    public List<Usuario> listar(RolEnum rol) { throw new UnsupportedOperationException(); }
    public Usuario obtener(int usuario_id) { throw new UnsupportedOperationException(); }
    public void _validar_programa(String programa, String actual) { throw new UnsupportedOperationException(); }
    public Usuario crear_usuario(UsuarioCreate data) { throw new UnsupportedOperationException(); }
    public Usuario actualizar_usuario_director(int usuario_id, UsuarioUpdateDirector data, boolean confirmar_cambio_rol) { throw new UnsupportedOperationException(); }
    public Usuario reenviar_credenciales(int usuario_id) { throw new UnsupportedOperationException(); }
    public Usuario actualizar_perfil(int usuario_id, PerfilUpdate data) { throw new UnsupportedOperationException(); }
    public Usuario inactivar_usuario(int usuario_id, boolean forzar) { throw new UnsupportedOperationException(); }
    public Usuario reactivar_usuario(int usuario_id) { throw new UnsupportedOperationException(); }
    public TokenResponse login(LoginRequest data) { throw new UnsupportedOperationException(); }
}

/** service */
class EmpresaReceptoraService {
    private Session db;
    private EmpresaReceptoraRepository repo;
    private PostulacionRepository postulacion_repo;
    public EmpresaReceptora crear_empresa(EmpresaReceptoraCreate data) { throw new UnsupportedOperationException(); }
    public EmpresaReceptora actualizar_empresa(int empresa_id, EmpresaReceptoraUpdate data) { throw new UnsupportedOperationException(); }
    public PreguntaBitacora agregar_pregunta(int empresa_id, PreguntaBitacoraCreate data, boolean confirmar_duplicado) { throw new UnsupportedOperationException(); }
    public DocumentoRequerido agregar_documento_requerido(int empresa_id, DocumentoRequeridoCreate data) { throw new UnsupportedOperationException(); }
    public PreguntaBitacora actualizar_pregunta(int empresa_id, int pregunta_id, PreguntaBitacoraUpdate data, boolean confirmar_duplicado) { throw new UnsupportedOperationException(); }
    public void eliminar_pregunta(int empresa_id, int pregunta_id, boolean confirmar) { throw new UnsupportedOperationException(); }
    public DocumentoRequerido actualizar_documento_requerido(int empresa_id, int documento_id, DocumentoRequeridoUpdate data) { throw new UnsupportedOperationException(); }
    public void eliminar_documento_requerido(int empresa_id, int documento_id, boolean confirmar) { throw new UnsupportedOperationException(); }
    public EmpresaReceptora inactivar_empresa(int empresa_id, boolean forzar) { throw new UnsupportedOperationException(); }
    public List<EmpresaReceptora> listar(boolean solo_activas) { throw new UnsupportedOperationException(); }
    public EmpresaReceptora obtener(int empresa_id) { throw new UnsupportedOperationException(); }
}

/** service */
class PostulacionService {
    private Session db;
    private PostulacionRepository repo;
    private EmpresaReceptoraRepository empresa_repo;
    private UsuarioRepository usuario_repo;
    private AvanceSemanalRepository avance_repo;
    private NotificacionesClient notificaciones;
    public Postulacion obtener(int postulacion_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_mias(int estudiante_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_pendientes_director(int empresa_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_matriculados() { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_matriculados_por_coordinador(int coordinador_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_matriculados_por_docente_asesor(int docente_asesor_id) { throw new UnsupportedOperationException(); }
    public Postulacion crear_postulacion(int estudiante_id, PostulacionCreate data) { throw new UnsupportedOperationException(); }
    public Postulacion actualizar_borrador(int estudiante_id, int postulacion_id, PostulacionUpdate data) { throw new UnsupportedOperationException(); }
    public Postulacion enviar_borrador(int estudiante_id, int postulacion_id) { throw new UnsupportedOperationException(); }
    public void _validar_pertenencia(Object empresa, List<int> pregunta_ids, List<int> documento_ids) { throw new UnsupportedOperationException(); }
    public void _validar_completitud(Object empresa, Set<int> pregunta_ids_respondidas, Set<int> documento_ids_cargados) { throw new UnsupportedOperationException(); }
    public Postulacion decidir_postulacion(int postulacion_id, PostulacionDecision data) { throw new UnsupportedOperationException(); }
    public Postulacion decidir_cierre(int postulacion_id, PostulacionCierre data) { throw new UnsupportedOperationException(); }
    public double _horas_aceptadas(int postulacion_id) { throw new UnsupportedOperationException(); }
    public List<String> _correos_involucrados(Postulacion postulacion) { throw new UnsupportedOperationException(); }
    public void _notificar_directores(String evento, Map<String,Object> datos) { throw new UnsupportedOperationException(); }
}

/** service */
class AvanceSemanalService {
    private Session db;
    private AvanceSemanalRepository repo;
    private PostulacionRepository postulacion_repo;
    private ObjetivoPracticaRepository objetivo_repo;
    private NotificacionesClient notificaciones;
    public AvanceSemanal obtener(int avance_id) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_mios(int estudiante_id) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_por_postulacion(int postulacion_id) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_por_coordinador(int coordinador_id, boolean solo_pendientes) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_por_docente_asesor(int docente_asesor_id) { throw new UnsupportedOperationException(); }
    public AvanceSemanal registrar_avance(int estudiante_id, AvanceSemanalCreate data) { throw new UnsupportedOperationException(); }
    public AvanceSemanal calificar_avance(int avance_id, AvanceCalificacion data) { throw new UnsupportedOperationException(); }
    public AvanceSemanal observar_avance_docente(int avance_id, AvanceObservacionDocente data) { throw new UnsupportedOperationException(); }
}

/** service */
class ObjetivoPracticaService {
    private Session db;
    private ObjetivoPracticaRepository repo;
    private PostulacionRepository postulacion_repo;
    private NotificacionesClient notificaciones;
    public ObjetivoPractica obtener_de_mi_practica(int estudiante_id) { throw new UnsupportedOperationException(); }
    public ObjetivoPractica obtener(int objetivo_id) { throw new UnsupportedOperationException(); }
    public ObjetivoPractica obtener_de_postulacion(int postulacion_id) { throw new UnsupportedOperationException(); }
    public List<ObjetivoPractica> listar_pendientes_docente(int docente_asesor_id) { throw new UnsupportedOperationException(); }
    public ObjetivoPractica enviar_objetivos(int estudiante_id, ObjetivoPracticaCreate data) { throw new UnsupportedOperationException(); }
    public ObjetivoPractica decidir_objetivos(int objetivo_id, ObjetivoPracticaDecision data) { throw new UnsupportedOperationException(); }
}
