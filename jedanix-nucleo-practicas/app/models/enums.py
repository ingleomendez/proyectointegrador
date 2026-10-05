import enum


class RolEnum(str, enum.Enum):
    ESTUDIANTE = "ESTUDIANTE"
    DIRECTOR = "DIRECTOR"
    COORDINADOR = "COORDINADOR"
    DOCENTE_ASESOR = "DOCENTE_ASESOR"


class UsuarioEstadoEnum(str, enum.Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"


class GrupoSanguineoEnum(str, enum.Enum):
    A = "A"
    B = "B"
    AB = "AB"
    O = "O"


class FactorRhEnum(str, enum.Enum):
    POSITIVO = "POSITIVO"
    NEGATIVO = "NEGATIVO"


class EmpresaEstadoEnum(str, enum.Enum):
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"


class TipoRespuestaEnum(str, enum.Enum):
    TEXTO_LIBRE = "TEXTO_LIBRE"
    SELECCION_UNICA = "SELECCION_UNICA"
    SELECCION_MULTIPLE = "SELECCION_MULTIPLE"


class PostulacionEstadoEnum(str, enum.Enum):
    BORRADOR = "BORRADOR"
    PENDIENTE_DE_APROBACION = "PENDIENTE_DE_APROBACION"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    FINALIZADA = "FINALIZADA"


class AvanceEstadoEnum(str, enum.Enum):
    PENDIENTE_DE_REVISION = "PENDIENTE_DE_REVISION"
    ACEPTADO = "ACEPTADO"
    OBSERVADO = "OBSERVADO"


class TipoArchivoSoporteEnum(str, enum.Enum):
    PDF = "PDF"
    PNG = "PNG"
    JPG = "JPG"


class ObjetivoEstadoEnum(str, enum.Enum):
    PENDIENTE_DE_APROBACION = "PENDIENTE_DE_APROBACION"
    APROBADOS = "APROBADOS"
    RECHAZADOS = "RECHAZADOS"
    