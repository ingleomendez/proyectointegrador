import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TemaService } from './core/services/tema.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Se instancia al arrancar para aplicar el tema guardado en todas las pantallas
  // (incluido el inicio de sesión).
  protected readonly temaService = inject(TemaService);
}
