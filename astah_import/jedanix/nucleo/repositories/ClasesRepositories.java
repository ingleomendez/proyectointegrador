package jedanix.nucleo.repositories;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.nucleo.core.*;
import jedanix.nucleo.dominio.*;
import jedanix.nucleo.excepciones.*;
import jedanix.nucleo.routers.*;
import jedanix.nucleo.services.*;

/** repository */
class UsuarioRepository {
    private Session db;
    public Usuario get_by_id(int usuario_id) { throw new UnsupportedOperationException(); }
    public Usuario get_by_correo(String correo_institucional) { throw new UnsupportedOperationException(); }
    public boolean existe_correo(String correo_institucional) { throw new UnsupportedOperationException(); }
    public List<Usuario> listar(RolEnum rol) { throw new UnsupportedOperationException(); }
    public Usuario crear(Usuario usuario) { throw new UnsupportedOperationException(); }
    public Usuario guardar(Usuario usuario) { throw new UnsupportedOperationException(); }
    public int contar_empresas_asignadas(int usuario_id) { throw new UnsupportedOperationException(); }
}

/** repository */
class EmpresaReceptoraRepository {
    private Session db;
    public EmpresaReceptora get_by_id(int empresa_id) { throw new UnsupportedOperationException(); }
    public List<EmpresaReceptora> listar(boolean solo_activas) { throw new UnsupportedOperationException(); }
    public EmpresaReceptora crear(EmpresaReceptora empresa) { throw new UnsupportedOperationException(); }
    public EmpresaReceptora guardar(EmpresaReceptora empresa) { throw new UnsupportedOperationException(); }
    public PreguntaBitacora agregar_pregunta(EmpresaReceptora empresa, PreguntaBitacora pregunta) { throw new UnsupportedOperationException(); }
    public boolean existe_enunciado_duplicado(int empresa_id, String enunciado, int excluir_id) { throw new UnsupportedOperationException(); }
    public PreguntaBitacora get_pregunta(int empresa_id, int pregunta_id) { throw new UnsupportedOperationException(); }
    public DocumentoRequerido get_documento_requerido(int empresa_id, int documento_id) { throw new UnsupportedOperationException(); }
    public int contar_respuestas_de_pregunta(int pregunta_id, boolean solo_en_curso) { throw new UnsupportedOperationException(); }
    public int contar_cargas_de_documento(int documento_id, boolean solo_en_curso) { throw new UnsupportedOperationException(); }
    public void eliminar(Object entidad) { throw new UnsupportedOperationException(); }
    public DocumentoRequerido agregar_documento_requerido(EmpresaReceptora empresa, DocumentoRequerido documento) { throw new UnsupportedOperationException(); }
}

/** repository */
class PostulacionRepository {
    private Session db;
    public Postulacion get_by_id(int postulacion_id) { throw new UnsupportedOperationException(); }
    public Postulacion get_activa_de_estudiante(int estudiante_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_por_estudiante(int estudiante_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_pendientes(int empresa_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_matriculados() { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_matriculados_por_coordinador(int coordinador_id) { throw new UnsupportedOperationException(); }
    public List<Postulacion> listar_matriculados_por_docente_asesor(int docente_asesor_id) { throw new UnsupportedOperationException(); }
    public Postulacion crear(Postulacion postulacion) { throw new UnsupportedOperationException(); }
    public Postulacion guardar(Postulacion postulacion) { throw new UnsupportedOperationException(); }
    public RespuestaBitacora agregar_respuesta_bitacora(Postulacion postulacion, RespuestaBitacora respuesta) { throw new UnsupportedOperationException(); }
    public DocumentoPostulacion agregar_documento(Postulacion postulacion, DocumentoPostulacion documento) { throw new UnsupportedOperationException(); }
}

/** repository */
class AvanceSemanalRepository {
    private Session db;
    public AvanceSemanal get_by_id(int avance_id) { throw new UnsupportedOperationException(); }
    public AvanceSemanal get_por_postulacion_y_semana(int postulacion_id, LocalDate semana_calendario) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_por_postulacion(int postulacion_id) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_por_coordinador(int coordinador_id, boolean solo_pendientes) { throw new UnsupportedOperationException(); }
    public List<AvanceSemanal> listar_por_docente_asesor(int docente_asesor_id) { throw new UnsupportedOperationException(); }
    public int contar_sin_revisar_por_responsable(int usuario_id) { throw new UnsupportedOperationException(); }
    public AvanceSemanal crear(AvanceSemanal avance) { throw new UnsupportedOperationException(); }
    public AvanceSemanal guardar(AvanceSemanal avance) { throw new UnsupportedOperationException(); }
    public DiaTrabajado agregar_dia_trabajado(AvanceSemanal avance, DiaTrabajado dia) { throw new UnsupportedOperationException(); }
    public SoporteAvance agregar_soporte(AvanceSemanal avance, SoporteAvance soporte) { throw new UnsupportedOperationException(); }
}

/** repository */
class ObjetivoPracticaRepository {
    private Session db;
    public ObjetivoPractica get_by_postulacion_id(int postulacion_id) { throw new UnsupportedOperationException(); }
    public List<ObjetivoPractica> listar_pendientes_por_docente_asesor(int docente_asesor_id) { throw new UnsupportedOperationException(); }
    public ObjetivoPractica crear(ObjetivoPractica objetivo) { throw new UnsupportedOperationException(); }
    public ObjetivoPractica guardar(ObjetivoPractica objetivo) { throw new UnsupportedOperationException(); }
}
