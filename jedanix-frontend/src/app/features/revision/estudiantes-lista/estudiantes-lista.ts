import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostulacionListItem } from '../../../core/models/postulacion.model';
import { AuthService } from '../../../core/services/auth.service';
import { PostulacionService } from '../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../core/utils/errores';
import { rutaInicioDeRol } from '../../../core/utils/menu-rol';
import { RolEnum } from '../../../core/models/usuario.model';

/** CU-09 / CU-10, paso 2: estudiantes matriculados en las empresas donde el
 * usuario es Coordinador o Docente Asesor (el backend filtra por el rol del
 * token). */
@Component({
  selector: 'app-estudiantes-lista',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './estudiantes-lista.html',
})
export class EstudiantesLista {
  private readonly postulacionService = inject(PostulacionService);
  private readonly authService = inject(AuthService);

  protected readonly rutaBase = rutaInicioDeRol(
    this.authService.usuario()?.rol ?? RolEnum.COORDINADOR,
  );

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly estudiantes = signal<PostulacionListItem[]>([]);

  constructor() {
    this.postulacionService.listarMatriculados().subscribe({
      next: (datos) => {
        this.estudiantes.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los estudiantes.'));
        this.cargando.set(false);
      },
    });
  }
}
