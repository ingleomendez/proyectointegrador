'use strict';

/**
 * Motor de plantillas de notificación (Arquitectura_JEDANIX_v2.md, sección 3).
 *
 * Cada evento que emite el Núcleo de Prácticas tiene una plantilla que, a
 * partir de los `datos` del evento, devuelve { asunto, texto, html }.
 * Los `datos` pueden venir vacíos (el Núcleo no siempre los envía), por lo que
 * toda plantilla debe producir un mensaje válido sin ellos.
 */

const config = require('../config');

const escaparHtml = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const saludo = (datos) => (datos.nombre_completo ? `Hola ${datos.nombre_completo},` : 'Hola,');

/** Campos de `datos` que nunca deben mostrarse en listados ni quedar guardados tras el envío. */
const CAMPOS_SENSIBLES = ['password_temporal'];

/**
 * Cada plantilla devuelve { asunto, parrafos: [...], destacado?, enlace? }.
 * `destacado` es una línea resaltada (por ejemplo, la contraseña temporal) y
 * `enlace` un botón { texto, ruta } hacia el frontend.
 */
const PLANTILLAS = {
  'usuario.creado': (d) => ({
    asunto: 'Bienvenido a JEDANIX: tus credenciales de acceso',
    parrafos: [
      saludo(d),
      'El Director creó tu cuenta en JEDANIX, el sistema de gestión de prácticas académicas.',
      'Estas son tus credenciales de acceso:',
    ],
    campos: [
      ['Usuario', d.destinatario_correo],
      ['Contraseña temporal', d.password_temporal || '(no disponible)'],
    ],
    cierre: ['Por seguridad, cambia la contraseña después de iniciar sesión por primera vez.'],
    enlace: { texto: 'Ingresar a JEDANIX', ruta: '/login' },
  }),

  'usuario.credenciales_reenviadas': (d) => ({
    asunto: 'JEDANIX: tus nuevas credenciales de acceso',
    parrafos: [
      saludo(d),
      'El Director te reenvió tus credenciales de acceso a JEDANIX. Se generó una contraseña temporal nueva: la anterior dejó de funcionar.',
      'Estas son tus credenciales:',
    ],
    campos: [
      ['Usuario', d.destinatario_correo],
      ['Contraseña temporal', d.password_temporal || '(no disponible)'],
    ],
    cierre: ['Por seguridad, no compartas esta contraseña con nadie.'],
    enlace: { texto: 'Ingresar a JEDANIX', ruta: '/login' },
  }),

  'usuario.reactivado': (d) => ({
    asunto: 'Tu cuenta de JEDANIX fue reactivada',
    parrafos: [saludo(d), 'Tu cuenta fue reactivada. Ya puedes volver a iniciar sesión con tus credenciales habituales.'],
    enlace: { texto: 'Ingresar a JEDANIX', ruta: '/login' },
  }),

  'postulacion.enviada': (d) => ({
    asunto: 'Nueva solicitud de práctica pendiente de revisión',
    parrafos: [
      saludo(d),
      d.empresa
        ? `Un estudiante envió una solicitud de práctica para la empresa ${d.empresa}. Está pendiente de tu revisión.`
        : 'Un estudiante envió una solicitud de práctica. Está pendiente de tu revisión.',
    ],
    enlace: { texto: 'Revisar solicitudes', ruta: '/director/solicitudes' },
  }),

  'postulacion.aprobada': (d) => ({
    asunto: 'Tu solicitud de práctica fue aceptada',
    parrafos: [
      saludo(d),
      'El Director aceptó tu solicitud de práctica: ya estás matriculado.',
      'El siguiente paso es plantear tus objetivos de práctica para que el Docente Asesor los apruebe. Cuando estén aprobados podrás registrar tus avances semanales.',
    ],
    enlace: { texto: 'Plantear mis objetivos', ruta: '/estudiante/objetivos' },
  }),

  'postulacion.rechazada': (d) => ({
    asunto: 'Tu solicitud de práctica fue rechazada',
    parrafos: [
      saludo(d),
      'El Director rechazó tu solicitud de práctica.',
      d.motivo ? `Motivo: ${d.motivo}` : 'Puedes consultar el motivo en el sistema.',
      'Puedes postularte nuevamente a otra empresa receptora.',
    ],
    enlace: { texto: 'Ver empresas receptoras', ruta: '/estudiante/empresas' },
  }),

  'practica.cerrada': (d) => ({
    asunto: 'La práctica fue cerrada formalmente',
    parrafos: [
      saludo(d),
      'El Director aprobó el cierre formal de la práctica: se alcanzaron las horas requeridas y la práctica quedó finalizada.',
    ],
    enlace: { texto: 'Ingresar a JEDANIX', ruta: '/login' },
  }),

  'practica.cierre_rechazado': (d) => ({
    asunto: 'El cierre de tu práctica no fue aprobado',
    parrafos: [
      saludo(d),
      'El Director no aprobó el cierre formal de tu práctica.',
      d.observacion ? `Observación: ${d.observacion}` : 'Puedes consultar la observación en el sistema.',
    ],
    enlace: { texto: 'Ver mi práctica', ruta: '/estudiante/mi-practica' },
  }),

  'avance.registrado': (d) => ({
    asunto: 'Nuevo avance semanal pendiente de revisión',
    parrafos: [
      saludo(d),
      'Un estudiante a tu cargo registró un nuevo avance semanal. Está pendiente de revisión.',
    ],
    enlace: { texto: 'Ver estudiantes', ruta: '/' },
  }),

  'avance.calificado': (d) => ({
    asunto: 'Tu avance semanal fue calificado',
    parrafos: [
      saludo(d),
      'El Coordinador de Práctica calificó tu avance semanal y fue aceptado. Las horas se sumarán a tu práctica.',
    ],
    enlace: { texto: 'Ver mi seguimiento', ruta: '/estudiante/avances' },
  }),

  'avance.observado': (d) => ({
    asunto: 'Tu avance semanal tiene observaciones',
    parrafos: [
      saludo(d),
      'El Coordinador de Práctica dejó comentarios en tu avance semanal. Debes corregirlo y reenviarlo.',
    ],
    enlace: { texto: 'Corregir mi avance', ruta: '/estudiante/avances' },
  }),

  'avance.observacion_docente': (d) => ({
    asunto: 'Tu Docente Asesor dejó una observación en tu avance',
    parrafos: [
      saludo(d),
      'Tu Docente Asesor dejó una observación en uno de tus avances semanales. Es informativa: no cambia el estado del avance.',
    ],
    enlace: { texto: 'Ver mi seguimiento', ruta: '/estudiante/avances' },
  }),

  'objetivos.pendientes': (d) => ({
    asunto: 'Objetivos de práctica pendientes de aprobación',
    parrafos: [
      saludo(d),
      d.estudiante
        ? `${d.estudiante} planteó sus objetivos de práctica y están pendientes de tu aprobación.`
        : 'Un estudiante a tu cargo planteó sus objetivos de práctica y están pendientes de tu aprobación.',
    ],
    enlace: { texto: 'Ver estudiantes', ruta: '/' },
  }),

  'objetivos.aprobados': (d) => ({
    asunto: 'Tus objetivos de práctica fueron aprobados',
    parrafos: [
      saludo(d),
      'Tu Docente Asesor aprobó tus objetivos de práctica. Ya puedes registrar tus avances semanales.',
    ],
    enlace: { texto: 'Registrar un avance', ruta: '/estudiante/avances' },
  }),

  'objetivos.rechazados': (d) => ({
    asunto: 'Tus objetivos de práctica fueron rechazados',
    parrafos: [
      saludo(d),
      'Tu Docente Asesor rechazó tus objetivos de práctica. Corrígelos teniendo en cuenta sus observaciones y vuelve a enviarlos.',
    ],
    enlace: { texto: 'Corregir mis objetivos', ruta: '/estudiante/objetivos' },
  }),
};

const eventosSoportados = () => Object.keys(PLANTILLAS);
const esEventoSoportado = (evento) => Object.hasOwn(PLANTILLAS, evento);

function aTexto(spec, urlEnlace) {
  const lineas = [...spec.parrafos];
  if (spec.campos) lineas.push(...spec.campos.map(([k, v]) => `${k}: ${v}`));
  if (spec.cierre) lineas.push(...spec.cierre);
  if (urlEnlace) lineas.push(`${spec.enlace.texto}: ${urlEnlace}`);
  lineas.push('— JEDANIX · Gestión de prácticas académicas');
  return lineas.join('\n\n');
}

function aHtml(spec, urlEnlace) {
  const parrafos = spec.parrafos.map((p) => `<p style="margin:0 0 14px">${escaparHtml(p)}</p>`).join('');
  const campos = spec.campos
    ? `<table role="presentation" style="margin:0 0 16px;border-collapse:collapse">${spec.campos
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 14px 6px 0;color:#546e7a">${escaparHtml(k)}</td>` +
            `<td style="padding:6px 0;font-weight:bold;font-family:Consolas,monospace">${escaparHtml(v)}</td></tr>`,
        )
        .join('')}</table>`
    : '';
  const cierre = (spec.cierre || []).map((p) => `<p style="margin:0 0 14px">${escaparHtml(p)}</p>`).join('');
  const boton = urlEnlace
    ? `<p style="margin:20px 0"><a href="${escaparHtml(urlEnlace)}" style="background:#00acc1;color:#fff;` +
      `padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escaparHtml(spec.enlace.texto)}</a></p>`
    : '';
  return (
    '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#263238;max-width:560px;margin:auto">' +
    '<div style="background:#00acc1;color:#fff;padding:14px 20px;border-radius:8px 8px 0 0;font-size:18px;font-weight:bold">JEDANIX</div>' +
    '<div style="border:1px solid #e0f2f1;border-top:none;padding:22px 20px;border-radius:0 0 8px 8px">' +
    parrafos + campos + cierre + boton +
    '</div>' +
    '<p style="color:#90a4ae;font-size:12px;margin-top:12px">Gestión de prácticas académicas · mensaje automático, no respondas a este correo.</p>' +
    '</div>'
  );
}

/** Solo el asunto: se guarda al recibir el evento. */
function asuntoDe(evento, datos = {}, destinatarioCorreo = '') {
  return PLANTILLAS[evento]({ ...datos, destinatario_correo: destinatarioCorreo }).asunto;
}

/** Mensaje completo { asunto, texto, html } listo para enviar. */
function renderizar(evento, datos = {}, destinatarioCorreo = '') {
  if (!esEventoSoportado(evento)) throw new Error(`Evento no soportado: ${evento}`);
  const spec = PLANTILLAS[evento]({ ...datos, destinatario_correo: destinatarioCorreo });
  const urlEnlace = spec.enlace ? `${config.frontendUrl}${spec.enlace.ruta}` : null;
  return { asunto: spec.asunto, texto: aTexto(spec, urlEnlace), html: aHtml(spec, urlEnlace) };
}

/** Copia de `datos` sin los campos sensibles. */
function sinCamposSensibles(datos = {}) {
  const copia = { ...datos };
  for (const campo of CAMPOS_SENSIBLES) delete copia[campo];
  return copia;
}

module.exports = {
  eventosSoportados,
  esEventoSoportado,
  asuntoDe,
  renderizar,
  sinCamposSensibles,
  escaparHtml,
};
