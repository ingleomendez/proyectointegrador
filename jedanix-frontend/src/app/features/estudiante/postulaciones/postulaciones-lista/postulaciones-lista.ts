import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { PostulacionService } from '../../../../core/services/postulacion.service';
import { PostulacionOut } from '../../../../core/models/postulacion.model';

/** CU-06/CU-07: listado de las postulaciones del Estudiante autenticado. */
@Component({
  selector: 'app-postulaciones-lista',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './postulaciones-lista.html',
  styleUrl: './postulaciones-lista.scss',
})
export class PostulacionesLista {
  private readonly postulacionService = inject(PostulacionService);

  protected readonly postulaciones = signal<PostulacionOut[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);

  constructor() {
    this.postulacionService.listarMias().subscribe({
      next: (datos) => {
        this.postulaciones.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar tus postulaciones. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }
}
