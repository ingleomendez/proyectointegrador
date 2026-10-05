import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { EmpresaService } from '../../../../core/services/empresa.service';
import { EmpresaReceptoraListItem } from '../../../../core/models/empresa.model';

/** CU-06, pasos 4-5: listado de empresas receptoras ACTIVAS disponibles para
 * postularse. El filtro por estado ya lo aplica el backend según el rol del
 * token (ver `EmpresaService.listar`). */
@Component({
  selector: 'app-empresas-lista',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './empresas-lista.html',
  styleUrl: './empresas-lista.scss',
})
export class EmpresasLista {
  private readonly empresaService = inject(EmpresaService);

  protected readonly empresas = signal<EmpresaReceptoraListItem[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);

  constructor() {
    this.empresaService.listar().subscribe({
      next: (datos) => {
        this.empresas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar las empresas disponibles. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }
}
