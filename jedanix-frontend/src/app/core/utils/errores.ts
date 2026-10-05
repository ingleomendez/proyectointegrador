import { HttpErrorResponse } from '@angular/common/http';

/** Extrae un mensaje legible de un error del backend. FastAPI responde
 * `{detail: "texto"}` para errores de negocio y `{detail: [{msg, loc}]}` para
 * errores de validación de Pydantic (422); ambos casos se resuelven aquí. */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof HttpErrorResponse) {
    const detalle = error.error?.detail;
    if (typeof detalle === 'string' && detalle.trim()) {
      return detalle;
    }
    if (Array.isArray(detalle) && detalle.length > 0) {
      const mensajes = detalle
        .map((d: { msg?: string }) => (d?.msg ?? '').replace(/^Value error, /, ''))
        .filter((m: string) => m);
      if (mensajes.length > 0) {
        return mensajes.join(' ');
      }
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
  }
  return porDefecto;
}

/** Respuesta 409 del backend con `requiere_confirmacion: true`
 * (`RequiereConfirmacionError`): la operación es válida pero necesita que el
 * usuario confirme y repita la llamada con el parámetro de confirmación. */
export interface ConfirmacionRequerida {
  mensaje: string;
  detalle: Record<string, unknown>;
}

export function leerConfirmacion(error: unknown): ConfirmacionRequerida | null {
  if (error instanceof HttpErrorResponse && error.status === 409 && error.error?.requiere_confirmacion) {
    return {
      mensaje: typeof error.error.detail === 'string' ? error.error.detail : 'Confirma para continuar.',
      detalle: error.error.detalle ?? {},
    };
  }
  return null;
}
