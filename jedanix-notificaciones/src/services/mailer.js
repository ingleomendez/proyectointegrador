'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');

let transporte = null;

function obtenerTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.puerto,
      secure: config.smtp.seguro,
      auth: config.smtp.usuario ? { user: config.smtp.usuario, pass: config.smtp.clave } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporte;
}

/**
 * Cliente de Envío (Arquitectura_JEDANIX_v2.md, sección 3).
 * - Con SMTP configurado: envía el correo y devuelve { canal: 'SMTP' }.
 * - Sin SMTP_HOST (modo simulado): imprime el mensaje en consola y devuelve { canal: 'SIMULADO' }.
 * Si el envío falla lanza un Error; quien llama decide marcarla FALLIDA.
 */
async function enviarCorreo({ para, asunto, texto, html }) {
  if (config.modoSimulado) {
    console.log(
      '\n┌── [correo SIMULADO] ──────────────────────────────\n' +
        `│ Para:   ${para}\n│ Asunto: ${asunto}\n├───────────────────────────────────────────────────\n` +
        texto.split('\n').map((l) => `│ ${l}`).join('\n') +
        '\n└───────────────────────────────────────────────────\n',
    );
    return { canal: 'SIMULADO' };
  }
  await obtenerTransporte().sendMail({ from: config.remitente, to: para, subject: asunto, text: texto, html });
  return { canal: 'SMTP' };
}

module.exports = { enviarCorreo };
