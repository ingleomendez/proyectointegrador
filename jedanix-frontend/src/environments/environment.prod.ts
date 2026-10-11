// Configuración del build de PRODUCCIÓN (`ng build`, el que usa Cloudflare Pages).
// Cambia `apiUrl` por la URL pública del servicio Núcleo en Render (sin "/" final).
export const environment = {
  production: true,
  apiUrl: 'https://jedanix-nucleo.onrender.com',
  // URL pública del servicio Notificaciones: el navegador lo "despierta" antes de
  // acciones que envían correo (Render gratis lo duerme tras 15 min sin visitas).
  notificacionesUrl: 'https://jedanix-notificaciones.onrender.com',
};
