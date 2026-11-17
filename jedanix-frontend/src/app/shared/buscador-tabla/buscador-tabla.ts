import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/** Buscador en vivo para las tablas del sistema.
 *
 * Mientras el usuario escribe, oculta las filas de `table.tabla` (dentro del
 * contenido principal) que no contengan el texto buscado, sin distinguir
 * mayúsculas ni tildes. Funciona sobre el DOM ya renderizado, así que no hay
 * que tocar la lógica de cada pantalla; un `MutationObserver` vuelve a aplicar
 * el filtro cuando la tabla se recarga (por ejemplo, al cambiar otro filtro).
 *
 * Uso: `<jx-buscador-tabla etiqueta="Buscar usuario" />` junto a la tabla. */
@Component({
  selector: 'jx-buscador-tabla',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="buscador">
      <mat-label>{{ etiqueta() }}</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        type="search"
        autocomplete="off"
        [value]="texto()"
        (input)="alEscribir($any($event.target).value)"
      />
      @if (texto()) {
        <button matSuffix mat-icon-button type="button" aria-label="Limpiar búsqueda" (click)="limpiar()">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
    @if (texto()) {
      <span class="conteo" aria-live="polite">
        @if (visibles() === 0) {
          Sin resultados
        } @else {
          {{ visibles() }} de {{ total() }}
        }
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }

    .buscador {
      min-width: 260px;
    }

    mat-icon[matPrefix] {
      margin-left: 12px;
    }

    .conteo {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
    }
  `,
})
export class BuscadorTabla {
  readonly etiqueta = input('Buscar en la tabla');

  private readonly documento = inject(DOCUMENT);

  protected readonly texto = signal('');
  protected readonly total = signal(0);
  protected readonly visibles = signal(0);

  private observador?: MutationObserver;
  private pendiente = 0;

  constructor() {
    const contenido = this.documento.querySelector('main.contenido');
    const ventana = this.documento.defaultView;
    if (contenido && ventana && 'MutationObserver' in ventana) {
      this.observador = new MutationObserver(() => this.programar());
      this.observador.observe(contenido, { childList: true, subtree: true });
    }
    inject(DestroyRef).onDestroy(() => {
      this.observador?.disconnect();
      if (this.pendiente) {
        ventana?.cancelAnimationFrame(this.pendiente);
      }
    });
  }

  protected alEscribir(valor: string): void {
    this.texto.set(valor);
    this.aplicar();
  }

  protected limpiar(): void {
    this.alEscribir('');
  }

  private programar(): void {
    const ventana = this.documento.defaultView;
    if (!ventana || this.pendiente) {
      return;
    }
    this.pendiente = ventana.requestAnimationFrame(() => {
      this.pendiente = 0;
      this.aplicar();
    });
  }

  private aplicar(): void {
    const consulta = normalizar(this.texto());
    const filas = Array.from(
      this.documento.querySelectorAll<HTMLElement>('main.contenido table.tabla tbody tr'),
    );
    let visibles = 0;
    for (const fila of filas) {
      const coincide = !consulta || normalizar(fila.textContent ?? '').includes(consulta);
      fila.classList.toggle('jx-fila-oculta', !coincide);
      if (coincide) {
        visibles++;
      }
    }
    this.total.set(filas.length);
    this.visibles.set(visibles);
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
