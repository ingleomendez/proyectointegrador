import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AvanceSemanalOut } from '../../../../core/models/avance.model';
import { AvanceEstadoEnum } from '../../../../core/models/enums.model';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { AvanceService } from '../../../../core/services/avance.service';
import { etiquetaEstadoAvance } from '../../../../core/utils/semana';

/** CU-08, flujo alterno 6.1.a / 6.1.b: detalle de solo lectura de un avance
 * ya enviado, con calificación del Coordinador, observación del Docente
 * Asesor y enlaces para abrir/descargar cada soporte. */
@Component({
  selector: 'app-avance-detalle',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './avance-detalle.html',
  styleUrl: './avance-detalle.scss',
})
export class AvanceDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly avanceService = inject(AvanceService);
  protected readonly archivoService = inject(ArchivoService);

  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly avance = signal<AvanceSemanalOut | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.avanceService.obtener(id).subscribe({
      next: (datos) => {
        this.avance.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudo cargar el avance. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  protected nombreArchivo(ruta: string): string {
    const nombre = ruta.split('/').pop() ?? ruta;
    // Quita el prefijo uuid_ que agrega el backend.
    return nombre.replace(/^[0-9a-f]{32}_/, '');
  }
}
