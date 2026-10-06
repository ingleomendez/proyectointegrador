'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// El mailer lee la configuración al cargarse: se fija el entorno antes del require.
process.env.BREVO_API_KEY = 'clave-de-prueba';
process.env.MAIL_FROM = 'JEDANIX <remitente@ejemplo.com>';
delete process.env.SMTP_HOST;

const { enviarCorreo, parsearRemitente } = require('../src/services/mailer');

test('parsearRemitente separa nombre y correo', () => {
  assert.deepEqual(parsearRemitente('JEDANIX <a@b.com>'), { name: 'JEDANIX', email: 'a@b.com' });
  assert.deepEqual(parsearRemitente('"Mi App" <a@b.com>'), { name: 'Mi App', email: 'a@b.com' });
  assert.deepEqual(parsearRemitente('a@b.com'), { email: 'a@b.com' });
});

test('con BREVO_API_KEY envía por HTTPS a la API de Brevo', async () => {
  const original = global.fetch;
  let llamada;
  global.fetch = async (url, opciones) => {
    llamada = { url, opciones };
    return { ok: true, status: 201, text: async () => '{}' };
  };
  try {
    const r = await enviarCorreo({ para: 'est@x.co', asunto: 'Hola', texto: 'cuerpo', html: '<p>cuerpo</p>' });
    assert.equal(r.canal, 'BREVO');
    assert.equal(llamada.url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(llamada.opciones.headers['api-key'], 'clave-de-prueba');
    const cuerpo = JSON.parse(llamada.opciones.body);
    assert.deepEqual(cuerpo.sender, { name: 'JEDANIX', email: 'remitente@ejemplo.com' });
    assert.deepEqual(cuerpo.to, [{ email: 'est@x.co' }]);
    assert.equal(cuerpo.subject, 'Hola');
    assert.equal(cuerpo.htmlContent, '<p>cuerpo</p>');
  } finally {
    global.fetch = original;
  }
});

test('si Brevo responde error lanza Error (la notificación queda FALLIDA)', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ ok: false, status: 401, text: async () => 'unauthorized' });
  try {
    await assert.rejects(
      enviarCorreo({ para: 'a@b.co', asunto: 's', texto: 't' }),
      /Brevo respondió 401/,
    );
  } finally {
    global.fetch = original;
  }
});
