import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, switchMap } from 'rxjs';

import { EmpresaService } from '../../../../core/services/empresa.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';
import { PostulacionEstadoEnum } from '../../../../core/models/enums.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { claseChipPostulacion, etiquetaEstadoPostulacion } from '../../../../core/utils/estados';
import { mensajeDeError } from '../../../../core/utils/errores';

type Vista = 'documentos' | 'bitacora' | 'estado';

interface DocumentoForm {
  documentoId: number;
  nombre: string;
  /** Ruta devuelta por el backend al subir el PDF. */
  ruta: string;
  nombreArchivo: string;
  subiendo: boolean;
  error: string | null;
}

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

/**
 * CU-06, pasos 10-27: proceso de postulación dividido en tres vistas --
 * "Documentos", "Bitácora" y "Estado de la solicitud".
 *
 *  - Documentos (11-16): un campo de carga por documento requerido; solo PDF
 *    (13.1.a) y hasta 10 MB (13.1.b). "Continuar" pasa a la bitácora.
 *  - Bitácora (17-20): una caja de respuesta por pregunta. "Atrás" vuelve a
 *    Documentos sin perder lo cargado (16.1.a). "Enviar solicitud" valida que
 *    estén todos los documentos (21.1.a) y todas las respuestas (22.1.a).
 *  - Estado de la solicitud (25-26): muestra el estado y la fecha de envío.
 *
 * "Guardar y salir" (flujo 9.1.a) guarda un borrador y lleva al Estado de la
 * solicitud; el estudiante puede retomarlo (se precarga lo guardado).
 *
 * Una sola clase atiende dos rutas: `solicitud/postular/:empresaId` (solicitud
 * nueva) y `solicitud/:id` (una solicitud ya registrada: borrador, en trámite,
 * aprobada, rechazada o finalizada). Todo el estado del formulario vive en
 * señales (la app es zoneless).
 */
@Component({
  selector: 'app-postulacion-nueva',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './postulacion-nueva.html',
  styleUrl: './postulacion-nueva.scss',
})
export class PostulacionNueva {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);
  private readonly postulacionService = inject(PostulacionService);
  private readonly archivoService = inject(ArchivoService);

  protected readonly PostulacionEstadoEnum = PostulacionEstadoEnum;
  protected readonly etiquetaEstado = etiquetaEstadoPostulacion;
  protected readonly claseChip = claseChipPostulacion;

  private readonly empresaIdParam = Number(this.route.snapshot.paramMap.get('empresaId')) || null;
  private readonly postulacionIdParam = Number(this.route.snapshot.paramMap.get('id')) || null;

  protected readonly vista = signal<Vista>('documentos');
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  /** `null` mientras la solicitud aún no se ha guardado ni enviado. */
  protected readonly postulacion = signal<PostulacionOut | null>(null);

  protected readonly documentos = signal<DocumentoForm[]>([]);
  protected readonly respuestas = signal<string[]>([]);

  protected readonly procesando = signal(false);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly mostrarFaltantes = signal(false);

  /** ¿Se puede modificar? Solo una solicitud nueva o un BORRADOR. */
  protected readonly editable = computed(() => {
    const actual = this.postulacion();
    return actual === null || actual.estado === PostulacionEstadoEnum.BORRADOR;
  });

  protected readonly documentosCargados = computed(
    () => this.documentos().filter((d) => d.ruta).length,
  );
  protected readonly respuestasDadas = computed(
    () => this.respuestas().filter((r) => r.trim().length > 0).length,
  );
  protected readonly faltanDocumentos = computed(
    () => this.documentos().length - this.documentosCargados(),
  );
  protected readonly faltanRespuestas = computed(
    () => this.respuestas().length - this.respuestasDadas(),
  );

  constructor() {
    if (this.postulacionIdParam !== null) {
      this.cargarExistente(this.postulacionIdParam);
    } else if (this.empresaIdParam !== null) {
      this.cargarNueva(this.empresaIdParam);
    } else {
      this.errorCarga.set('No se indicó la empresa a la que quieres postularte.');
      this.cargando.set(false);
    }
  }

  // ---------- Carga inicial ----------

  private cargarNueva(empresaId: number): void {
    forkJoin({
      postulaciones: this.postulacionService.listarMias(),
      empresa: this.empresaService.obtener(empresaId),
    }).subscribe({
      next: ({ postulaciones, empresa }) => {
        // Excepción 2.1.a: ya matriculado => a "Mi Práctica" con un mensaje explicativo.
        if (postulaciones.some((p) => p.estado === PostulacionEstadoEnum.APROBADA)) {
          this.router.navigate(['/estudiante/mi-practica'], {
            queryParams: { aviso: 'matriculado' },
            replaceUrl: true,
          });
          return;
        }
        // Solo una solicitud en trámite a la vez: se muestra la que ya tiene.
        const enTramite = postulaciones.find(
          (p) =>
            p.estado === PostulacionEstadoEnum.BORRADOR ||
            p.estado === PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
        );
        if (enTramite) {
          this.router.navigate(['/estudiante/solicitud', enTramite.id], { replaceUrl: true });
          return;
        }
        this.empresa.set(empresa);
        this.construirFormulario(empresa, null);
        this.vista.set('documentos');
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(
          error?.status === 404
            ? 'Esta empresa no existe o ya no está disponible.'
            : mensajeDeError(error, 'No se pudo cargar la información de la empresa.'),
        );
        this.cargando.set(false);
      },
    });
  }

  private cargarExistente(postulacionId: number): void {
    this.postulacionService
      .obtener(postulacionId)
      .pipe(
        switchMap((postulacion) => {
          this.postulacion.set(postulacion);
          return this.empresaService.obtener(postulacion.empresa.id);
        }),
      )
      .subscribe({
        next: (empresa) => {
          this.empresa.set(empresa);
          this.construirFormulario(empresa, this.postulacion());
          // Tras "Guardar y salir" (o al consultar) se aterriza en el Estado de la solicitud.
          this.vista.set('estado');
          this.cargando.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorCarga.set(
            error.status === 403 || error.status === 404
              ? 'No tienes acceso a esta solicitud o no existe.'
              : mensajeDeError(error, 'No se pudo cargar la solicitud.'),
          );
          this.cargando.set(false);
        },
      });
  }

  private construirFormulario(empresa: EmpresaReceptoraOut, existente: PostulacionOut | null): void {
    this.documentos.set(
      empresa.documentos_requeridos.map((requerido) => {
        const guardado = existente?.documentos_postulacion.find(
          (d) => d.documento_requerido_id === requerido.id,
        );
        return {
          documentoId: requerido.id,
          nombre: requerido.nombre_documento,
          ruta: guardado?.archivo ?? '',
          nombreArchivo: guardado ? this.nombreDeRuta(guardado.archivo) : '',
          subiendo: false,
          error: null,
        };
      }),
    );
    this.respuestas.set(
      empresa.preguntas_bitacora.map(
        (pregunta) =>
          existente?.respuestas_bitacora.find((r) => r.pregunta_id === pregunta.id)
            ?.respuesta_texto ?? '',
      ),
    );
  }

  /** Quita el prefijo único que el backend antepone al nombre del archivo. */
  private nombreDeRuta(ruta: string): string {
    const nombre = ruta.split('/').pop() ?? ruta;
    return nombre.replace(/^[0-9a-f]{32}_/, '');
  }

  protected urlArchivo(ruta: string): string {
    return this.archivoService.urlPublica(ruta);
  }

  protected nombreArchivo(ruta: string): string {
    return this.nombreDeRuta(ruta);
  }

  // ---------- Vista "Documentos" ----------

  onArchivoSeleccionado(indice: number, input: HTMLInputElement): void {
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) {
      return;
    }

    // 13.1.a: solo PDF.
    const esPdf = archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
    if (!esPdf) {
      this.actualizarDocumento(indice, { error: 'Solo se aceptan archivos en formato PDF.' });
      return;
    }
    // 13.1.b: tamaño máximo.
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      this.actualizarDocumento(indice, {
        error: 'El archivo supera el tamaño máximo permitido (10 MB).',
      });
      return;
    }

    this.actualizarDocumento(indice, { subiendo: true, error: null });
    this.archivoService.subir(archivo).subscribe({
      next: ({ archivo: ruta }) =>
        this.actualizarDocumento(indice, {
          subiendo: false,
          ruta,
          nombreArchivo: archivo.name,
          error: null,
        }),
      error: (error) =>
        this.actualizarDocumento(indice, {
          subiendo: false,
          error: mensajeDeError(error, 'No se pudo cargar el archivo. Intenta de nuevo.'),
        }),
    });
  }

  private actualizarDocumento(indice: number, cambios: Partial<DocumentoForm>): void {
    this.documentos.update((lista) =>
      lista.map((doc, i) => (i === indice ? { ...doc, ...cambios } : doc)),
    );
  }

  continuar(): void {
    this.errorAccion.set(null);
    this.vista.set('bitacora');
  }

  // ---------- Vista "Bitácora" ----------

  actualizarRespuesta(indice: number, texto: string): void {
    this.respuestas.update((lista) => lista.map((r, i) => (i === indice ? texto : r)));
  }

  atras(): void {
    this.errorAccion.set(null);
    this.vista.set('documentos');
  }

  // ---------- Estado de la solicitud ----------

  /** "Continuar solicitud": retoma el borrador desde la vista Documentos (paso 11). */
  retomar(): void {
    this.errorAccion.set(null);
    this.mostrarFaltantes.set(false);
    this.vista.set('documentos');
  }

  // ---------- Guardar y enviar ----------

  private cuerpo(enviar: boolean) {
    const empresa = this.empresa();
    const preguntas = empresa?.preguntas_bitacora ?? [];
    const respuestas = this.respuestas();
    return {
      enviar,
      respuestas_bitacora: preguntas
        .map((pregunta, i) => ({
          pregunta_id: pregunta.id,
          respuesta_texto: (respuestas[i] ?? '').trim(),
        }))
        .filter((r) => r.respuesta_texto.length > 0),
      documentos_postulacion: this.documentos()
        .filter((d) => d.ruta)
        .map((d) => ({ documento_requerido_id: d.documentoId, archivo: d.ruta })),
    };
  }

  /** Flujo alterno 9.1.a: conserva lo diligenciado como BORRADOR y va al Estado de la solicitud. */
  guardarYSalir(): void {
    this.registrar(false);
  }

  /** Pasos 20-27: envío formal. */
  enviarSolicitud(): void {
    this.errorAccion.set(null);
    // 21.1.a: documentos incompletos -> se resaltan y no se envía.
    if (this.faltanDocumentos() > 0) {
      this.mostrarFaltantes.set(true);
      this.vista.set('documentos');
      this.errorAccion.set(
        `Faltan ${this.faltanDocumentos()} documento(s) requerido(s) por cargar. Cárgalos para poder enviar la solicitud.`,
      );
      return;
    }
    // 22.1.a: bitácora incompleta -> se resaltan las preguntas faltantes.
    if (this.faltanRespuestas() > 0) {
      this.mostrarFaltantes.set(true);
      this.errorAccion.set(
        `Faltan ${this.faltanRespuestas()} pregunta(s) de la bitácora por responder.`,
      );
      return;
    }
    this.registrar(true);
  }

  private registrar(enviar: boolean): void {
    this.procesando.set(true);
    this.errorAccion.set(null);
    const existente = this.postulacion();
    const cuerpo = this.cuerpo(enviar);

    if (existente === null) {
      this.postulacionService
        .crear({ empresa_id: this.empresaIdParam as number, ...cuerpo })
        .subscribe({
          // La solicitud ya existe: se abre su vista de Estado (paso 25).
          next: (creada) =>
            this.router.navigate(['/estudiante/solicitud', creada.id], { replaceUrl: true }),
          error: (error) => this.fallo(error),
        });
      return;
    }

    this.postulacionService.actualizarBorrador(existente.id, cuerpo).subscribe({
      next: (actualizada) => {
        this.postulacion.set(actualizada);
        this.construirFormulario(this.empresa() as EmpresaReceptoraOut, actualizada);
        this.mostrarFaltantes.set(false);
        this.procesando.set(false);
        this.vista.set('estado');
      },
      error: (error) => this.fallo(error),
    });
  }

  private fallo(error: unknown): void {
    this.procesando.set(false);
    if (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 405)) {
      this.errorAccion.set(
        'Modificar un borrador ya guardado requiere una actualización del servidor que aún no está disponible.',
      );
      return;
    }
    // 23.1.a / pérdida de conexión: el formulario conserva lo diligenciado para reintentar.
    this.errorAccion.set(mensajeDeError(error, 'No se pudo registrar la solicitud. Intenta de nuevo.'));
  }

  // ---------- Presentación ----------

  protected documentoFaltante(doc: DocumentoForm): boolean {
    return this.mostrarFaltantes() && !doc.ruta;
  }

  protected respuestaFaltante(indice: number): boolean {
    return this.mostrarFaltantes() && !(this.respuestas()[indice] ?? '').trim();
  }

  protected respuestaDe(preguntaId: number): string {
    return (
      this.postulacion()?.respuestas_bitacora.find((r) => r.pregunta_id === preguntaId)
        ?.respuesta_texto ?? ''
    );
  }
}
