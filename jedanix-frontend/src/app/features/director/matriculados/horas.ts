import { AvanceSemanalListItem } from '../../../core/models/avance.model';
import { AvanceEstadoEnum } from '../../../core/models/enums.model';

/** Horas que cuentan para la práctica: solo las de avances ACEPTADOS por el
 * Coordinador (CU-09). */
export function horasAceptadas(avances: AvanceSemanalListItem[]): number {
  return avances
    .filter((a) => a.estado === AvanceEstadoEnum.ACEPTADO)
    .reduce((total, a) => total + Number(a.horas_totales), 0);
}

/** Porcentaje de cumplimiento (CU-04, paso 15), tope 100. */
export function porcentajeDeHoras(aceptadas: number, requeridas: number): number {
  return requeridas > 0 ? Math.min(100, Math.round((aceptadas / requeridas) * 100)) : 0;
}

/** CU-04, pasos 16-17: el subconjunto "Pendiente de aprobación práctica" lo
 * forman quienes alcanzaron el 100 % de las horas requeridas. */
export function alcanzoCien(aceptadas: number, requeridas: number): boolean {
  return requeridas > 0 && aceptadas >= requeridas;
}
