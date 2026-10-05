import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { menuDeRol, NOMBRE_ROL } from '../../core/utils/menu-rol';

/** Armazón visual compartido por todas las pantallas autenticadas: barra
 * superior con el menú del rol activo, acceso a Mi Perfil y botón de cerrar
 * sesión, más el `router-outlet` donde se monta cada módulo. El logo
 * "JEDANIX" enlaza a `/`, que redirige al panel de inicio del rol (ver
 * `inicioRolGuard`) -- así toda pantalla, por anidada que esté, tiene una
 * forma de volver al inicio. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly authService = inject(AuthService);

  protected readonly menu = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? menuDeRol(usuario.rol) : [];
  });

  protected readonly nombreRol = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? NOMBRE_ROL[usuario.rol] : '';
  });

  cerrarSesion(): void {
    this.authService.logout();
  }
}
