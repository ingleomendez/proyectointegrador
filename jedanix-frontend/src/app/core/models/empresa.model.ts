import { UsuarioListItem } from './usuario.model';
import { EmpresaEstadoEnum, TipoRespuestaEnum } from './enums.model';

/** Replica de `app/schemas/empresa_receptora.py` (solo lo que el frontend
 * necesita leer -- `*Create`/`*Update` se agregan cuando se construyan las
 * pantallas del Director). */

export interface PreguntaBitacoraOut {
  id: number;
  enunciado: string;
  tipo_respuesta: TipoRespuestaEnum;
}

export interface DocumentoRequeridoOut {
  id: number;
  nombre_documento: string;
}

export interface EmpresaReceptoraListItem {
  id: number;
  nombre: string;
  estado: EmpresaEstadoEnum;
  coordinador: UsuarioListItem;
  docente_asesor: UsuarioListItem;
}

export interface EmpresaReceptoraOut {
  id: number;
  nombre: string;
  descripcion: string;
  requisitos_generales: string;
  horas_requeridas: number;
  estado: EmpresaEstadoEnum;
  coordinador: UsuarioListItem;
  docente_asesor: UsuarioListItem;
  preguntas_bitacora: PreguntaBitacoraOut[];
  documentos_requeridos: DocumentoRequeridoOut[];
}

export interface PreguntaBitacoraCreate {
  enunciado: string;
  tipo_respuesta: TipoRespuestaEnum;
}

export interface DocumentoRequeridoCreate {
  nombre_documento: string;
}

/** CU-02, flujo básico completo. */
export interface EmpresaReceptoraCreate {
  nombre: string;
  descripcion: string;
  requisitos_generales: string;
  horas_requeridas: number;
  coordinador_id: number;
  docente_asesor_id: number;
  preguntas_bitacora: PreguntaBitacoraCreate[];
  documentos_requeridos: DocumentoRequeridoCreate[];
}

export interface EmpresaReceptoraUpdate {
  nombre: string;
  descripcion: string;
  requisitos_generales: string;
  horas_requeridas: number;
  coordinador_id: number;
  docente_asesor_id: number;
}
