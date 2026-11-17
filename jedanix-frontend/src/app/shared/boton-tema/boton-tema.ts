import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TemaService } from '../../core/services/tema.service';

/** Botón redondo para alternar entre modo claro y oscuro (se usa donde no
 * está la barra lateral, por ejemplo en la pantalla de inicio de sesión). */
@Component({
  selector: 'jx-boton-tema',
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      class="boton-tema"
      (click)="temaService.alternar()"
      [attr.aria-label]="temaService.tema() === 'oscuro' ? 'Activar modo claro' : 'Activar modo oscuro'"
      [attr.title]="temaService.tema() === 'oscuro' ? 'Modo claro' : 'Modo oscuro'"
    >
      <mat-icon>{{ temaService.tema() === 'oscuro' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: `
    .boton-tema {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 50%;
      color: #fff;
      background: rgba(0, 54, 61, 0.55);
      backdrop-filter: blur(6px);
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 54, 61, 0.35);
      transition:
        transform 0.2s ease,
        background 0.2s ease;
    }

    .boton-tema:hover {
      transform: rotate(18deg) scale(1.08);
      background: rgba(0, 54, 61, 0.8);
    }
  `,
})
export class BotonTema {
  protected readonly temaService = inject(TemaService);
}
