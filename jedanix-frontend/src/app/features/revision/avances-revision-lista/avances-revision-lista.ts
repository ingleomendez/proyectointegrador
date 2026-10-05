import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AvanceSemanalListItem } from '../../../core/models/avance.model';
import { AvanceEstadoEnum } from '../../../core/models/enums.model';
import { RolEnum } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { AvanceService } from '../../../core/services/avance.service';
import { mensajeDeError } from '../../../core/utils/errores';
import { rutaInicioDeRol } from '../../../core/utils/menu-rol';
import { etiquetaEstadoAvance } from '../../../core/utils/semana';

/**
 * CU-09 (Coordinador) y CU-10 (Docente Asesor), pasos 1-7: bandeja de avances
 * semanales de los estudiantes matriculados bajo su responsabilidad, con
 * filtro por estado. El Coordinador entra viendo los pendientes de revisión.
 */
@Component({
  selector: 'app-avances-revision-lista',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './avances-revision-lista.html',
})
export class AvancesRevisionLista {
  private readonly avanceService = inject(AvanceService);
  private readonly authService = inject(AuthService);

  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;
  protected readonly estados = Object.values(AvanceEstadoEnum);

  private readonly rol = this.authService.usuario()?.rol ?? RolEnum.COORDINADOR;
  protected readonly esCoordinador = this.rol === RolEnum.COORDINADOR;
  protected readonly rutaBase = rutaInicioDeRol(this.rol);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly avances = signal<AvanceSemanalListItem[]>([]);
  protected readonly filtroEstado = signal<AvanceEstadoEnum | ''>(
    this.esCoordinador ? AvanceEstadoEnum.PENDIENTE_DE_REVISION : '',
  );

  protected readonly visibles = computed(() => {
    const estado = this.filtroEstado();
    return estado ? this.avances().filter((a) => a.estado === estado) : this.avances();
  });

  constructor() {
    const peticion = this.esCoordinador
      ? this.avanceService.listarCoordinador()
      : this.avanceService.listarDocente();
    peticion.subscribe({
      next: (datos) => {
        this.avances.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los avances.'));
        this.cargando.set(false);
      },
    });
  }
}
