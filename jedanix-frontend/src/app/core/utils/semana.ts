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
