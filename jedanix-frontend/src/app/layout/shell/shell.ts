import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

/** Armazón visual compartido por todas las pantallas autenticadas: barra
 * superior con el nombre/rol de la sesión activa y botón de cerrar sesión,
 * más el `router-outlet` donde se monta cada módulo (Estudiante, y luego
 * Director/Coordinador/Docente Asesor). El logo "JEDANIX" enlaza a `/`, que
 * siempre redirige al inicio del rol activo (hoy `/estudiante`) -- así toda
 * pantalla, sin importar cuán anidada esté, tiene una forma de volver al
 * panel de inicio sin depender de que cada pantalla hija agregue su propio
 * enlace de "volver". */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly authService = inject(AuthService);

  cerrarSesion(): void {
    this.authService.logout();
  }
}
