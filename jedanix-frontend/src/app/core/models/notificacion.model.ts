/** Replica de `app/schemas/notificacion_usuario.py`: avisos de la "campanita". */

export interface NotificacionUsuario {
  id: number;
  evento: string;
  titulo: string;
  mensaje: string;
  /** Pantalla a la que lleva el aviso (null si no tiene destino). */
  ruta: string | null;
  leida: boolean;
  creada_en: string;
}

export interface MisNotificaciones {
  /** Total de avisos sin leer (no solo los de esta página). */
  no_leidas: number;
  notificaciones: NotificacionUsuario[];
}
