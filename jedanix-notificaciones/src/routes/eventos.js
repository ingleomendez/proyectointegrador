'use strict';

const { Router } = require('express');
const servicio = require('../services/notificacionService');
const plantillas = require('../services/plantillas');

const router = Router();

/**
 * POST /eventos — lo llama el Núcleo de Prácticas (fire-and-forget).
 * Body: { evento, destinatario_correo, datos? }
 * Registra la notificación como PENDIENTE, responde 202 de inmediato y envía el
 * correo en segundo plano, para no hacer esperar al Núcleo.
 */
router.post('/eventos', async (req, res, next) => {
  try {
    const registrada = await servicio.registrarEvento(req.body);
    res.status(202).json({ id: registrada.id, estado: registrada.estado });
    setImmediate(() => servicio.procesar(registrada.id));
  } catch (err) {
    next(err);
  }
});

/** GET /eventos/tipos — catálogo de eventos soportados (útil para depurar). */
router.get('/eventos/tipos', (_req, res) => {
  res.json({ eventos: plantillas.eventosSoportados() });
});

module.exports = router;
