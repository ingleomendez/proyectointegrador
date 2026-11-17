import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

import { environment } from '../../../environments/environment';
import { MisNotificaciones, NotificacionUsuario } from '../models/notificacion.model';

const INTERVALO_MS = 60_000;

/** Avisos dentro del sistema ("campanita"). El Núcleo guarda un aviso por cada
 * evento que también sale por correo; aquí se consultan cada minuto mientras la
 * pestaña está visible y se marcan como leídos. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly documento = inject(DOCUMENT);
  private readonly baseUrl = `${environment.apiUrl}/mis-notificaciones`;

  readonly lista = signal<NotificacionUsuario[]>([]);
  readonly noLeidas = signal(0);

  private temporizador: ReturnType<typeof setInterval> | null = null;
  private readonly alVolverVisible = () => {
    if (!this.documento.hidden) {
      this.refrescar();
    }
  };

  /** Empieza a consultar. Es seguro llamarlo varias veces. */
  iniciar(): void {
    if (this.temporizador !== null) {
      return;
    }
    this.refrescar();
    this.temporizador = setInterval(() => {
      if (!this.documento.hidden) {
        this.refrescar();
      }
    }, INTERVALO_MS);
    this.documento.addEventListener('visibilitychange', this.alVolverVisible);
  }

  /** Detiene la consulta y borra los avisos (al cerrar sesión). */
  detener(): void {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
    this.documento.removeEventListener('visibilitychange', this.alVolverVisible);
    this.lista.set([]);
    this.noLeidas.set(0);
  }

  refrescar(): void {
    this.http.get<MisNotificaciones>(this.baseUrl).subscribe({
      next: (datos) => {
        this.lista.set(datos.notificaciones);
        this.noLeidas.set(datos.no_leidas);
      },
      // Sin conexión o servidor dormido: se conserva lo último y se reintenta en el siguiente ciclo.
      error: () => undefined,
    });
  }

  marcarLeida(notificacion: NotificacionUsuario): void {
    if (notificacion.leida) {
      return;
    }
    // Se actualiza al instante y se confirma en segundo plano.
    this.lista.update((lista) => lista.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n)));
    this.noLeidas.update((n) => Math.max(0, n - 1));
    this.http.post<void>(`${this.baseUrl}/${notificacion.id}/leer`, {}).subscribe({
      error: () => this.refrescar(),
    });
  }

  marcarTodasLeidas(): void {
    this.lista.update((lista) => lista.map((n) => ({ ...n, leida: true })));
    this.noLeidas.set(0);
    this.http.post<void>(`${this.baseUrl}/leer-todas`, {}).subscribe({
      error: () => this.refrescar(),
    });
  }
}
