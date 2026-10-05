import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AvanceSemanalCreate, AvanceSemanalOut } from '../../../../core/models/avance.model';
import { TipoArchivoSoporteEnum } from '../../../../core/models/enums.model';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { AvanceService } from '../../../../core/services/avance.service';
import { lunesDeSemana } from '../../../../core/utils/semana';

interface SoporteCargado {
  archivo: string;
  tipo: TipoArchivoSoporteEnum;
  nombre: string;
}

type DiaForm = FormGroup<{
  descripcion_dia: FormControl<string>;
  horas_dia: FormControl<number | null>;
}>;

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

/**
 * CU-08 (Estudiante), pasos 7-35 y flujo 6.1.c: formulario de avance
 * semanal. La ruta `avances/nuevo` registra el avance de la semana en curso;
 * `avances/:id/corregir` precarga un avance OBSERVADO y lo reenvía (el
 * backend reutiliza la misma fila y lo devuelve a PENDIENTE DE REVISIÓN).
 */
@Component({
  selector: 'app-avance-nuevo',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './avance-nuevo.html',
  styleUrl: './avance-nuevo.scss',
})
export class AvanceNuevo {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly avanceService = inject(AvanceService);
  private readonly archivoService = inject(ArchivoService);

  protected readonly opcionesDias = [1, 2, 3, 4, 5, 6];
  protected readonly avanceId = Number(this.route.snapshot.paramMap.get('id')) || null;
  protected readonly esCorreccion = this.avanceId !== null;

  protected readonly semana = signal(lunesDeSemana());
  protected readonly cargandoInicial = signal(this.esCorreccion);
  protected readonly avanceOriginal = signal<AvanceSemanalOut | null>(null);
  protected readonly soportes = signal<SoporteCargado[]>([]);
  protected readonly subiendo = signal(false);
  protected readonly errorSoporte = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly intentoEnvio = signal(false);

  protected readonly form = new FormGroup({
    actividades_a_desarrollar: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    numero_dias: new FormControl(1, { nonNullable: true }),
    dias: new FormArray<DiaForm>([]),
    horas_totales: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    beneficio_economico: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    actividades_generales: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    ejecucion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    observaciones_estudiante: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.ajustarDias(1);
    if (this.avanceId !== null) {
      this.avanceService.obtener(this.avanceId).subscribe({
        next: (avance) => this.precargar(avance),
        error: () => {
          this.errorEnvio.set('No se pudo cargar el avance a corregir.');
          this.cargandoInicial.set(false);
        },
      });
    }
  }

  protected get dias(): FormArray<DiaForm> {
    return this.form.controls.dias;
  }

  /** Paso 14: suma automática de las horas diarias. */
  protected sumaHoras(): number {
    return this.dias.controls.reduce((total, d) => total + Number(d.controls.horas_dia.value ?? 0), 0);
  }

  /** Excepción 28.1.a: "Horas totales" no coincide con la suma diaria. */
  protected horasInconsistentes(): boolean {
    const total = this.form.controls.horas_totales.value;
    return total !== null && Math.abs(Number(total) - this.sumaHoras()) > 0.001;
  }

  protected usarSuma(): void {
    this.form.controls.horas_totales.setValue(this.sumaHoras());
  }

  /** Flujo 9.1.a: cambiar la cantidad de días conserva los bloques válidos. */
  protected onCambioDias(cantidad: number): void {
    this.ajustarDias(Number(cantidad));
  }

  protected onArchivoSeleccionado(archivos: FileList | null, input: HTMLInputElement): void {
    const archivo = archivos?.[0];
    input.value = '';
    if (!archivo) return;
    this.errorSoporte.set(null);

    const nombre = archivo.name.toLowerCase();
    const tipo = nombre.endsWith('.pdf')
      ? TipoArchivoSoporteEnum.PDF
      : nombre.endsWith('.png')
        ? TipoArchivoSoporteEnum.PNG
        : nombre.endsWith('.jpg') || nombre.endsWith('.jpeg')
          ? TipoArchivoSoporteEnum.JPG
          : null;
    if (tipo === null) {
      this.errorSoporte.set('Formato no permitido. Solo se aceptan archivos PDF, PNG o JPG.'); // 19.1.a
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      this.errorSoporte.set('El archivo supera el tamaño máximo permitido (10 MB).'); // 20.1.a
      return;
    }

    this.subiendo.set(true);
    this.archivoService.subir(archivo, true).subscribe({
      next: ({ archivo: ruta }) => {
        this.soportes.update((lista) => [...lista, { archivo: ruta, tipo, nombre: archivo.name }]);
        this.subiendo.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorSoporte.set(error.error?.detail ?? 'No se pudo cargar el archivo. Intenta de nuevo.');
        this.subiendo.set(false);
      },
    });
  }

  protected quitarSoporte(indice: number): void {
    this.soportes.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected enviar(): void {
    this.intentoEnvio.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.soportes().length === 0 || this.horasInconsistentes()) {
      return; // 27.1.a / 28.1.a: los errores se muestran en pantalla.
    }

    const valores = this.form.getRawValue();
    const payload: AvanceSemanalCreate = {
      semana_calendario: this.semana(),
      actividades_a_desarrollar: valores.actividades_a_desarrollar,
      dias_trabajados: valores.dias.map((d, i) => ({
        numero_dia: i + 1,
        descripcion_dia: d.descripcion_dia,
        horas_dia: Number(d.horas_dia),
      })),
      horas_totales: Number(valores.horas_totales),
      beneficio_economico: Number(valores.beneficio_economico),
      soportes: this.soportes().map((s) => ({ archivo: s.archivo, tipo_archivo: s.tipo })),
      actividades_generales: valores.actividades_generales,
      ejecucion: valores.ejecucion,
      observaciones_estudiante: valores.observaciones_estudiante,
    };

    this.errorEnvio.set(null);
    this.enviando.set(true);
    this.avanceService.registrar(payload).subscribe({
      next: (avance) => this.router.navigate(['/estudiante/avances', avance.id]),
      error: (error: HttpErrorResponse) => {
        const detalle = error.error?.detail;
        this.errorEnvio.set(
          typeof detalle === 'string'
            ? detalle
            : 'No se pudo enviar el avance. Revisa los datos e intenta de nuevo.',
        );
        this.enviando.set(false);
      },
    });
  }

  private precargar(avance: AvanceSemanalOut): void {
    this.avanceOriginal.set(avance);
    this.semana.set(avance.semana_calendario);
    this.ajustarDias(avance.dias_trabajados.length);
    const ordenados = [...avance.dias_trabajados].sort((a, b) => a.numero_dia - b.numero_dia);
    ordenados.forEach((dia, i) => {
      this.dias.at(i).setValue({
        descripcion_dia: dia.descripcion_dia,
        horas_dia: Number(dia.horas_dia),
      });
    });
    this.form.patchValue({
      actividades_a_desarrollar: avance.actividades_a_desarrollar,
      numero_dias: avance.dias_trabajados.length,
      horas_totales: Number(avance.horas_totales),
      beneficio_economico: Number(avance.beneficio_economico),
      actividades_generales: avance.actividades_generales,
      ejecucion: avance.ejecucion,
      observaciones_estudiante: avance.observaciones_estudiante,
    });
    this.soportes.set(
      avance.soportes_avance.map((s) => ({
        archivo: s.archivo,
        tipo: s.tipo_archivo,
        nombre: s.archivo.split('/').pop()?.replace(/^[0-9a-f]{32}_/, '') ?? s.archivo,
      })),
    );
    this.cargandoInicial.set(false);
  }

  private ajustarDias(cantidad: number): void {
    while (this.dias.length < cantidad) {
      this.dias.push(this.crearDia());
    }
    while (this.dias.length > cantidad) {
      this.dias.removeAt(this.dias.length - 1);
    }
  }

  private crearDia(): DiaForm {
    return new FormGroup({
      descripcion_dia: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      horas_dia: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0.01), // 12.1.a: > 0
        Validators.max(24), // 12.1.a: <= 24
      ]),
    });
  }
}
