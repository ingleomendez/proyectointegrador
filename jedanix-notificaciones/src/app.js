'use strict';

const express = require('express');
const { pool } = require('./db');
const config = require('./config');
const { EventoInvalidoError } = require('./services/notificacionService');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.get('/salud', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ servicio: 'jedanix-notificaciones', estado: 'ok', base_de_datos: 'ok', correo: config.modoSimulado ? 'simulado' : 'smtp' });
  } catch (err) {
    res.status(503).json({ servicio: 'jedanix-notificaciones', estado: 'error', base_de_datos: err.message });
  }
});

app.use(require('./routes/eventos'));
app.use(require('./routes/notificaciones'));

app.use((_req, res) => {
  res.status(404).json({ detail: 'Ruta no encontrada.' });
});

// Mismo formato de error que el Núcleo (FastAPI): { detail: "..." }
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof EventoInvalidoError) return res.status(400).json({ detail: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ detail: 'El cuerpo no es un JSON válido.' });
  console.error('[error]', err);
  return res.status(500).json({ detail: 'Error interno del servicio de notificaciones.' });
});

module.exports = app;
