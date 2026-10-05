import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { PostulacionService } from '../../../../core/services/postulacion.service';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { PostulacionEstadoEnum } from '../../../../core/models/enums.model';

/** CU-06/CU-07: detalle de una postulación propia. Si está en BORRADOR,
 * permite enviarla formalmente (flujo alterno 9.1.a). */
@Component({
  selector: 'app-postulacion-detalle',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './postulacion-detalle.html',
  styleUrl: './postulacion-detalle.scss',
})
export class PostulacionDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly postulacionService = inject(PostulacionService);

  protected readonly PostulacionEstadoEnum = PostulacionEstadoEnum;

  protected readonly postulacion = signal<PostulacionOut | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargando.set(true);
    this.postulacionService.obtener(id).subscribe({
      next: (datos) => {
        this.postulacion.set(datos);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMensaje.set(
          error.status === 403
            ? 'No tienes permiso para ver esta postulación.'
            : 'No se pudo cargar la postulación.',
        );
        this.cargando.set(false);
      },
    });
  }

  enviarBorrador(): void {
    const datos = this.postulacion();
    if (!datos) {
      return;
    }
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.postulacionService.enviarBorrador(datos.id).subscribe({
      next: (actualizada) => {
        this.postulacion.set(actualizada);
        this.enviando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorEnvio.set(
          error.error?.detail ?? 'No se pudo enviar la solicitud. Intenta de nuevo.',
        );
      },
    });
  }
}
