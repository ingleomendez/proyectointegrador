import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostulacionListItem } from '../../../../core/models/postulacion.model';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../../core/utils/errores';

/** CU-04 / CU-05 (Director): prácticas en curso (estudiantes matriculados) y
 * acceso a la revisión de cierre formal de cada una. */
@Component({
  selector: 'app-matriculados-lista',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './matriculados-lista.html',
})
export class MatriculadosLista {
  private readonly postulacionService = inject(PostulacionService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly matriculados = signal<PostulacionListItem[]>([]);

  constructor() {
    this.postulacionService.listarMatriculados().subscribe({
      next: (datos) => {
        this.matriculados.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los estudiantes matriculados.'));
        this.cargando.set(false);
      },
    });
  }
}
