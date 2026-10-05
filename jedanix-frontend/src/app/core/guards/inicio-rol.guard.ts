import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { rutaInicioDeRol } from '../utils/menu-rol';

/** La ruta raíz `/` no tiene pantalla propia: manda a cada usuario al panel
 * de su rol (o al login si no hay sesión). */
export const inicioRolGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.usuario();
  return router.parseUrl(usuario ? rutaInicioDeRol(usuario.rol) : '/login');
};
