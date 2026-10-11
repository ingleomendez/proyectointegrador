import { environment } from '../../../environments/environment';

/** Cada cuánto como máximo se vuelve a "tocar" a Notificaciones (ms). El plan
 * gratuito de Render duerme un servicio tras 15 min sin visitas; con 5 min de
 * margen nunca se llega a dormir mientras el usuario trabaja. */
const INTERVALO_MS = 5 * 60 * 1000;

let ultimoAviso = 0;

/**
 * Despierta al servicio de Notificaciones desde el NAVEGADOR.
 *
 * Por qué: en Render gratis, una visita desde el navegador despierta un
 * servicio dormido en pocos segundos, pero la llamada servidor→servidor que
 * hace el Núcleo no lo despierta (queda en HTTP 502). Sin esto, las
 * credenciales y demás correos se perdían si Notificaciones estaba dormido.
 *
 * Es "dispara y olvida": no espera respuesta ni muestra errores. Si
 * `notificacionesUrl` está vacío (desarrollo local) no hace nada.
 */
export function despertarNotificaciones(): void {
  const base = environment.notificacionesUrl;
  if (!base) return;

  const ahora = Date.now();
  if (ahora - ultimoAviso < INTERVALO_MS) return;
  ultimoAviso = ahora;

  try {
    // no-cors: no necesitamos leer la respuesta, solo que la petición llegue.
    fetch(`${base}/salud`, { mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => undefined);
  } catch {
    // Nunca debe afectar a la pantalla del usuario.
  }
}
