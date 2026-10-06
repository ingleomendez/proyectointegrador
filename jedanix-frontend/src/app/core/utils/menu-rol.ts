import { RolEnum } from '../models/usuario.model';

export interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: string;
  /** Se muestra pero no se puede abrir (p. ej. "Objetivos" sin matrícula, CU-11 excepción 1.1.a). */
  deshabilitado?: boolean;
  /** Texto de ayuda cuando el ítem está deshabilitado. */
  ayuda?: string;
}

/** Estado del Estudiante que decide qué opciones del menú se ven (CU-06 2.1.a,
 * CU-08 2.1.b, CU-11 1.1.a): solo importa si tiene una práctica MATRICULADA
 * (postulación APROBADA), si ya la FINALIZÓ o si tiene una solicitud en trámite. */
export interface ContextoEstudiante {
  matriculado: boolean;
  finalizada: boolean;
  enTramite: boolean;
}

export const CONTEXTO_ESTUDIANTE_INICIAL: ContextoEstudiante = {
  matriculado: false,
  finalizada: false,
  enTramite: false,
};

export const NOMBRE_ROL: Record<RolEnum, string> = {
  [RolEnum.ESTUDIANTE]: 'Estudiante',
  [RolEnum.DIRECTOR]: 'Director',
  [RolEnum.COORDINADOR]: 'Coordinador de Práctica',
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

/** Menú lateral por rol. Los nombres son exactamente los de las opciones que
 * nombran los casos de uso (CasosDeUso_JEDANIX_v2_4Actores.md). "Mi Perfil" no
 * va aquí: es común a los cuatro roles y el shell lo muestra aparte. */
export function menuDeRol(
  rol: RolEnum,
  contexto: ContextoEstudiante = CONTEXTO_ESTUDIANTE_INICIAL,
): ItemMenu[] {
  switch (rol) {
    case RolEnum.ESTUDIANTE: {
      const items: ItemMenu[] = [];
      // CU-06, excepción 2.1.a: ya matriculado => no aparece "Solicitud de práctica".
      if (!contexto.matriculado) {
        items.push({
          etiqueta: 'Solicitud de práctica',
          ruta: '/estudiante/solicitud',
          icono: 'assignment',
        });
      }
      items.push({ etiqueta: 'Mi Práctica', ruta: '/estudiante/mi-practica', icono: 'work' });
      // CU-11, excepción 1.1.a: sin práctica matriculada "Objetivos" queda deshabilitada.
      items.push({
        etiqueta: 'Objetivos',
        ruta: '/estudiante/objetivos',
        icono: 'flag',
        deshabilitado: !contexto.matriculado,
        ayuda: 'Se habilita cuando tu práctica queda matriculada.',
      });
      // CU-08, excepción 2.1.b: sin práctica matriculada no se muestra "Seguimiento Prácticas".
      if (contexto.matriculado || contexto.finalizada) {
        items.push({
          etiqueta: 'Seguimiento Prácticas',
          ruta: '/estudiante/seguimiento',
          icono: 'fact_check',
        });
      }
      return items;
    }
    case RolEnum.DIRECTOR:
      return [
        { etiqueta: 'Usuarios', ruta: '/director/usuarios', icono: 'group' },
        { etiqueta: 'Empresas Receptoras', ruta: '/director/empresas', icono: 'business' },
        { etiqueta: 'Solicitudes Prácticas', ruta: '/director/solicitudes', icono: 'inbox' },
        { etiqueta: 'Matriculados', ruta: '/director/matriculados', icono: 'school' },
      ];
    case RolEnum.COORDINADOR:
      return [{ etiqueta: 'Estudiantes', ruta: '/coordinador/estudiantes', icono: 'school' }];
    case RolEnum.DOCENTE_ASESOR:
      return [{ etiqueta: 'Estudiantes', ruta: '/docente-asesor/estudiantes', icono: 'school' }];
  }
}

export interface AccesoInicio extends ItemMenu {
  descripcion: string;
}

const DESCRIPCIONES: Record<string, string> = {
  '/estudiante/solicitud':
    'Consulta las empresas receptoras disponibles, sube tus documentos, responde la bitácora y haz seguimiento a tu solicitud.',
  '/estudiante/mi-practica':
    'Consulta los datos de tu práctica, tus horas acumuladas y el estado de tus objetivos.',
  '/estudiante/objetivos': 'Plantea los objetivos de tu práctica y consulta si fueron aprobados.',
  '/estudiante/seguimiento':
    'Registra tus avances semanales y consulta su calificación y observaciones.',
  '/director/usuarios': 'Crea, edita, inactiva y reactiva las cuentas del sistema.',
  '/director/empresas':
    'Administra las empresas receptoras, su bitácora, documentos requeridos y responsables.',
  '/director/solicitudes': 'Revisa y decide las solicitudes de práctica pendientes de aprobación.',
  '/director/matriculados':
    'Consulta los estudiantes matriculados, su avance y realiza el cierre formal de la práctica.',
  '/coordinador/estudiantes':
    'Consulta tus estudiantes asignados, revisa sus avances semanales y califícalos.',
  '/docente-asesor/estudiantes':
    'Consulta tus estudiantes asignados, revisa sus avances, registra observaciones y decide sus objetivos.',
};

/** Tarjetas del panel de inicio (mismos ítems y nombres que el menú lateral). */
export function accesosDeRol(
  rol: RolEnum,
  contexto: ContextoEstudiante = CONTEXTO_ESTUDIANTE_INICIAL,
): AccesoInicio[] {
  return menuDeRol(rol, contexto).map((item) => ({
    ...item,
    descripcion: DESCRIPCIONES[item.ruta] ?? '',
  }));
}
