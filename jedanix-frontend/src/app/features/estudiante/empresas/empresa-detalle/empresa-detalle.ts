import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';

import { EmpresaService } from '../../../../core/services/empresa.service';
import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';

/** CU-06, pasos 6-7: el Estudiante revisa el detalle completo de una empresa
 * (requisitos, horas, bitácora y documentos que va a tener que diligenciar)
 * antes de decidir postularse. El botón "Postularme" lleva al formulario de
 * postulación (postulacion-nueva) para esta misma empresa. */
@Component({
  selector: 'app-empresa-detalle',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
  ],
  templateUrl: './empresa-detalle.html',
  styleUrl: './empresa-detalle.scss',
})
export class EmpresaDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly empresaService = inject(EmpresaService);

  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);

  constructor() {
    const empresaId = Number(this.route.snapshot.paramMap.get('id'));
    this.empresaService.obtener(empresaId).subscribe({
      next: (datos) => {
        this.empresa.set(datos);
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
