import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { RolEnum } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly errorMensaje = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    correo_institucional: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.login(this.formulario.getRawValue()).subscribe({
      next: () => this.redirigirSegunRol(),
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        // El backend devuelve {"detail": "Correo o contraseña incorrectos."}
        // (ReglaDeNegocioError -> 422) o el mismo detalle en un 401/500.
        this.errorMensaje.set(
          error.error?.detail ?? 'No se pudo iniciar sesión. Intenta de nuevo.',
        );
      },
    });
  }

  private redirigirSegunRol(): void {
    const usuario = this.authService.usuario();
    if (usuario?.rol === RolEnum.ESTUDIANTE) {
      this.router.navigateByUrl('/estudiante');
      return;
    }
    // Las pantallas del Director, Coordinador y Docente Asesor todavía no
    // existen (ver Documentacion_Codigo_JEDANIX.md) -- se agregan rutas
    // aquí a medida que se construyan.
    this.router.navigateByUrl('/estudiante');
  }
}
