import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, forkJoin, of, switchMap } from 'rxjs';

import { AvanceSemanalListItem } from '../../../core/models/avance.model';
import { AvanceEstadoEnum } from '../../../core/models/enums.model';
import { ObjetivoPracticaOut } from '../../../core/models/objetivo.model';
import { PostulacionListItem } from '../../../core/models/postulacion.model';
import { RolEnum } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { AvanceService } from '../../../core/services/avance.service';
import { ObjetivoService } from '../../../core/services/objetivo.service';
import { PostulacionService } from '../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../core/utils/errores';
import { rutaInicioDeRol } from '../../../core/utils/menu-rol';

interface FilaEstudiante {
  postulacion: PostulacionListItem;
  /** Coordinador: avances PENDIENTE DE REVISIÓN. Docente: avances sin observación. */
  pendientes: number;
  /** Solo Docente Asesor: objetivos en PENDIENTE DE APROBACIÓN (CU-11, paso 13). */
  objetivosPendientes: boolean;
}

/**
 * Opción "Estudiantes" del menú de Coordinador (CU-09, pasos 1-3) y de Docente
 * Asesor (CU-10, pasos 1-3 y CU-11, pasos 11-13): estudiantes matriculados en
 * las empresas donde el usuario es el responsable asignado, con nombre,
 * empresa receptora y cantidad de avances pendientes (de calificar o de
 * observar). Para el Docente se indica además quiénes tienen objetivos por
 * aprobar. El backend filtra por el rol del token.
 */
@Component({
  selector: 'app-estudiantes-lista',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './estudiantes-lista.html',
})
export class EstudiantesLista {
  private readonly postulacionService = inject(PostulacionService);
  private readonly avanceService = inject(AvanceService);
  private readonly objetivoService = inject(ObjetivoService);
  private readonly authService = inject(AuthService);

  private readonly rol = this.authService.usuario()?.rol ?? RolEnum.COORDINADOR;
  protected readonly esCoordinador = this.rol === RolEnum.COORDINADOR;
  protected readonly rutaBase = rutaInicioDeRol(this.rol);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly filas = signal<FilaEstudiante[]>([]);

  protected readonly totalPendientes = computed(() =>
    this.filas().reduce((suma, fila) => suma + fila.pendientes, 0),
  );

  constructor() {
    forkJoin({
      estudiantes: this.postulacionService.listarMatriculados(),
      pendientes: this.contarPendientes(),
      objetivos: this.esCoordinador
        ? of<ObjetivoPracticaOut[]>([])
        : this.objetivoService.listarPendientes(),
    }).subscribe({
      next: ({ estudiantes, pendientes, objetivos }) => {
        this.filas.set(
          estudiantes.map((postulacion) => ({
            postulacion,
            pendientes: pendientes.get(postulacion.id) ?? 0,
            objetivosPendientes: objetivos.some((o) => o.postulacion_id === postulacion.id),
          })),
        );
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los estudiantes.'));
        this.cargando.set(false);
      },
    });
  }

  /** Cantidad de avances pendientes por postulación. */
  private contarPendientes(): Observable<Map<number, number>> {
    const conteo = (ids: number[]): Map<number, number> => {
      const mapa = new Map<number, number>();
      ids.forEach((id) => mapa.set(id, (mapa.get(id) ?? 0) + 1));
      return mapa;
    };

    if (this.esCoordinador) {
      return this.avanceService
        .listarCoordinador()
        .pipe(
          switchMap((avances: AvanceSemanalListItem[]) =>
            of(
              conteo(
                avances
                  .filter((a) => a.estado === AvanceEstadoEnum.PENDIENTE_DE_REVISION)
                  .map((a) => a.postulacion_id),
              ),
            ),
          ),
        );
    }
    // El listado ya indica si el Docente Asesor observó cada avance (CU-10, paso 3).
    return this.avanceService.listarDocente().pipe(
      switchMap((avances) =>
        of(conteo(avances.filter((a) => !a.tiene_observacion_docente).map((a) => a.postulacion_id))),
      ),
    );
  }
}
