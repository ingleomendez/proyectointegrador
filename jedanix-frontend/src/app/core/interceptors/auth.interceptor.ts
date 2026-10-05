import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/** Adjunta `Authorization: Bearer <token>` a toda petición saliente cuando
 * hay una sesión activa -- equivalente, del lado del frontend, a lo que
 * hacíamos a mano en el botón "Authorize" de Swagger.
 *
 * Además, si el backend responde 401 estando logueado (el token venció),
 * cierra la sesión y manda al login en vez de dejar cada pantalla mostrando
 * "No se pudieron cargar...". Un 401 del propio login (credenciales malas)
 * no cuenta: ahí no hay sesión previa que cerrar. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  if (!token) {
    return next(req);
  }

  const reqConToken = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(reqConToken).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
