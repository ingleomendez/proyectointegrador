import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { EmpresaService } from '../../../../core/services/empresa.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { EmpresaReceptoraListItem } from '../../../../core/models/empresa.model';
import { PostulacionEstadoEnum } from '../../../../core/models/enums.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { etiquetaEstadoPostulacion } from '../../../../core/utils/estados';

/** CU-06, pasos 1-5 ("Solicitud de práctica"): valida que el estudiante no tenga ya
 * una práctica MATRICULADA (excepción 2.1.a: lo redirige a "Mi Práctica" con un
 * mensaje) y lista las empresas receptoras ACTIVAS con nombre y descripción breve
 * (excepción 3.1.a si no hay ninguna). Si ya tiene una solicitud en trámite se la
 * muestra arriba para consultar su estado, porque no puede enviar otra. */
@Component({
  selector: 'app-empresas-lista',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './empresas-lista.html',
  styleUrl: './empresas-lista.scss',
})
export class EmpresasLista {
  private readonly empresaService = inject(EmpresaService);
  private readonly postulacionService = inject(PostulacionService);
  private readonly router = inject(Router);

  protected readonly empresas = signal<EmpresaReceptoraListItem[]>([]);
  protected readonly enTramite = signal<PostulacionOut | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);

  protected readonly etiquetaEstado = etiquetaEstadoPostulacion;

  constructor() {
    forkJoin({
      postulaciones: this.postulacionService.listarMias(),
      empresas: this.empresaService.listar(),
    }).subscribe({
      next: ({ postulaciones, empresas }) => {
        // Paso 2 / excepción 2.1.a: ya matriculado => no puede solicitar otra práctica.
        if (postulaciones.some((p) => p.estado === PostulacionEstadoEnum.APROBADA)) {
          this.router.navigate(['/estudiante/mi-practica'], {
            queryParams: { aviso: 'matriculado' },
          });
          return;
        }
        this.enTramite.set(
          postulaciones.find(
            (p) =>
              p.estado === PostulacionEstadoEnum.BORRADOR ||
              p.estado === PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
          ) ?? null,
        );
        this.empresas.set(empresas);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar las empresas disponibles. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  protected resumen(texto: string | undefined): string {
    if (!texto) {
      return '';
    }
    return texto.length > 140 ? `${texto.slice(0, 137).trimEnd()}...` : texto;
  }
}
