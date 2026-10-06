import { UsuarioListItem } from './usuario.model';
import { EmpresaReceptoraListItem } from './empresa.model';
import { PostulacionEstadoEnum } from './enums.model';

export interface RespuestaBitacoraInput {
  pregunta_id: number;
  respuesta_texto: string;
}

export interface RespuestaBitacoraOut {
  id: number;
  pregunta_id: number;
  respuesta_texto: string;
}

export interface DocumentoPostulacionInput {
  documento_requerido_id: number;
  archivo: string;
}

export interface DocumentoPostulacionOut {
  id: number;
  documento_requerido_id: number;
  archivo: string;
  fecha_carga: string;
}

/** El mismo esquema sirve para "Guardar como borrador" (enviar=false) y para
 * "Enviar solicitud formalmente" (enviar=true). */
export interface PostulacionCreate {
  empresa_id: number;
  enviar: boolean;
  respuestas_bitacora: RespuestaBitacoraInput[];
  documentos_postulacion: DocumentoPostulacionInput[];
}

/** CU-06, flujo alterno 9.1.a: "Guardar y salir" sobre un BORRADOR (o envío formal). */
export interface PostulacionUpdate {
  enviar: boolean;
  respuestas_bitacora: RespuestaBitacoraInput[];
  documentos_postulacion: DocumentoPostulacionInput[];
}

export interface PostulacionOut {
  id: number;
  estudiante: UsuarioListItem;
  empresa: EmpresaReceptoraListItem;
  estado: PostulacionEstadoEnum;
  fecha_postulacion: string | null;
  motivo_rechazo: string | null;
  fecha_decision: string | null;
  fecha_cierre: string | null;
  observacion_cierre: string | null;
  /** CU-05, flujo 9.1.a: cuándo se rechazó el cierre (si ocurrió). */
  fecha_rechazo_cierre: string | null;
  /** CU-04, pasos 16-17: pertenece al subconjunto "Pendiente de aprobación práctica". */
  pendiente_cierre: boolean;
  respuestas_bitacora: RespuestaBitacoraOut[];
  documentos_postulacion: DocumentoPostulacionOut[];
}

export interface PostulacionListItem {
  id: number;
  estudiante: UsuarioListItem;
  empresa: EmpresaReceptoraListItem;
  estado: PostulacionEstadoEnum;
  fecha_postulacion: string | null;
  fecha_decision: string | null;
  observacion_cierre: string | null;
  /** Horas de avances ACEPTADOS y horas requeridas (CU-04, paso 3). */
  horas_acumuladas: number;
  horas_requeridas: number;
  /** Subconjunto "Pendiente de aprobación práctica" (CU-04, pasos 16-17). */
  pendiente_cierre: boolean;
}

/** CU-03: decisión del Director. `motivo_rechazo` solo si `aprobar` es false. */
export interface PostulacionDecision {
  aprobar: boolean;
  motivo_rechazo?: string | null;
}

/** CU-05: cierre formal de la práctica o rechazo del cierre. */
export interface PostulacionCierre {
  aprobar: boolean;
  observacion_cierre?: string | null;
}
