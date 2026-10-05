/** Replica del resto de `app/models/enums.py` (RolEnum y UsuarioEstadoEnum
 * viven en `usuario.model.ts` porque se usan desde el armazón de auth). Se
 * amplía a medida que se van construyendo las pantallas que los necesitan. */

export enum EmpresaEstadoEnum {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
}

export enum TipoRespuestaEnum {
  TEXTO_LIBRE = 'TEXTO_LIBRE',
  SELECCION_UNICA = 'SELECCION_UNICA',
  SELECCION_MULTIPLE = 'SELECCION_MULTIPLE',
}

export enum PostulacionEstadoEnum {
  BORRADOR = 'BORRADOR',
  PENDIENTE_DE_APROBACION = 'PENDIENTE_DE_APROBACION',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  FINALIZADA = 'FINALIZADA',
}

export enum AvanceEstadoEnum {
  PENDIENTE_DE_REVISION = 'PENDIENTE_DE_REVISION',
  ACEPTADO = 'ACEPTADO',
  OBSERVADO = 'OBSERVADO',
}

export enum TipoArchivoSoporteEnum {
  PDF = 'PDF',
  PNG = 'PNG',
  JPG = 'JPG',
}

export enum ObjetivoEstadoEnum {
  PENDIENTE_DE_APROBACION = 'PENDIENTE_DE_APROBACION',
  APROBADOS = 'APROBADOS',
  RECHAZADOS = 'RECHAZADOS',
}
