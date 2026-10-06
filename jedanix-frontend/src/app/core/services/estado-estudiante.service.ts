import { Injectable, computed, inject, signal } from '@angular/core';

import { PostulacionEstadoEnum } from '../models/enums.model';
import { PostulacionOut } from '../models/postulacion.model';
import { ContextoEstudiante } from '../utils/menu-rol';
import { PostulacionService } from './postulacion.service';

/** Estado de práctica del Estudiante autenticado, compartido por el menú
 * lateral y los paneles. Decide qué opciones se muestran u ocultan (CU-06
 * 2.1.a, CU-08 2.1.b, CU-11 1.1.a). El shell lo refresca en cada navegación,
 * así el menú cambia solo cuando el Director aprueba o cierra la práctica. */
@Injectable({ providedIn: 'root' })
export class EstadoEstudianteService {
  private readonly postulacionService = inject(PostulacionService);

  private readonly postulaciones = signal<PostulacionOut[]>([]);
  readonly cargado = signal(false);

  /** Postulación vigente: BORRADOR, PENDIENTE_DE_APROBACION o APROBADA (a lo sumo una). */
  readonly postulacionActiva = computed<PostulacionOut | null>(
    () =>
      this.postulaciones().find((p) =>
        [
          PostulacionEstadoEnum.BORRADOR,
          PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
          PostulacionEstadoEnum.APROBADA,
        ].includes(p.estado),
      ) ?? null,
  );

  /** Última postulación del estudiante (la más reciente, sea cual sea su estado). */
  readonly ultimaPostulacion = computed<PostulacionOut | null>(() => this.postulaciones()[0] ?? null);

  readonly contexto = computed<ContextoEstudiante>(() => {
    const lista = this.postulaciones();
    return {
      matriculado: lista.some((p) => p.estado === PostulacionEstadoEnum.APROBADA),
      finalizada: lista.some((p) => p.estado === PostulacionEstadoEnum.FINALIZADA),
      enTramite: lista.some(
        (p) =>
          p.estado === PostulacionEstadoEnum.BORRADOR ||
          p.estado === PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
      ),
    };
  });

  refrescar(): void {
    this.postulacionService.listarMias().subscribe({
      next: (datos) => {
        this.postulaciones.set(datos);
        this.cargado.set(true);
      },
      // Si falla (sin conexión, sesión vencida) se conserva el último estado conocido.
      error: () => this.cargado.set(true),
    });
  }

  limpiar(): void {
    this.postulaciones.set([]);
    this.cargado.set(false);
  }
}
