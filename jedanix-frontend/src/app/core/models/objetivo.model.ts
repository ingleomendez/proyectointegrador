import { ObjetivoEstadoEnum } from './enums.model';

/** Réplica de `app/schemas/objetivo_practica.py` (CU-11). */

export interface ObjetivoPracticaCreate {
  /** CU-11, pasos 5-8: sirve tanto para el envío inicial como para el
   * reenvío tras rechazo (flujo 4.1.a) -- mismo endpoint, mismo cuerpo. */
  contenido: string;
}

export interface ObjetivoPracticaOut {
  id: number;
  postulacion_id: number;
  estudiante_nombre: string;
  empresa_nombre: string;
  contenido: string;
  estado: ObjetivoEstadoEnum;
  observacion_docente: string | null;
  fecha_envio: string;
  fecha_decision: string | null;
}

/** CU-11 (Docente Asesor): `observacion_docente` es obligatoria si `aprobar`
 * es false. */
export interface ObjetivoPracticaDecision {
  aprobar: boolean;
  observacion_docente?: string | null;
}
