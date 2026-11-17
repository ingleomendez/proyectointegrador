/** "hace 5 min", "ayer", "12 oct". El Núcleo manda fechas UTC sin zona
 * ("2026-10-05T14:30:00"), por eso se les agrega la `Z` antes de interpretarlas. */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const fecha = new Date(tieneZona ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  const segundos = Math.max(0, Math.round((ahora.getTime() - fecha.getTime()) / 1000));
  if (segundos < 60) {
    return 'hace un momento';
  }
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) {
    return `hace ${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    return `hace ${horas} h`;
  }
  const dias = Math.floor(horas / 24);
  if (dias === 1) {
    return 'ayer';
  }
  if (dias < 7) {
    return `hace ${dias} días`;
  }
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}
