'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');

const URL_BREVO = 'https://api.brevo.com/v3/smtp/email';

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

/** Convierte 'JEDANIX <correo@dominio.com>' en { name, email } (formato de Brevo). */
function parsearRemitente(texto) {
  const valor = String(texto || '').trim();
  const m = valor.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || undefined, email: m[2].trim() };
  return { email: valor };
}

/** Envía el correo por la API HTTPS de Brevo. Lanza Error si Brevo no responde 2xx. */
async function enviarPorBrevo({ para, asunto, texto, html }) {
  const cuerpo = {
    sender: parsearRemitente(config.remitente),
    to: [{ email: para }],
    subject: asunto,
    textContent: texto,
  };
  if (html) cuerpo.htmlContent = html;

  const respuesta = await fetch(URL_BREVO, {
    method: 'POST',
    headers: {
      'api-key': config.brevoApiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(15000),
  });
  if (!respuesta.ok) {
    const detalle = (await respuesta.text().catch(() => '')).slice(0, 300);
    throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
  }
}

/**
 * Cliente de Envío (Arquitectura_JEDANIX_v2.md, sección 3).
 * - Con BREVO_API_KEY: envía por la API HTTPS de Brevo y devuelve { canal: 'BREVO' }.
 * - Con SMTP_HOST: envía por SMTP y devuelve { canal: 'SMTP' }.
 * - Sin ninguno (modo simulado): imprime el mensaje en consola y devuelve { canal: 'SIMULADO' }.
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
  if (config.brevoApiKey) {
    await enviarPorBrevo({ para, asunto, texto, html });
    return { canal: 'BREVO' };
  }
  await obtenerTransporte().sendMail({ from: config.remitente, to: para, subject: asunto, text: texto, html });
  return { canal: 'SMTP' };
}

module.exports = { enviarCorreo, parsearRemitente };
