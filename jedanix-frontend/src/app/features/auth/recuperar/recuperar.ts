import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { BotonTema } from '../../../shared/boton-tema/boton-tema';

/** "¿Olvidaste tu contraseña?": pide el correo institucional y, si la cuenta
 * existe y está activa, el servidor envía un enlace de un solo uso (vale 30
 * minutos). La respuesta es siempre la misma para no revelar qué correos están
 * registrados. */
@Component({
  selector: 'app-recuperar',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    BotonTema,
  ],
  templateUrl: './recuperar.html',
  styleUrls: ['../login/login.scss', '../auth-simple.scss'],
})
export class Recuperar {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly cargando = signal(false);
  protected readonly enviado = signal<string | null>(null);
  protected readonly errorMensaje = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    correo_institucional: ['', [Validators.required, Validators.email]],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.auth.olvideContrasena(this.formulario.getRawValue().correo_institucional).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.enviado.set(respuesta.mensaje);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMensaje.set(
          error.status === 0
            ? 'No hay conexión con el servidor. Intenta de nuevo en un momento.'
            : (error.error?.detail ?? 'No se pudo procesar la solicitud. Intenta de nuevo.'),
        );
      },
    });
  }
}
