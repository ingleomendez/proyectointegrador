import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaEstadoEnum } from '../../../../core/models/enums.model';
import { EmpresaReceptoraListItem } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { mensajeDeError } from '../../../../core/utils/errores';

/** CU-02 (Director), pasos 1-3: listado completo de empresas receptoras
 * (activas e inactivas) con su Coordinador y Docente Asesor. */
@Component({
  selector: 'app-empresas-lista-director',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './empresas-lista.html',
})
export class EmpresasListaDirector {
  private readonly empresaService = inject(EmpresaService);

  protected readonly EmpresaEstadoEnum = EmpresaEstadoEnum;

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly empresas = signal<EmpresaReceptoraListItem[]>([]);

  constructor() {
    this.empresaService.listar().subscribe({
      next: (datos) => {
        this.empresas.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar las empresas.'));
        this.cargando.set(false);
      },
    });
  }
}
