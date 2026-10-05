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
  respuestas_bitacora: RespuestaBitacoraOut[];
  documentos_postulacion: DocumentoPostulacionOut[];
}

export interface PostulacionListItem {
  id: number;
  estudiante: UsuarioListItem;
  estado: PostulacionEstadoEnum;
  fecha_postulacion: string | null;
}
