import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'jedanix-tema';

/** Modo claro / oscuro de toda la aplicación.
 *
 * - La primera vez se respeta la preferencia del sistema operativo
 *   (`prefers-color-scheme`); después se recuerda la elección del usuario en
 *   `localStorage`.
 * - Se aplica como la clase `tema-oscuro` en `<html>`; `styles.scss` redefine
 *   allí las variables de color. `index.html` aplica la clase antes de que
 *   Angular arranque para evitar un destello claro al recargar. */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);

  readonly tema = signal<Tema>(this.temaInicial());

  constructor() {
    effect(() => {
      const tema = this.tema();
      this.documento.documentElement.classList.toggle('tema-oscuro', tema === 'oscuro');
      try {
        localStorage.setItem(CLAVE, tema);
      } catch {
        /* sin almacenamiento (modo privado): el tema solo dura la sesión */
      }
    });
  }

  alternar(): void {
    this.tema.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }

  private temaInicial(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === 'claro' || guardado === 'oscuro') {
        return guardado;
      }
    } catch {
      /* ignorar */
    }
    const ventana = this.documento.defaultView;
    return ventana?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
}
