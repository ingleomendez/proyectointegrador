'use strict';

const { Router } = require('express');
const servicio = require('../services/notificacionService');

const router = Router();

const ESTADOS = ['PENDIENTE', 'ENVIADA', 'FALLIDA'];

/** GET /notificaciones?estado=FALLIDA&correo=...&limite=50 — historial (sin datos sensibles). */
router.get('/notificaciones', async (req, res, next) => {
  try {
    const { estado, correo, limite } = req.query;
    if (estado && !ESTADOS.includes(String(estado))) {
      return res.status(400).json({ detail: `"estado" debe ser uno de: ${ESTADOS.join(', ')}.` });
    }
    const filas = await servicio.listar({
      estado: estado ? String(estado) : undefined,
      correo: correo ? String(correo) : undefined,
      limite,
    });
    return res.json(filas);
  } catch (err) {
    return next(err);
  }
});

/** POST /notificaciones/:id/reenviar — reenvío manual (CU-01 19.1.a). */
router.post('/notificaciones/:id/reenviar', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ detail: 'El id debe ser un entero positivo.' });
    }
    const estado = await servicio.reenviar(id);
    if (estado === null) return res.status(404).json({ detail: `No existe la notificación ${id}.` });
    return res.json({ id, estado });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
