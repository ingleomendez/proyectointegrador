'use strict';

const config = require('./config');
const { pool, inicializarEsquema } = require('./db');
const app = require('./app');
const reintentos = require('./jobs/reintentos');

async function main() {
  try {
    await inicializarEsquema();
  } catch (err) {
    console.error(
      `\n[db] No se pudo conectar o preparar la base de datos (${err.message}).\n` +
        '     Verifica que exista la base "jedanix_notificaciones" y que DATABASE_URL en .env sea correcta.\n',
    );
    process.exit(1);
  }

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
    reintentos.iniciar();
  });

  const apagar = () => {
    reintentos.detener();
    servidor.close(() => pool.end().finally(() => process.exit(0)));
  };
  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

main();
