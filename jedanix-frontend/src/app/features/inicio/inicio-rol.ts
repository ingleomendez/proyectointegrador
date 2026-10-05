import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { EstadoEstudianteService } from '../../core/services/estado-estudiante.service';
import { accesosDeRol, NOMBRE_ROL } from '../../core/utils/menu-rol';

/** Panel de inicio de los cuatro roles: las tarjetas salen del mismo menú que la
 * barra lateral (`accesosDeRol`), así los nombres y la visibilidad coinciden con
 * los casos de uso (para el Estudiante dependen de su estado de práctica). */
@Component({
  selector: 'app-inicio-rol',
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './inicio-rol.html',
  styleUrl: './inicio-rol.scss',
})
export class InicioRol {
  protected readonly authService = inject(AuthService);
  private readonly estadoEstudiante = inject(EstadoEstudianteService);

  protected readonly nombreRol = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? NOMBRE_ROL[usuario.rol] : '';
  });

  protected readonly accesos = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? accesosDeRol(usuario.rol, this.estadoEstudiante.contexto()) : [];
  });
}
