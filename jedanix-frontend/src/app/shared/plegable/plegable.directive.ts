import { Directive, ElementRef, inject, OnInit, Renderer2 } from '@angular/core';

/** Vuelve plegable una `mat-card` de las pantallas de detalle: al pulsar su
 * encabezado (o con Enter / Espacio) el contenido se oculta o se muestra, con
 * una pequeña animación. Los estilos están en `styles.scss` (`.plegable`).
 *
 * Uso: `<mat-card class="tarjeta-pagina" jxPlegable>` con un
 * `<mat-card-header>` y un `<mat-card-content>` dentro. */
@Directive({ selector: '[jxPlegable]' })
export class Plegable implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    const encabezado = this.host.querySelector<HTMLElement>('mat-card-header');
    if (!encabezado) {
      return;
    }
    this.renderer.addClass(this.host, 'plegable');
    this.renderer.setAttribute(encabezado, 'role', 'button');
    this.renderer.setAttribute(encabezado, 'tabindex', '0');
    this.renderer.setAttribute(encabezado, 'aria-expanded', 'true');
    this.renderer.setAttribute(encabezado, 'title', 'Pulsa para plegar o desplegar');

    const alternar = () => {
      const plegada = this.host.classList.toggle('plegada');
      this.renderer.setAttribute(encabezado, 'aria-expanded', String(!plegada));
    };
    this.renderer.listen(encabezado, 'click', alternar);
    this.renderer.listen(encabezado, 'keydown', (evento: KeyboardEvent) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        alternar();
      }
    });
  }
}
