import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { catchError, forkJoin, of } from 'rxjs';

import { EmpresaService } from '../../../../core/services/empresa.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';
import { PostulacionEstadoEnum } from '../../../../core/models/enums.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';

/** CU-06, pasos 6-9: detalle de la empresa elegida (requisitos generales, horas
 * requeridas y documentos requeridos). El botón "Postularme" (paso 9) abre el
 * proceso de postulación; si el estudiante ya tiene una solicitud en trámite no
 * se ofrece (no puede enviar otra mientras esté en trámite). */
@Component({
  selector: 'app-empresa-detalle',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './empresa-detalle.html',
  styleUrl: './empresa-detalle.scss',
})
export class EmpresaDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly empresaService = inject(EmpresaService);
  private readonly postulacionService = inject(PostulacionService);

  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly enTramite = signal<PostulacionOut | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);

  constructor() {
    const empresaId = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      empresa: this.empresaService.obtener(empresaId),
      postulaciones: this.postulacionService.listarMias().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ empresa, postulaciones }) => {
        this.empresa.set(empresa);
        this.enTramite.set(
          postulaciones.find(
            (p) =>
              p.estado === PostulacionEstadoEnum.BORRADOR ||
              p.estado === PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
          ) ?? null,
        );
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorMensaje.set(
          error.status === 404
            ? 'Esta empresa no existe o ya no está disponible.'
            : 'No se pudo cargar el detalle de la empresa. Intenta de nuevo.',
        );
        this.cargando.set(false);
      },
    });
  }
}
