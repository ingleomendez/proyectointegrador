import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { BotonTema } from '../../../shared/boton-tema/boton-tema';

/** Se pone en el campo "repetir" (y no en el grupo) para que el mensaje salga
 * debajo de ese campo. */
function igualALaNueva(repetir: AbstractControl): ValidationErrors | null {
  const nueva = repetir.parent?.get('password_nueva')?.value;
  return repetir.value && nueva !== repetir.value ? { noCoinciden: true } : null;
}

/** Destino del enlace del correo (`/restablecer?token=...`): permite elegir la
 * contraseña nueva. Si el enlace ya se usó o venció, el servidor lo rechaza y
 * se invita a pedir uno nuevo. */
@Component({
  selector: 'app-restablecer',
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
  templateUrl: './restablecer.html',
  styleUrls: ['../login/login.scss', '../auth-simple.scss'],
})
export class Restablecer {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  protected readonly hayToken = this.token.length > 0;
  protected readonly cargando = signal(false);
  protected readonly listo = signal<string | null>(null);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly verClave = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    password_nueva: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
    repetir: ['', [Validators.required, igualALaNueva]],
  });

  constructor() {
    // Si cambia la contraseña nueva, se vuelve a comparar con la repetida.
    this.formulario.controls.password_nueva.valueChanges.subscribe(() =>
      this.formulario.controls.repetir.updateValueAndValidity(),
    );
  }

  protected alternarClave(): void {
    this.verClave.update((v) => !v);
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.auth
      .restablecerContrasena({
        token: this.token,
        password_nueva: this.formulario.getRawValue().password_nueva,
      })
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.listo.set(respuesta.mensaje);
        },
        error: (error: HttpErrorResponse) => {
          this.cargando.set(false);
          this.errorMensaje.set(
            error.status === 0
              ? 'No hay conexión con el servidor. Intenta de nuevo en un momento.'
              : typeof error.error?.detail === 'string'
                ? error.error.detail
                : 'No se pudo cambiar la contraseña. Revisa los datos e intenta de nuevo.',
          );
        },
      });
  }
}
