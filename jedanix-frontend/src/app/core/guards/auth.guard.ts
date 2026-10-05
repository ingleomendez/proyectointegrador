import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Protege las rutas que exigen cualquier sesión iniciada (equivalente a
 * `get_current_usuario` en `app/core/deps.py` del backend). */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  router.navigateByUrl('/login');
  return false;
};
