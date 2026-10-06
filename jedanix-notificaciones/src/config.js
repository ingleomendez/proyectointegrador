'use strict';

require('dotenv').config();

const aBooleano = (valor, porDefecto = false) => {
  if (valor === undefined || valor === '') return porDefecto;
  return ['1', 'true', 'si', 'sí', 'yes'].includes(String(valor).trim().toLowerCase());
};

const aEntero = (valor, porDefecto) => {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
};

const config = {
  entorno: process.env.NODE_ENV || 'development',
  puerto: aEntero(process.env.PORT, 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://jedanix_user:jedanix_pass@localhost:5432/jedanix_notificaciones',
  smtp: {
    host: (process.env.SMTP_HOST || '').trim(),
    puerto: aEntero(process.env.SMTP_PORT, 587),
    seguro: aBooleano(process.env.SMTP_SECURE, false),
    usuario: (process.env.SMTP_USER || '').trim(),
    clave: process.env.SMTP_PASS || '',
  },
  // Clave compartida con el Núcleo (cabecera X-API-Key). Vacía = sin protección (solo desarrollo).
  claveInterna: (process.env.NOTIFICACIONES_API_KEY || '').trim(),
  remitente: process.env.MAIL_FROM || 'JEDANIX <no-reply@jedanix.local>',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, ''),
  reintentos: {
    intervaloSegundos: aEntero(process.env.REINTENTOS_INTERVALO_SEGUNDOS, 60),
    maxIntentos: aEntero(process.env.REINTENTOS_MAX_INTENTOS, 5),
  },
};

// Sin SMTP_HOST el servicio no envía correos reales: los imprime en consola.
config.modoSimulado = config.smtp.host === '';

module.exports = config;
