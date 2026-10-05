import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/services/auth.service';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string | null;
}

/** Pantalla de inicio del Estudiante: navegación hacia las secciones de su
 * rol. `ruta: null` marca una sección que todavía no se ha construido (ver
 * Documentacion_Codigo_JEDANIX.md para el orden de avance). */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly authService = inject(AuthService);

  protected readonly accesos: AccesoRapido[] = [
    {
      titulo: 'Empresas disponibles',
      descripcion: 'Consulta las empresas receptoras activas para postularte.',
      icono: 'business',
      ruta: '/estudiante/empresas',
    },
    {
      titulo: 'Mi postulación',
      descripcion: 'Postúlate a una práctica y haz seguimiento a tu solicitud.',
      icono: 'assignment',
      ruta: '/estudiante/postulaciones',
    },
    {
      titulo: 'Objetivos de práctica',
      descripcion: 'Plantea y revisa los objetivos de tu práctica.',
      icono: 'flag',
      ruta: '/estudiante/objetivos',
    },
    {
      titulo: 'Avances semanales',
      descripcion: 'Registra tus avances semanales y consulta su calificación.',
      icono: 'fact_check',
      ruta: null,
    },
  ];
}
