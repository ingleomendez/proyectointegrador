package jedanix.nucleo.dominio;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.nucleo.core.*;
import jedanix.nucleo.excepciones.*;
import jedanix.nucleo.repositories.*;
import jedanix.nucleo.routers.*;
import jedanix.nucleo.services.*;

enum RolEnum { ESTUDIANTE, DIRECTOR, COORDINADOR, DOCENTE_ASESOR }

enum UsuarioEstadoEnum { ACTIVO, INACTIVO }

enum GrupoSanguineoEnum { A, B, AB, O }

enum FactorRhEnum { POSITIVO, NEGATIVO }

enum EmpresaEstadoEnum { ACTIVA, INACTIVA }

enum TipoRespuestaEnum { TEXTO_LIBRE, SELECCION_UNICA, SELECCION_MULTIPLE }

enum PostulacionEstadoEnum { BORRADOR, PENDIENTE_DE_APROBACION, APROBADA, RECHAZADA, FINALIZADA }

enum ObjetivoEstadoEnum { PENDIENTE_DE_APROBACION, APROBADOS, RECHAZADOS }

enum AvanceEstadoEnum { PENDIENTE_DE_REVISION, ACEPTADO, OBSERVADO }

enum TipoArchivoSoporteEnum { PDF, PNG, JPG }

/** Herencia de tabla unica (STI): discriminador rol. */
abstract class Usuario {
    private int id;
    private String nombre_completo;
    private String correo_institucional;
    private String contrasena_hash;
    private String celular;
    private String foto_perfil;
    private RolEnum rol;
    private UsuarioEstadoEnum estado;
    private LocalDateTime fecha_registro;
    private List<ArchivoSubido> archivos_subidos;
}

class Estudiante extends Usuario {
    private String programa_academico;
    private String direccion_residencia;
    private GrupoSanguineoEnum grupo_sanguineo;
    private FactorRhEnum factor_rh;
    private String eps;
    private List<Postulacion> postulaciones;
}

class Director extends Usuario {
}

class CoordinadorPractica extends Usuario {
    private List<EmpresaReceptora> empresas_coordinadas;
}

class DocenteAsesor extends Usuario {
    private List<EmpresaReceptora> empresas_asesoradas;
}

class EmpresaReceptora {
    private int id;
    private String nombre;
    private String descripcion;
    private String requisitos_generales;
    private int horas_requeridas;
    private String telefono;
    private String direccion;
    private EmpresaEstadoEnum estado;
    private List<PreguntaBitacora> preguntas;
    private List<DocumentoRequerido> documentos_requeridos;
    private List<Postulacion> postulaciones;
}

class PreguntaBitacora {
    private int id;
    private String enunciado;
    private TipoRespuestaEnum tipo_respuesta;
    private boolean activa;
}

class DocumentoRequerido {
    private int id;
    private String nombre_documento;
    private boolean activa;
}

class Postulacion {
    private int id;
    private PostulacionEstadoEnum estado;
    private LocalDateTime fecha_postulacion;
    private String motivo_rechazo;
    private LocalDateTime fecha_decision;
    private LocalDateTime fecha_cierre;
    private String observacion_cierre;
    private LocalDateTime fecha_rechazo_cierre;
    private List<RespuestaBitacora> respuestas;
    private List<DocumentoPostulacion> documentos;
    private ObjetivoPractica objetivo;
    private List<AvanceSemanal> avances;
    public double horas_acumuladas() { throw new UnsupportedOperationException(); }
    public int horas_requeridas() { throw new UnsupportedOperationException(); }
    public boolean pendiente_cierre() { throw new UnsupportedOperationException(); }
}

class RespuestaBitacora {
    private int id;
    private String respuesta_texto;
    private PreguntaBitacora pregunta;
}

class DocumentoPostulacion {
    private int id;
    private String archivo;
    private LocalDateTime fecha_carga;
    private DocumentoRequerido documento_requerido;
}

class ObjetivoPractica {
    private int id;
    private String contenido;
    private ObjetivoEstadoEnum estado;
    private String observacion_docente;
    private LocalDateTime fecha_envio;
    private LocalDateTime fecha_decision;
    public String estudiante_nombre() { throw new UnsupportedOperationException(); }
    public String empresa_nombre() { throw new UnsupportedOperationException(); }
}

class AvanceSemanal {
    private int id;
    private LocalDate semana_calendario;
    private String actividades_a_desarrollar;
    private BigDecimal horas_totales;
    private BigDecimal beneficio_economico;
    private String actividades_generales;
    private String ejecucion;
    private String observaciones_estudiante;
    private AvanceEstadoEnum estado;
    private LocalDateTime fecha_envio;
    private BigDecimal calificacion_coordinador;
    private String comentario_coordinador;
    private LocalDateTime fecha_calificacion;
    private String observacion_docente_asesor;
    private LocalDateTime fecha_observacion_docente;
    private List<DiaTrabajado> dias_trabajados;
    private List<SoporteAvance> soportes;
    public boolean tiene_observacion_docente() { throw new UnsupportedOperationException(); }
    public String estudiante_nombre() { throw new UnsupportedOperationException(); }
    public String empresa_nombre() { throw new UnsupportedOperationException(); }
}

class DiaTrabajado {
    private int id;
    private int numero_dia;
    private String descripcion_dia;
    private BigDecimal horas_dia;
}

class SoporteAvance {
    private int id;
    private String archivo;
    private TipoArchivoSoporteEnum tipo_archivo;
    private LocalDateTime fecha_carga;
}

class ArchivoSubido {
    private String nombre;
    private byte[] contenido;
    private String tipo_contenido;
    private int tamano_bytes;
    private LocalDateTime fecha_carga;
}
