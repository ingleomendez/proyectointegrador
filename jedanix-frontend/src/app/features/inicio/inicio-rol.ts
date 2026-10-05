import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { accesosDeRol, NOMBRE_ROL } from '../../core/utils/menu-rol';

/** Panel de inicio compartido por Director, Coordinador y Docente Asesor:
 * las tarjetas salen del menú del rol (`accesosDeRol`). El Estudiante
 * conserva su propio `Inicio`. */
@Component({
  selector: 'app-inicio-rol',
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './inicio-rol.html',
  styleUrl: './inicio-rol.scss',
})
export class InicioRol {
  protected readonly authService = inject(AuthService);

  protected readonly nombreRol = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? NOMBRE_ROL[usuario.rol] : '';
  });

  protected readonly accesos = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? accesosDeRol(usuario.rol) : [];
  });
}
