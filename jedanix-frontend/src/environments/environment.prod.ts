// Configuración del build de PRODUCCIÓN (`ng build`, el que usa Cloudflare Pages).
// Cambia `apiUrl` por la URL pública del servicio Núcleo en Render (sin "/" final).
export const environment = {
  production: true,
  apiUrl: 'https://jedanix-nucleo.onrender.com',
};
