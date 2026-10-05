import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

/** Adjunta `Authorization: Bearer <token>` a toda petición saliente cuando
 * hay una sesión activa -- equivalente, del lado del frontend, a lo que
 * hacíamos a mano en el botón "Authorize" de Swagger. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  if (!token) {
    return next(req);
  }

  const reqConToken = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(reqConToken);
};
