import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, forkJoin, of } from 'rxjs';

import { AvanceEstadoEnum, PostulacionEstadoEnum } from '../../../core/models/enums.model';
import { AvanceSemanalListItem } from '../../../core/models/avance.model';
import { PostulacionListItem } from '../../../core/models/postulacion.model';
import { RolEnum, UsuarioEstadoEnum } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { AvanceService } from '../../../core/services/avance.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { EstadoEstudianteService } from '../../../core/services/estado-estudiante.service';
import { ObjetivoService } from '../../../core/services/objetivo.service';
import { PostulacionService } from '../../../core/services/postulacion.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Barras, BarraDato } from '../../../shared/graficas/barras';
import { Dona, SegmentoDona } from '../../../shared/graficas/dona';

interface Dato {
  icono: string;
  valor: string | number;
  etiqueta: string;
  ruta?: string;
  /** Hay algo por hacer: se resalta. */
  resalta?: boolean;
}

interface GraficoDona {
  titulo: string;
  segmentos: SegmentoDona[];
  centroValor: string | number;
  centroTexto: string;
}

interface GraficoBarras {
  titulo: string;
  nota?: string;
  datos: BarraDato[];
}

// Colores de estado: verde = aceptado, ámbar = en revisión, rojo = observado.
const VERDE = '#2e9e6b';
const AMBAR = '#e8a317';
const ROJO = '#d9534f';
const GRIS = '#8aa7ae';
const CYAN = '#00acc1';
const INDIGO = '#5c6bc0';
const VIOLETA = '#8e6bbf';

const NOMBRE_ROL: Record<RolEnum, string> = {
  [RolEnum.ESTUDIANTE]: 'Estudiantes',
  [RolEnum.DIRECTOR]: 'Directores',
  [RolEnum.COORDINADOR]: 'Coordinadores',
  [RolEnum.DOCENTE_ASESOR]: 'Docentes asesores',
};

const num = (v: number | string | null | undefined): number => Number(v ?? 0) || 0;
const redondear = (v: number): number => Math.round(v * 10) / 10;

/** Resumen con cifras y gráficas del panel de inicio. Qué se muestra depende
 * del rol; todo sale de endpoints que ya existen (no hay consultas nuevas en el
 * servidor). Si una consulta falla, esa parte queda vacía en lugar de romper el
 * panel. */
@Component({
  selector: 'jx-resumen-inicio',
  imports: [RouterLink, MatIconModule, Dona, Barras],
  templateUrl: './resumen-inicio.html',
  styleUrl: './resumen-inicio.scss',
})
export class ResumenInicio {
  private readonly auth = inject(AuthService);
  private readonly postulaciones = inject(PostulacionService);
  private readonly avances = inject(AvanceService);
  private readonly usuarios = inject(UsuarioService);
  private readonly empresas = inject(EmpresaService);
  private readonly objetivos = inject(ObjetivoService);
  private readonly estadoEstudiante = inject(EstadoEstudianteService);

  protected readonly cargando = signal(true);
  protected readonly datos = signal<Dato[]>([]);
  protected readonly donas = signal<GraficoDona[]>([]);
  protected readonly barras = signal<GraficoBarras[]>([]);

  private postulacionCargada: number | null = null;

  constructor() {
    const rol = this.auth.usuario()?.rol;
    switch (rol) {
      case RolEnum.DIRECTOR:
        this.cargarDirector();
        break;
      case RolEnum.COORDINADOR:
        this.cargarRevisor(RolEnum.COORDINADOR);
        break;
      case RolEnum.DOCENTE_ASESOR:
        this.cargarRevisor(RolEnum.DOCENTE_ASESOR);
        break;
      case RolEnum.ESTUDIANTE:
        // La postulación llega cuando el armazón termina de consultarla.
        effect(() => {
          const ultima = this.estadoEstudiante.ultimaPostulacion();
          const cargado = this.estadoEstudiante.cargado();
          if (!cargado) {
            return;
          }
          const vigente =
            ultima &&
            (ultima.estado === PostulacionEstadoEnum.APROBADA ||
              ultima.estado === PostulacionEstadoEnum.FINALIZADA)
              ? ultima
              : null;
          if (!vigente) {
            this.cargando.set(false);
            return;
          }
          if (this.postulacionCargada !== vigente.id) {
            this.postulacionCargada = vigente.id;
            this.cargarEstudiante(vigente.empresa.id);
          }
        });
        break;
      default:
        this.cargando.set(false);
    }
  }

  // ---------------- Director ----------------

  private cargarDirector(): void {
    forkJoin({
      pendientes: this.postulaciones.listarPendientes().pipe(catchError(() => of([]))),
      matriculados: this.postulaciones.listarMatriculados().pipe(catchError(() => of([]))),
      usuarios: this.usuarios.listar().pipe(catchError(() => of([]))),
      empresas: this.empresas.listar().pipe(catchError(() => of([]))),
    }).subscribe(({ pendientes, matriculados, usuarios, empresas }) => {
      const porCerrar = matriculados.filter((m) => m.pendiente_cierre).length;
      this.datos.set([
        {
          icono: 'assignment_late',
          valor: pendientes.length,
          etiqueta: 'Solicitudes por revisar',
          ruta: '/director/solicitudes',
          resalta: pendientes.length > 0,
        },
        {
          icono: 'school',
          valor: matriculados.length,
          etiqueta: 'Estudiantes matriculados',
          ruta: '/director/matriculados',
        },
        {
          icono: 'workspace_premium',
          valor: porCerrar,
          etiqueta: 'Cierres por aprobar',
          ruta: '/director/matriculados',
          resalta: porCerrar > 0,
        },
        {
          icono: 'business',
          valor: empresas.filter((e) => e.estado === 'ACTIVA').length,
          etiqueta: 'Empresas activas',
          ruta: '/director/empresas',
        },
      ]);

      const activos = usuarios.filter((u) => u.estado === UsuarioEstadoEnum.ACTIVO);
      const cuenta = (rol: RolEnum) => activos.filter((u) => u.rol === rol).length;
      this.donas.set([
        {
          titulo: 'Usuarios activos por rol',
          centroValor: activos.length,
          centroTexto: 'usuarios',
          segmentos: [
            { etiqueta: NOMBRE_ROL[RolEnum.ESTUDIANTE], valor: cuenta(RolEnum.ESTUDIANTE), color: CYAN },
            { etiqueta: NOMBRE_ROL[RolEnum.COORDINADOR], valor: cuenta(RolEnum.COORDINADOR), color: INDIGO },
            { etiqueta: NOMBRE_ROL[RolEnum.DOCENTE_ASESOR], valor: cuenta(RolEnum.DOCENTE_ASESOR), color: AMBAR },
            { etiqueta: NOMBRE_ROL[RolEnum.DIRECTOR], valor: cuenta(RolEnum.DIRECTOR), color: VIOLETA },
          ],
        },
      ]);
      this.barras.set(this.barraProgreso(matriculados));
      this.cargando.set(false);
    });
  }

  // ---------------- Coordinador y Docente Asesor ----------------

  private cargarRevisor(rol: RolEnum.COORDINADOR | RolEnum.DOCENTE_ASESOR): void {
    const esCoordinador = rol === RolEnum.COORDINADOR;
    const base = esCoordinador ? '/coordinador' : '/docente-asesor';
    forkJoin({
      avances: (esCoordinador ? this.avances.listarCoordinador() : this.avances.listarDocente()).pipe(
        catchError(() => of([] as AvanceSemanalListItem[])),
      ),
      matriculados: this.postulaciones.listarMatriculados().pipe(catchError(() => of([]))),
      objetivos: esCoordinador
        ? of([])
        : this.objetivos.listarPendientes().pipe(catchError(() => of([]))),
    }).subscribe(({ avances, matriculados, objetivos }) => {
      const porEstado = (e: AvanceEstadoEnum) => avances.filter((a) => a.estado === e).length;
      const pendientes = porEstado(AvanceEstadoEnum.PENDIENTE_DE_REVISION);
      const aceptados = porEstado(AvanceEstadoEnum.ACEPTADO);
      const observados = porEstado(AvanceEstadoEnum.OBSERVADO);

      const tiles: Dato[] = [];
      if (esCoordinador) {
        tiles.push({
          icono: 'pending_actions',
          valor: pendientes,
          etiqueta: 'Avances por calificar',
          ruta: `${base}/estudiantes`,
          resalta: pendientes > 0,
        });
      } else {
        tiles.push({
          icono: 'flag',
          valor: objetivos.length,
          etiqueta: 'Objetivos por aprobar',
          ruta: `${base}/estudiantes`,
          resalta: objetivos.length > 0,
        });
      }
      tiles.push(
        { icono: 'school', valor: matriculados.length, etiqueta: 'Estudiantes a tu cargo', ruta: `${base}/estudiantes` },
        { icono: 'fact_check', valor: avances.length, etiqueta: 'Avances recibidos' },
      );
      if (esCoordinador) {
        tiles.push({ icono: 'task_alt', valor: aceptados, etiqueta: 'Avances aceptados' });
      } else {
        tiles.push({ icono: 'hourglass_top', valor: pendientes, etiqueta: 'Avances en revisión' });
      }
      this.datos.set(tiles);

      this.donas.set([
        {
          titulo: 'Avances por estado',
          centroValor: avances.length,
          centroTexto: 'avances',
          segmentos: [
            { etiqueta: 'Aceptados', valor: aceptados, color: VERDE },
            { etiqueta: 'En revisión', valor: pendientes, color: AMBAR },
            { etiqueta: 'Observados', valor: observados, color: ROJO },
          ],
        },
      ]);
      this.barras.set(this.barraProgreso(matriculados));
      this.cargando.set(false);
    });
  }

  /** Horas aceptadas / horas requeridas de cada estudiante matriculado (los 8 con más avance). */
  private barraProgreso(matriculados: PostulacionListItem[]): GraficoBarras[] {
    const lista = matriculados.filter((m) => num(m.horas_requeridas) > 0);
    if (lista.length === 0) {
      return [];
    }
    const ordenados = [...lista].sort(
      (a, b) =>
        num(b.horas_acumuladas) / num(b.horas_requeridas) -
        num(a.horas_acumuladas) / num(a.horas_requeridas),
    );
    return [
      {
        titulo: 'Avance de horas de los estudiantes',
        nota: ordenados.length > 8 ? `Se muestran 8 de ${ordenados.length}.` : undefined,
        datos: ordenados.slice(0, 8).map((m) => ({
          etiqueta: m.estudiante.nombre_completo,
          valor: num(m.horas_acumuladas),
          maximo: num(m.horas_requeridas),
          texto: `${redondear(num(m.horas_acumuladas))} / ${redondear(num(m.horas_requeridas))} h`,
          color: num(m.horas_acumuladas) >= num(m.horas_requeridas) ? VERDE : CYAN,
        })),
      },
    ];
  }

  // ---------------- Estudiante ----------------

  private cargarEstudiante(empresaId: number): void {
    this.cargando.set(true);
    forkJoin({
      avances: this.avances.listarMios().pipe(catchError(() => of([] as AvanceSemanalListItem[]))),
      empresa: this.empresas.obtener(empresaId).pipe(catchError(() => of(null))),
    }).subscribe(({ avances, empresa }) => {
      const requeridas = num(empresa?.horas_requeridas);
      const horas = (e: AvanceEstadoEnum) =>
        avances.filter((a) => a.estado === e).reduce((suma, a) => suma + num(a.horas_totales), 0);
      const aceptadas = horas(AvanceEstadoEnum.ACEPTADO);
      const enRevision = horas(AvanceEstadoEnum.PENDIENTE_DE_REVISION);
      const observadas = avances.filter((a) => a.estado === AvanceEstadoEnum.OBSERVADO);

      this.datos.set([
        {
          icono: 'schedule',
          valor: requeridas > 0 ? `${redondear(aceptadas)} / ${redondear(requeridas)} h` : `${redondear(aceptadas)} h`,
          etiqueta: 'Horas aceptadas',
          ruta: '/estudiante/mi-practica',
        },
        { icono: 'fact_check', valor: avances.length, etiqueta: 'Avances registrados', ruta: '/estudiante/seguimiento' },
        {
          icono: 'task_alt',
          valor: avances.filter((a) => a.estado === AvanceEstadoEnum.ACEPTADO).length,
          etiqueta: 'Avances aceptados',
        },
        {
          icono: 'edit_note',
          valor: observadas.length,
          etiqueta: 'Por corregir',
          ruta: '/estudiante/seguimiento',
          resalta: observadas.length > 0,
        },
      ]);

      if (requeridas > 0) {
        const faltan = Math.max(0, requeridas - aceptadas - enRevision);
        this.donas.set([
          {
            titulo: 'Mis horas de práctica',
            centroValor: `${Math.min(100, Math.round((aceptadas / requeridas) * 100))}%`,
            centroTexto: 'completado',
            segmentos: [
              { etiqueta: 'Horas aceptadas', valor: redondear(aceptadas), color: VERDE },
              { etiqueta: 'En revisión', valor: redondear(enRevision), color: AMBAR },
              { etiqueta: 'Por completar', valor: redondear(faltan), color: GRIS },
            ],
          },
        ]);
      } else {
        this.donas.set([]);
      }

      const recientes = [...avances]
        .sort((a, b) => a.semana_calendario.localeCompare(b.semana_calendario))
        .slice(-8);
      const maximo = Math.max(1, ...recientes.map((a) => num(a.horas_totales)));
      this.barras.set(
        recientes.length === 0
          ? []
          : [
              {
                titulo: 'Horas por semana',
                nota: 'Verde: aceptado · Ámbar: en revisión · Rojo: por corregir',
                datos: recientes.map((a) => ({
                  etiqueta: etiquetaSemana(a.semana_calendario),
                  valor: num(a.horas_totales),
                  maximo,
                  texto: `${redondear(num(a.horas_totales))} h`,
                  color:
                    a.estado === AvanceEstadoEnum.ACEPTADO
                      ? VERDE
                      : a.estado === AvanceEstadoEnum.OBSERVADO
                        ? ROJO
                        : AMBAR,
                })),
              },
            ],
      );
      this.cargando.set(false);
    });
  }
}

/** "2026-10-05" -> "Semana del 5 oct". */
function etiquetaSemana(lunes: string): string {
  const [anio, mes, dia] = lunes.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return `Semana del ${fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')}`;
}
