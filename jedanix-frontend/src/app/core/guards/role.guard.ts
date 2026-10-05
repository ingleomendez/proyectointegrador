import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { RolEnum } from '../models/usuario.model';

/** Fábrica de guard por rol (equivalente a `requiere_rol(*roles)` en
 * `app/core/deps.py` del backend): cada sección de rutas declara qué roles
 * puede ver, y si el usuario autenticado no tiene uno de esos roles, lo
 * manda de vuelta al login en lugar de mostrarle una pantalla que no le
 * corresponde. */
export function roleGuard(rolesPermitidos: RolEnum[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const usuario = authService.usuario();
    if (usuario && rolesPermitidos.includes(usuario.rol)) {
      return true;
    }

    router.navigateByUrl('/login');
    return false;
  };
}
