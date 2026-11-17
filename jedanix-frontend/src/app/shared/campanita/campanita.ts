import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { NotificacionUsuario } from '../../core/models/notificacion.model';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { haceCuanto } from '../../core/utils/tiempo-relativo';

/** Campanita de avisos: un botón con el número de avisos sin leer y un panel
 * con los más recientes. Al abrir un aviso se marca como leído y lleva a la
 * pantalla correspondiente. */
@Component({
  selector: 'jx-campanita',
  imports: [MatIconModule],
  templateUrl: './campanita.html',
  styleUrl: './campanita.scss',
  host: { '[class.variante-barra]': "variante() === 'barra'" },
})
export class Campanita {
  readonly variante = input<'claro' | 'barra'>('claro');

  protected readonly servicio = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected readonly abierto = signal(false);

  protected alternar(): void {
    this.abierto.update((v) => !v);
    if (this.abierto()) {
      this.servicio.refrescar();
    }
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected abrir(notificacion: NotificacionUsuario): void {
    this.servicio.marcarLeida(notificacion);
    this.cerrar();
    if (notificacion.ruta) {
      this.router.navigateByUrl(notificacion.ruta);
    }
  }

  protected cuando(iso: string): string {
    return haceCuanto(iso);
  }

  protected icono(evento: string): string {
    if (evento.startsWith('postulacion')) return 'assignment';
    if (evento.startsWith('practica')) return 'workspace_premium';
    if (evento.startsWith('objetivos')) return 'flag';
    if (evento.startsWith('avance')) return 'fact_check';
    return 'notifications';
  }

  protected etiquetaBoton(): string {
    const n = this.servicio.noLeidas();
    return n > 0 ? `Notificaciones, ${n} sin leer` : 'Notificaciones';
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    this.cerrar();
  }

  @HostListener('document:click', ['$event'])
  protected alClicFuera(evento: MouseEvent): void {
    if (this.abierto() && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.cerrar();
    }
  }
}
