import { RolEnum } from '../models/usuario.model';

export interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: string;
}

export const NOMBRE_ROL: Record<RolEnum, string> = {
  [RolEnum.ESTUDIANTE]: 'Estudiante',
  [RolEnum.DIRECTOR]: 'Director',
  [RolEnum.COORDINADOR]: 'Coordinador',
  [RolEnum.DOCENTE_ASESOR]: 'Docente Asesor',
};

/** Ruta del panel de inicio de cada rol. */
export function rutaInicioDeRol(rol: RolEnum): string {
  switch (rol) {
    case RolEnum.ESTUDIANTE:
      return '/estudiante';
    case RolEnum.DIRECTOR:
      return '/director';
    case RolEnum.COORDINADOR:
      return '/coordinador';
    case RolEnum.DOCENTE_ASESOR:
      return '/docente-asesor';
  }
}

/** Menú de navegación de la barra superior, por rol. */
export function menuDeRol(rol: RolEnum): ItemMenu[] {
  switch (rol) {
    case RolEnum.ESTUDIANTE:
      return [
        { etiqueta: 'Empresas', ruta: '/estudiante/empresas', icono: 'business' },
        { etiqueta: 'Postulación', ruta: '/estudiante/postulaciones', icono: 'assignment' },
        { etiqueta: 'Mi práctica', ruta: '/estudiante/mi-practica', icono: 'work' },
        { etiqueta: 'Objetivos', ruta: '/estudiante/objetivos', icono: 'flag' },
        { etiqueta: 'Avances', ruta: '/estudiante/avances', icono: 'fact_check' },
      ];
    case RolEnum.DIRECTOR:
      return [
        { etiqueta: 'Usuarios', ruta: '/director/usuarios', icono: 'group' },
        { etiqueta: 'Empresas', ruta: '/director/empresas', icono: 'business' },
        { etiqueta: 'Solicitudes', ruta: '/director/solicitudes', icono: 'inbox' },
        { etiqueta: 'Matriculados', ruta: '/director/matriculados', icono: 'school' },
      ];
    case RolEnum.COORDINADOR:
      return [
        { etiqueta: 'Avances', ruta: '/coordinador/avances', icono: 'fact_check' },
        { etiqueta: 'Estudiantes', ruta: '/coordinador/estudiantes', icono: 'school' },
      ];
    case RolEnum.DOCENTE_ASESOR:
      return [
        { etiqueta: 'Objetivos', ruta: '/docente-asesor/objetivos', icono: 'flag' },
        { etiqueta: 'Avances', ruta: '/docente-asesor/avances', icono: 'fact_check' },
        { etiqueta: 'Estudiantes', ruta: '/docente-asesor/estudiantes', icono: 'school' },
      ];
  }
}

export interface AccesoInicio extends ItemMenu {
  descripcion: string;
}

/** Tarjetas del panel de inicio de los roles que comparten `InicioRol`. */
export function accesosDeRol(rol: RolEnum): AccesoInicio[] {
  const descripciones: Record<string, string> = {
    '/director/usuarios': 'Crea, edita, inactiva y reactiva las cuentas del sistema.',
    '/director/empresas': 'Administra las empresas receptoras, su bitácora y documentos requeridos.',
    '/director/solicitudes': 'Revisa y decide las postulaciones pendientes de aprobación.',
    '/director/matriculados': 'Consulta las prácticas en curso y realiza el cierre formal.',
    '/coordinador/avances': 'Califica u observa los avances semanales de tus estudiantes.',
    '/coordinador/estudiantes': 'Consulta los estudiantes matriculados bajo tu responsabilidad.',
    '/docente-asesor/objetivos': 'Aprueba o rechaza los objetivos de práctica planteados.',
    '/docente-asesor/avances': 'Deja observaciones sobre los avances de tus estudiantes.',
    '/docente-asesor/estudiantes': 'Consulta los estudiantes matriculados que asesoras.',
  };
  return menuDeRol(rol).map((item) => ({ ...item, descripcion: descripciones[item.ruta] ?? '' }));
}
