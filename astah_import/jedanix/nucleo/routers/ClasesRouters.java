package jedanix.nucleo.routers;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.nucleo.core.*;
import jedanix.nucleo.dominio.*;
import jedanix.nucleo.excepciones.*;
import jedanix.nucleo.repositories.*;
import jedanix.nucleo.services.*;

/** router /auth. POST /login */
class AuthRouter {
    private String prefijo;
    private UsuarioService servicio;
    private Deps deps;
    public Object login() { throw new UnsupportedOperationException(); }
}

/** router /usuarios. GET /me | PUT /me | POST '' [Director] | GET '' [Director] | GET /programas-academicos | GET /{id} | PUT /{id} | PATCH /{id}/inactivar | POST /{id}/reenviar-credenciales | PATCH /{id}/reactivar */
class UsuariosRouter {
    private String prefijo;
    private UsuarioService servicio;
    private Deps deps;
    public Object mi_perfil() { throw new UnsupportedOperationException(); }
    public Object actualizar_mi_perfil() { throw new UnsupportedOperationException(); }
    public Object crear() { throw new UnsupportedOperationException(); }
    public Object listar() { throw new UnsupportedOperationException(); }
    public Object programas_academicos() { throw new UnsupportedOperationException(); }
    public Object obtener() { throw new UnsupportedOperationException(); }
    public Object actualizar() { throw new UnsupportedOperationException(); }
    public Object inactivar() { throw new UnsupportedOperationException(); }
    public Object reenviar_credenciales() { throw new UnsupportedOperationException(); }
    public Object reactivar() { throw new UnsupportedOperationException(); }
}

/** router /empresas. POST '' | GET '' | GET /{id} | PUT /{id} | POST /{id}/preguntas | PUT /{id}/preguntas/{pid} | DELETE /{id}/preguntas/{pid} | POST /{id}/documentos-requeridos | PUT /{id}/documentos-requeridos/{did} | DELETE /{id}/documentos-requeridos/{did} | PATCH /{id}/inactivar */
class EmpresasRouter {
    private String prefijo;
    private EmpresaReceptoraService servicio;
    private Deps deps;
    public Object crear() { throw new UnsupportedOperationException(); }
    public Object listar() { throw new UnsupportedOperationException(); }
    public Object obtener() { throw new UnsupportedOperationException(); }
    public Object actualizar() { throw new UnsupportedOperationException(); }
    public Object agregar_pregunta() { throw new UnsupportedOperationException(); }
    public Object actualizar_pregunta() { throw new UnsupportedOperationException(); }
    public Object eliminar_pregunta() { throw new UnsupportedOperationException(); }
    public Object agregar_documento() { throw new UnsupportedOperationException(); }
    public Object actualizar_documento() { throw new UnsupportedOperationException(); }
    public Object eliminar_documento() { throw new UnsupportedOperationException(); }
    public Object inactivar() { throw new UnsupportedOperationException(); }
}

/** router /postulaciones. POST '' | PUT /{id} | POST /{id}/enviar | GET /me | GET /pendientes | PATCH /{id}/decision | PATCH /{id}/cierre | GET /matriculados | GET /{id} */
class PostulacionesRouter {
    private String prefijo;
    private PostulacionService servicio;
    private Deps deps;
    public Object crear() { throw new UnsupportedOperationException(); }
    public Object actualizar_borrador() { throw new UnsupportedOperationException(); }
    public Object enviar() { throw new UnsupportedOperationException(); }
    public Object mias() { throw new UnsupportedOperationException(); }
    public Object pendientes() { throw new UnsupportedOperationException(); }
    public Object decidir() { throw new UnsupportedOperationException(); }
    public Object cerrar() { throw new UnsupportedOperationException(); }
    public Object matriculados() { throw new UnsupportedOperationException(); }
    public Object obtener() { throw new UnsupportedOperationException(); }
}

/** router /objetivos. POST '' | GET /me | GET /postulacion/{id} | GET /pendientes | PATCH /{id}/decision */
class ObjetivosRouter {
    private String prefijo;
    private ObjetivoPracticaService servicio;
    private Deps deps;
    public Object enviar() { throw new UnsupportedOperationException(); }
    public Object mios() { throw new UnsupportedOperationException(); }
    public Object de_postulacion() { throw new UnsupportedOperationException(); }
    public Object pendientes() { throw new UnsupportedOperationException(); }
    public Object decidir() { throw new UnsupportedOperationException(); }
}

/** router /avances. POST '' | GET /me | GET /postulacion/{id} | GET /coordinador | PATCH /{id}/calificacion | GET /docente | PATCH /{id}/observacion | GET /{id} */
class AvancesRouter {
    private String prefijo;
    private AvanceSemanalService servicio;
    private Deps deps;
    public Object registrar() { throw new UnsupportedOperationException(); }
    public Object mios() { throw new UnsupportedOperationException(); }
    public Object de_postulacion() { throw new UnsupportedOperationException(); }
    public Object listar_coordinador() { throw new UnsupportedOperationException(); }
    public Object calificar() { throw new UnsupportedOperationException(); }
    public Object listar_docente() { throw new UnsupportedOperationException(); }
    public Object observar() { throw new UnsupportedOperationException(); }
    public Object obtener() { throw new UnsupportedOperationException(); }
}

/** router /archivos y /uploads. POST /archivos | GET /uploads/{nombre} */
class ArchivosRouter {
    private String prefijo;
    private Deps deps;
    public Object subir() { throw new UnsupportedOperationException(); }
    public Object descargar() { throw new UnsupportedOperationException(); }
}
