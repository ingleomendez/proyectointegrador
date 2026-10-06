import { PostulacionEstadoEnum } from '../models/enums.model';

/** Texto legible del estado de una postulación/práctica (nombres de los casos de uso). */
export function etiquetaEstadoPostulacion(estado: PostulacionEstadoEnum): string {
  switch (estado) {
    case PostulacionEstadoEnum.BORRADOR:
      return 'Borrador';
    case PostulacionEstadoEnum.PENDIENTE_DE_APROBACION:
      return 'Pendiente de aprobación';
    case PostulacionEstadoEnum.APROBADA:
      return 'Aprobada (matriculado)';
    case PostulacionEstadoEnum.RECHAZADA:
      return 'Rechazada';
    case PostulacionEstadoEnum.FINALIZADA:
      return 'Finalizada';
  }
}

/** Clase de color del chip según el estado de la postulación. */
export function claseChipPostulacion(estado: PostulacionEstadoEnum): string {
  switch (estado) {
    case PostulacionEstadoEnum.APROBADA:
    case PostulacionEstadoEnum.FINALIZADA:
      return 'chip-aprobado';
    case PostulacionEstadoEnum.RECHAZADA:
      return 'chip-rechazado';
    case PostulacionEstadoEnum.PENDIENTE_DE_APROBACION:
      return 'chip-pendiente';
    default:
      return 'chip-neutro';
  }
}

/** Texto corto de un tamaño de archivo en MB. */
export function formatearTamanoMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
