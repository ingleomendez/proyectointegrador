'use strict';

const config = require('./config');
const { pool, inicializarEsquema } = require('./db');
const app = require('./app');
const reintentos = require('./jobs/reintentos');

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

let apagando = false;

/**
 * Prepara la base SIN tumbar el servicio: en hosting gratuito la base (Neon)
 * también está dormida al arrancar y puede fallar la primera conexión. Antes el
 * proceso terminaba y Render lo reiniciaba con esperas cada vez más largas
 * (minutos de HTTP 502). Ahora el servidor ya escucha y la base se reintenta.
 */
async function prepararBaseDeDatos() {
  for (let intento = 1; !apagando; intento += 1) {
    try {
      await inicializarEsquema();
      console.log('[db] Base de datos lista.');
      return;
    } catch (err) {
      const espera = Math.min(2000 * intento, 15000);
      console.error(
        `[db] No se pudo preparar la base de datos (${err.message}). ` +
          `Verifica DATABASE_URL. Reintento ${intento} en ${espera / 1000}s.`,
      );
      await esperar(espera);
    }
  }
}

async function main() {
  const servidor = app.listen(config.puerto, (err) => {
    // Express 5 entrega el error de listen() aquí (p. ej. puerto ocupado por otra instancia).
    if (err) {
      console.error(
        `\n[servidor] No se pudo abrir el puerto ${config.puerto}: ${err.message}\n` +
          '          Probablemente ya hay otra instancia de Notificaciones corriendo. Deténla y vuelve a iniciar.\n',
      );
      process.exit(1);
    }
    console.log(`\nJEDANIX Notificaciones escuchando en http://localhost:${config.puerto}`);
    console.log(
      config.modoSimulado
        ? 'Correo: MODO SIMULADO (SMTP_HOST vacío) — los mensajes se imprimen aquí en consola.'
        : `Correo: SMTP real vía ${config.smtp.host}:${config.smtp.puerto}`,
    );
    if (!config.claveInterna) {
      console.warn('Aviso: NOTIFICACIONES_API_KEY no está definida; cualquiera con acceso a este puerto puede enviar eventos.');
    }
    reintentos.iniciar();
    prepararBaseDeDatos();
  });

  const apagar = () => {
    apagando = true;
    reintentos.detener();
    servidor.close(() => pool.end().finally(() => process.exit(0)));
  };
  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

main();
