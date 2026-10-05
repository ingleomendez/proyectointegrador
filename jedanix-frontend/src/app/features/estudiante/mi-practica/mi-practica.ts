import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of } from 'rxjs';

import { AvanceSemanalListItem } from '../../../core/models/avance.model';
import { EmpresaReceptoraOut } from '../../../core/models/empresa.model';
import {
  AvanceEstadoEnum,
  ObjetivoEstadoEnum,
  PostulacionEstadoEnum,
} from '../../../core/models/enums.model';
import { ObjetivoPracticaOut } from '../../../core/models/objetivo.model';
import { PostulacionOut } from '../../../core/models/postulacion.model';
import { AvanceService } from '../../../core/services/avance.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ObjetivoService } from '../../../core/services/objetivo.service';
import { PostulacionService } from '../../../core/services/postulacion.service';

type Vista = 'cargando' | 'error' | 'sin-practica' | 'en-tramite' | 'matriculado';

/**
 * CU-07 (Estudiante): consulta de solo lectura de "Mi Práctica". Se arma en
 * el frontend a partir de endpoints que ya existen (postulaciones, empresa,
 * avances y objetivos). Las horas acumuladas cuentan solo los avances
 * ACEPTADOS por el Coordinador (las horas "oficiales" de la práctica).
 *
 * Nota: el modelo de empresa no tiene teléfono ni dirección, que CU-07 paso 9
 * menciona; se omiten hasta que exista ese dato en `empresas_receptoras`.
 */
@Component({
  selector: 'app-mi-practica',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './mi-practica.html',
  styleUrl: './mi-practica.scss',
})
export class MiPractica {
  private readonly postulacionService = inject(PostulacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly avanceService = inject(AvanceService);
  private readonly objetivoService = inject(ObjetivoService);

  protected readonly ObjetivoEstadoEnum = ObjetivoEstadoEnum;

  protected readonly vista = signal<Vista>('cargando');
  protected readonly postulacion = signal<PostulacionOut | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly avances = signal<AvanceSemanalListItem[]>([]);
  protected readonly objetivo = signal<ObjetivoPracticaOut | null>(null);

  protected readonly horasAcumuladas = computed(() =>
    this.avances()
      .filter((a) => a.estado === AvanceEstadoEnum.ACEPTADO)
      .reduce((total, a) => total + Number(a.horas_totales), 0),
  );

  protected readonly horasRequeridas = computed(() => this.empresa()?.horas_requeridas ?? 0);

  protected readonly porcentaje = computed(() => {
    const requeridas = this.horasRequeridas();
    if (requeridas <= 0) return 0;
    return Math.min(100, Math.round((this.horasAcumuladas() / requeridas) * 100));
  });

  constructor() {
    this.postulacionService.listarMias().subscribe({
      next: (postulaciones) => this.resolverVista(postulaciones),
      error: () => this.vista.set('error'),
    });
  }

  protected etiquetaObjetivos(): string {
    switch (this.objetivo()?.estado) {
      case ObjetivoEstadoEnum.PENDIENTE_DE_APROBACION:
        return 'Pendiente de aprobación';
      case ObjetivoEstadoEnum.APROBADOS:
        return 'Aprobados';
      case ObjetivoEstadoEnum.RECHAZADOS:
        return 'Rechazados';
      default:
        return 'Sin plantear';
    }
  }

  private resolverVista(postulaciones: PostulacionOut[]): void {
    const matriculada = postulaciones.find((p) => p.estado === PostulacionEstadoEnum.APROBADA);
    if (matriculada) {
      this.cargarPractica(matriculada);
      return;
    }
    const pendiente = postulaciones.find(
      (p) => p.estado === PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
    );
    if (pendiente) {
      this.postulacion.set(pendiente);
      this.vista.set('en-tramite');
      return;
    }
    this.vista.set('sin-practica');
  }

  private cargarPractica(matriculada: PostulacionOut): void {
    this.postulacion.set(matriculada);
    forkJoin({
      empresa: this.empresaService.obtener(matriculada.empresa.id),
      avances: this.avanceService.listarMios().pipe(catchError(() => of([]))),
      // 404 = "aún no se han planteado objetivos" (estado SIN PLANTEAR).
      objetivo: this.objetivoService.obtenerMios().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ empresa, avances, objetivo }) => {
        this.empresa.set(empresa);
        this.avances.set(avances);
        this.objetivo.set(objetivo);
        this.vista.set('matriculado');
      },
      error: () => this.vista.set('error'),
    });
  }
}
