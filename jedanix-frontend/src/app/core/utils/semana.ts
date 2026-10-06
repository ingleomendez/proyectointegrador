/** Devuelve el lunes de la semana calendario de `fecha` como `YYYY-MM-DD`
 * (hora local). CU-08 mantiene un único avance por semana calendario; el
 * backend identifica la semana por esta fecha. */
export function lunesDeSemana(fecha: Date = new Date()): string {
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dia = lunes.getDay(); // 0 = domingo
  lunes.setDate(lunes.getDate() + (dia === 0 ? -6 : 1 - dia));
  const mes = String(lunes.getMonth() + 1).padStart(2, '0');
  const diaMes = String(lunes.getDate()).padStart(2, '0');
  return `${lunes.getFullYear()}-${mes}-${diaMes}`;
}

/** Texto legible para los estados de un avance. */
export function etiquetaEstadoAvance(estado: string): string {
  switch (estado) {
    case 'PENDIENTE_DE_REVISION':
      return 'Pendiente de revisión';
    case 'ACEPTADO':
      return 'Aceptado';
    case 'OBSERVADO':
      return 'Observado';
    default:
      return estado;
  }
}

/** Suma `dias` a una fecha `YYYY-MM-DD` y devuelve otra `YYYY-MM-DD`. */
export function sumarDias(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia + dias);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** CU-08, excepción 5.1.b: semanas calendario ya cerradas (después del domingo
 * 11:59 p.m.) en las que no se registró avance. Se cuenta desde la semana en que
 * los objetivos fueron aprobados (antes de eso no se pueden registrar avances)
 * hasta la semana anterior a la actual, o hasta la semana del cierre si la
 * práctica ya finalizó. Devuelve los lunes (`YYYY-MM-DD`) de las semanas "No
 * reportadas", de la más reciente a la más antigua. */
export function semanasNoReportadas(
  desde: string | Date | null | undefined,
  semanasConAvance: string[],
  hasta: string | Date | null = null,
): string[] {
  if (!desde) {
    return [];
  }
  const primera = lunesDeSemana(new Date(desde));
  const limite = hasta ? lunesDeSemana(new Date(hasta)) : lunesDeSemana();
  const faltantes: string[] = [];
  for (let semana = primera; semana < limite; semana = sumarDias(semana, 7)) {
    if (!semanasConAvance.includes(semana)) {
      faltantes.push(semana);
    }
  }
  return faltantes.reverse();
}
