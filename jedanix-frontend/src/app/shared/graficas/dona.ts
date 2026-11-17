import { Component, computed, input } from '@angular/core';

export interface SegmentoDona {
  etiqueta: string;
  valor: number;
  color: string;
}

const RADIO = 48;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/** Gráfica de dona en SVG con leyenda. Cada segmento lleva su cantidad escrita
 * en la leyenda, así no depende solo del color para entenderse. */
@Component({
  selector: 'jx-dona',
  template: `
    <div class="dona" role="img" [attr.aria-label]="descripcion()">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="pista" cx="60" cy="60" [attr.r]="radio" />
        @for (arco of arcos(); track arco.etiqueta) {
          <circle
            class="arco"
            cx="60"
            cy="60"
            [attr.r]="radio"
            [attr.stroke]="arco.color"
            [attr.stroke-dasharray]="arco.dash"
            [attr.stroke-dashoffset]="arco.offset"
          />
        }
      </svg>
      <div class="centro">
        <strong>{{ centroValor() }}</strong>
        <span>{{ centroTexto() }}</span>
      </div>
    </div>
    <ul class="leyenda">
      @for (s of segmentos(); track s.etiqueta) {
        <li>
          <span class="muestra" [style.background]="s.color"></span>
          <span class="nombre">{{ s.etiqueta }}</span>
          <strong>{{ s.valor }}</strong>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 22px;
      flex-wrap: wrap;
    }

    .dona {
      position: relative;
      flex: 0 0 150px;
      width: 150px;
      height: 150px;
    }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    circle {
      fill: none;
      stroke-width: 15;
    }

    .pista {
      stroke: var(--jx-borde);
      opacity: 0.7;
    }

    .arco {
      animation: dibuja 0.8s ease backwards;
    }

    @keyframes dibuja {
      from {
        opacity: 0;
        stroke-width: 6;
      }
    }

    .centro {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1.15;

      strong {
        font-size: 1.7rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      span {
        max-width: 90px;
        font-size: 0.72rem;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .leyenda {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 140px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }

    .muestra {
      flex: 0 0 12px;
      width: 12px;
      height: 12px;
      border-radius: 4px;
    }

    .nombre {
      flex: 1 1 auto;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Dona {
  readonly segmentos = input.required<SegmentoDona[]>();
  readonly centroValor = input<string | number>('');
  readonly centroTexto = input<string>('');

  protected readonly radio = RADIO;

  protected readonly total = computed(() =>
    this.segmentos().reduce((suma, s) => suma + Math.max(0, s.valor), 0),
  );

  protected readonly arcos = computed(() => {
    const total = this.total();
    if (total <= 0) {
      return [];
    }
    let acumulado = 0;
    return this.segmentos()
      .filter((s) => s.valor > 0)
      .map((s) => {
        const largo = (s.valor / total) * CIRCUNFERENCIA;
        const arco = {
          etiqueta: s.etiqueta,
          color: s.color,
          dash: `${largo} ${CIRCUNFERENCIA - largo}`,
          offset: -acumulado,
        };
        acumulado += largo;
        return arco;
      });
  });

  protected readonly descripcion = computed(() =>
    this.segmentos()
      .map((s) => `${s.etiqueta}: ${s.valor}`)
      .join('; '),
  );
}
