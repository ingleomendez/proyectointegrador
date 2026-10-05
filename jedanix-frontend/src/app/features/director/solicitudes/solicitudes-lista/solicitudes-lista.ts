import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostulacionListItem } from '../../../../core/models/postulacion.model';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../../core/utils/errores';

interface GrupoEmpresa {
  empresaId: number;
  empresaNombre: string;
  solicitudes: PostulacionListItem[];
}

/** CU-03 (Director), pasos 1-5: solicitudes pendientes de aprobación,
 * agrupadas por empresa receptora. */
@Component({
  selector: 'app-solicitudes-lista',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './solicitudes-lista.html',
})
export class SolicitudesLista {
  private readonly postulacionService = inject(PostulacionService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly solicitudes = signal<PostulacionListItem[]>([]);

  protected readonly grupos = computed<GrupoEmpresa[]>(() => {
    const mapa = new Map<number, GrupoEmpresa>();
    for (const s of this.solicitudes()) {
      const grupo = mapa.get(s.empresa.id) ?? {
        empresaId: s.empresa.id,
        empresaNombre: s.empresa.nombre,
        solicitudes: [],
      };
      grupo.solicitudes.push(s);
      mapa.set(s.empresa.id, grupo);
    }
    return [...mapa.values()];
  });

  constructor() {
    this.postulacionService.listarPendientes().subscribe({
      next: (datos) => {
        this.solicitudes.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar las solicitudes.'));
        this.cargando.set(false);
      },
    });
  }
}
