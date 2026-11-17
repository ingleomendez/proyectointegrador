import { Component, input } from '@angular/core';

export interface BarraDato {
  etiqueta: string;
  valor: number;
  /** Valor que representa el 100 % de la barra. */
  maximo: number;
  /** Texto escrito a la derecha (por ejemplo "24 / 120 h"). */
  texto: string;
  color?: string;
}

/** Barras horizontales con su valor escrito: sirven para progreso de horas y
 * para comparar semanas. Todas las barras de una misma gráfica comparten escala
 * cuando se les pasa el mismo `maximo`. */
@Component({
  selector: 'jx-barras',
  template: `
    <ul class="barras">
      @for (d of datos(); track d.etiqueta) {
        <li>
          <span class="etiqueta" [attr.title]="d.etiqueta">{{ d.etiqueta }}</span>
          <span
            class="pista"
            role="meter"
            [attr.aria-label]="d.etiqueta"
            aria-valuemin="0"
            [attr.aria-valuemax]="d.maximo"
            [attr.aria-valuenow]="d.valor"
            [attr.aria-valuetext]="d.texto"
          >
            <span
              class="relleno"
              [style.width.%]="porcentaje(d)"
              [style.background]="d.color ?? 'var(--jx-cyan-600)'"
            ></span>
          </span>
          <span class="valor">{{ d.texto }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    .barras {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      grid-template-columns: minmax(80px, 34%) minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      font-size: 0.88rem;
    }

    .etiqueta {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--mat-sys-on-surface);
    }

    .pista {
      display: block;
      height: 12px;
      border-radius: 6px;
      background: var(--jx-borde);
      opacity: 0.9;
      overflow: hidden;
    }

    .relleno {
      display: block;
      height: 100%;
      min-width: 4px;
      border-radius: 6px;
      transform-origin: left;
      animation: crece 0.7s ease backwards;
    }

    @keyframes crece {
      from {
        transform: scaleX(0);
      }
    }

    .valor {
      min-width: 78px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: var(--mat-sys-on-surface-variant);
    }

    @media (max-width: 480px) {
      li {
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .etiqueta {
        grid-column: 1 / -1;
      }
    }
  `,
})
export class Barras {
  readonly datos = input.required<BarraDato[]>();

  protected porcentaje(d: BarraDato): number {
    if (d.maximo <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (d.valor / d.maximo) * 100));
  }
}
