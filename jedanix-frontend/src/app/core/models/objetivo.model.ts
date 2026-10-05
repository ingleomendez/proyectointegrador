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
  contenido: string;
  estado: ObjetivoEstadoEnum;
  observacion_docente: string | null;
  fecha_envio: string;
  fecha_decision: string | null;
}
