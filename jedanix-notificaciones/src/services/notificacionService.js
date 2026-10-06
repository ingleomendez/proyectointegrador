'use strict';

const { pool } = require('../db');
const config = require('../config');
const plantillas = require('./plantillas');
const { enviarCorreo } = require('./mailer');

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Error de validación del evento recibido (se traduce a HTTP 400). */
class EventoInvalidoError extends Error {}

function validarEvento(cuerpo) {
  const { evento, destinatario_correo: correo, datos } = cuerpo || {};
  if (typeof evento !== 'string' || !plantillas.esEventoSoportado(evento)) {
    throw new EventoInvalidoError(
      `Evento no soportado: "${evento}". Eventos válidos: ${plantillas.eventosSoportados().join(', ')}.`,
    );
  }
  if (typeof correo !== 'string' || !FORMATO_CORREO.test(correo.trim())) {
    throw new EventoInvalidoError('"destinatario_correo" debe ser un correo válido.');
  }
  if (datos !== undefined && datos !== null && (typeof datos !== 'object' || Array.isArray(datos))) {
    throw new EventoInvalidoError('"datos" debe ser un objeto.');
  }
  return { evento, correo: correo.trim(), datos: datos || {} };
}

/** Registra el evento como PENDIENTE (lo primero que ocurre al recibirlo). */
async function registrarEvento(cuerpo) {
  const { evento, correo, datos } = validarEvento(cuerpo);
  const asunto = plantillas.asuntoDe(evento, datos, correo);
  const { rows } = await pool.query(
    `INSERT INTO notificaciones (evento, destinatario_correo, asunto, datos)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, evento, destinatario_correo, estado`,
    [evento, correo, asunto, JSON.stringify(datos)],
  );
  return rows[0];
}

/**
 * Intenta enviar una notificación y deja su resultado registrado.
 * - Éxito: ENVIADA (y se borran de `datos` los campos sensibles, p. ej. la contraseña temporal).
 * - Fallo: FALLIDA con `ultimo_error`; el job de reintentos la retomará.
 * Nunca lanza: cualquier error queda guardado en la fila.
 */
async function procesar(id) {
  let fila;
  try {
    const { rows } = await pool.query(
      `UPDATE notificaciones
          SET intentos = intentos + 1, actualizada_en = now()
        WHERE id = $1 AND estado <> 'ENVIADA'
      RETURNING id, evento, destinatario_correo, datos, intentos`,
      [id],
    );
    fila = rows[0];
    if (!fila) return null; // ya enviada o inexistente

    const mensaje = plantillas.renderizar(fila.evento, fila.datos, fila.destinatario_correo);
    const { canal } = await enviarCorreo({
      para: fila.destinatario_correo,
      asunto: mensaje.asunto,
      texto: mensaje.texto,
      html: mensaje.html,
    });
    await pool.query(
      `UPDATE notificaciones
          SET estado = 'ENVIADA', canal = $2, ultimo_error = NULL,
              datos = $3::jsonb, enviada_en = now(), actualizada_en = now()
        WHERE id = $1`,
      [id, canal, JSON.stringify(plantillas.sinCamposSensibles(fila.datos))],
    );
    return 'ENVIADA';
  } catch (err) {
    console.error(`[notificaciones] Falló la notificación #${id}: ${err.message}`);
    try {
      await pool.query(
        `UPDATE notificaciones SET estado = 'FALLIDA', ultimo_error = $2, actualizada_en = now() WHERE id = $1`,
        [id, String(err.message).slice(0, 1000)],
      );
    } catch (errBd) {
      console.error(`[notificaciones] No se pudo registrar el fallo de #${id}: ${errBd.message}`);
    }
    return 'FALLIDA';
  }
}

/**
 * Notificaciones a reintentar: FALLIDA con intentos disponibles (espera creciente
 * entre intentos) y PENDIENTE "huérfanas" (el servicio se cayó antes de enviarlas).
 */
async function pendientesDeReintento() {
  const { rows } = await pool.query(
    `SELECT id FROM notificaciones
      WHERE intentos < $1
        AND (
              (estado = 'FALLIDA'   AND actualizada_en <= now() - (intentos * interval '30 seconds'))
           OR (estado = 'PENDIENTE' AND actualizada_en <= now() - interval '2 minutes')
        )
      ORDER BY id
      LIMIT 50`,
    [config.reintentos.maxIntentos],
  );
  return rows.map((r) => r.id);
}

async function listar({ estado, correo, limite = 50 } = {}) {
  const condiciones = [];
  const valores = [];
  if (estado) {
    valores.push(estado);
    condiciones.push(`estado = $${valores.length}::notificacion_estado`);
  }
  if (correo) {
    valores.push(correo);
    condiciones.push(`destinatario_correo = $${valores.length}`);
  }
  valores.push(Math.min(Math.max(parseInt(limite, 10) || 50, 1), 200));
  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT id, evento, destinatario_correo, asunto, estado, canal, intentos, ultimo_error,
            creada_en, enviada_en
       FROM notificaciones ${donde}
      ORDER BY id DESC LIMIT $${valores.length}`,
    valores,
  );
  return rows;
}

/** Reenvío manual (CU-01 19.1.a): devuelve el estado resultante o null si no existe. */
async function reenviar(id) {
  const { rows } = await pool.query('SELECT estado FROM notificaciones WHERE id = $1', [id]);
  if (!rows[0]) return null;
  if (rows[0].estado === 'ENVIADA') return 'ENVIADA';
  // Reinicia el contador para que el reenvío manual no quede limitado por los reintentos automáticos.
  await pool.query('UPDATE notificaciones SET intentos = 0 WHERE id = $1', [id]);
  return procesar(id);
}

module.exports = {
  EventoInvalidoError,
  registrarEvento,
  procesar,
  pendientesDeReintento,
  listar,
  reenviar,
};
