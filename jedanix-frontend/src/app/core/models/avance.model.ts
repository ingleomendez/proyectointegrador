import { AvanceEstadoEnum, TipoArchivoSoporteEnum } from './enums.model';

/** Réplica de `app/schemas/avance_semanal.py` (CU-08/09/10). Los campos
 * decimales (`Decimal` en el backend) pueden llegar como número o como
 * texto según la serialización; por eso se tipan `number | string` y se
 * convierten con `Number(...)` donde se usan. */

export type Decimal = number | string;

export interface DiaTrabajadoInput {
  numero_dia: number;
  descripcion_dia: string;
  horas_dia: number;
}

export interface DiaTrabajadoOut {
  id: number;
  numero_dia: number;
  descripcion_dia: string;
  horas_dia: Decimal;
}

export interface SoporteAvanceInput {
  archivo: string;
  tipo_archivo: TipoArchivoSoporteEnum;
}

export interface SoporteAvanceOut {
  id: number;
  archivo: string;
  tipo_archivo: TipoArchivoSoporteEnum;
  fecha_carga: string;
}

export interface AvanceSemanalCreate {
  /** Fecha ISO `YYYY-MM-DD` (lunes de la semana calendario). */
  semana_calendario: string;
  actividades_a_desarrollar: string;
  dias_trabajados: DiaTrabajadoInput[];
  horas_totales: number;
  beneficio_economico: number;
  soportes: SoporteAvanceInput[];
  actividades_generales: string;
  ejecucion: string;
  observaciones_estudiante: string;
}

export interface AvanceSemanalOut {
  id: number;
  postulacion_id: number;
  estudiante_nombre: string;
  empresa_nombre: string;
  semana_calendario: string;
  actividades_a_desarrollar: string;
  dias_trabajados: DiaTrabajadoOut[];
  horas_totales: Decimal;
  beneficio_economico: Decimal;
  soportes_avance: SoporteAvanceOut[];
  actividades_generales: string;
  ejecucion: string;
  observaciones_estudiante: string;
  estado: AvanceEstadoEnum;
  fecha_envio: string;
  calificacion_coordinador: Decimal | null;
  comentario_coordinador: string | null;
  fecha_calificacion: string | null;
  observacion_docente_asesor: string | null;
  fecha_observacion_docente: string | null;
}

export interface AvanceSemanalListItem {
  id: number;
  postulacion_id: number;
  estudiante_nombre: string;
  empresa_nombre: string;
  semana_calendario: string;
  fecha_envio: string;
  estado: AvanceEstadoEnum;
  horas_totales: Decimal;
  calificacion_coordinador: Decimal | null;
}

/** CU-09: exactamente uno de los dos (calificar -> ACEPTADO, observar ->
 * OBSERVADO). */
export interface AvanceCalificacion {
  calificacion_coordinador?: number | null;
  comentario_coordinador?: string | null;
}

/** CU-10: observación cualitativa; nunca cambia el estado del avance. */
export interface AvanceObservacionDocente {
  observacion_docente_asesor: string;
}
