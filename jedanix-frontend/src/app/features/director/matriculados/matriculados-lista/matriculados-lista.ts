import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable, map } from 'rxjs';

import { PostulacionListItem } from '../../../../core/models/postulacion.model';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { porcentajeDeHoras } from '../horas';

interface FilaMatriculado {
  postulacion: PostulacionListItem;
  aceptadas: number;
  requeridas: number;
  porcentaje: number;
  pendienteCierre: boolean;
}

type Vista = 'todos' | 'cierre';

/**
 * CU-04 (Director), pasos 1-5: opción "Matriculados". Lista de estudiantes
 * matriculados con nombre, empresa receptora y porcentaje de horas completadas;
 * filtro por empresa (4-5) y orden por porcentaje (4.1.a). El subconjunto
 * "Pendiente de aprobación práctica" (100 % de horas) es la puerta de entrada
 * al cierre formal (CU-05, pasos 1-2); tras un rechazo del cierre el estudiante
 * sale de él hasta que se acepte un avance posterior (flujo 9.1.a).
 */
@Component({
  selector: 'app-matriculados-lista',
  imports: [
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './matriculados-lista.html',
  styleUrl: './matriculados-lista.scss',
})
export class MatriculadosLista {
  private readonly postulacionService = inject(PostulacionService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly filas = signal<FilaMatriculado[]>([]);

  protected readonly vista = signal<Vista>('todos');
  protected readonly filtroEmpresa = signal<number | ''>('');
  protected readonly ordenarPorPorcentaje = signal(false);

  protected readonly empresas = computed(() => {
    const mapa = new Map<number, string>();
    this.filas().forEach((f) => mapa.set(f.postulacion.empresa.id, f.postulacion.empresa.nombre));
    return [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  protected readonly totalCierre = computed(() => this.filas().filter((f) => f.pendienteCierre).length);

  protected readonly visibles = computed(() => {
    let lista = this.filas();
    const empresa = this.filtroEmpresa();
    if (empresa !== '') {
      lista = lista.filter((f) => f.postulacion.empresa.id === empresa);
    }
    if (this.vista() === 'cierre') {
      lista = lista.filter((f) => f.pendienteCierre);
    }
    return this.ordenarPorPorcentaje()
      ? [...lista].sort((a, b) => b.porcentaje - a.porcentaje)
      : lista;
  });

  constructor() {
    this.cargar().subscribe({
      next: (filas) => {
        this.filas.set(filas);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los estudiantes matriculados.'));
        this.cargando.set(false);
      },
    });
  }

  /** El listado del backend ya trae horas aceptadas, requeridas y si está pendiente de cierre. */
  private cargar(): Observable<FilaMatriculado[]> {
    return this.postulacionService.listarMatriculados().pipe(
      map((matriculados) =>
        matriculados.map((postulacion) => ({
          postulacion,
          aceptadas: postulacion.horas_acumuladas,
          requeridas: postulacion.horas_requeridas,
          porcentaje: porcentajeDeHoras(postulacion.horas_acumuladas, postulacion.horas_requeridas),
          pendienteCierre: postulacion.pendiente_cierre,
        })),
      ),
    );
  }
}
