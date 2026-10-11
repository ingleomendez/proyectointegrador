package jedanix.frontend.core;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.frontend.comun.*;
import jedanix.frontend.director.*;
import jedanix.frontend.estudiante.*;
import jedanix.frontend.revision.*;
import jedanix.frontend.servicios.*;

class Environment {
    private String apiUrl;
    private String notificacionesUrl;
}

class Utilidades {
    private Environment environment;
    public void despertarNotificaciones() { throw new UnsupportedOperationException(); }
    public List<ItemMenu> menuDeRol(RolEnum rol, ContextoEstudiante contexto) { throw new UnsupportedOperationException(); }
    public List<AccesoInicio> accesosDeRol(RolEnum rol, ContextoEstudiante contexto) { throw new UnsupportedOperationException(); }
    public String rutaInicioDeRol(RolEnum rol) { throw new UnsupportedOperationException(); }
}

/** HttpInterceptorFn */
class AuthInterceptor {
    private AuthService authService;
    private Utilidades utilidades;
    private Environment environment;
    public Observable<HttpEvent> authInterceptor(HttpRequest req, Object next) { throw new UnsupportedOperationException(); }
}

class Guards {
    private AuthService authService;
    public boolean authGuard() { throw new UnsupportedOperationException(); }
    public Object roleGuard(RolEnum[] rolesPermitidos) { throw new UnsupportedOperationException(); }
    public boolean inicioRolGuard() { throw new UnsupportedOperationException(); }
}

/** componente de layout */
class Shell {
    private AuthService authService;
    private EstadoEstudianteService estadoEstudiante;
    private Router router;
    public void alternarMenu() { throw new UnsupportedOperationException(); }
    public void cerrarMenu() { throw new UnsupportedOperationException(); }
    public void cerrarSesion() { throw new UnsupportedOperationException(); }
}

/** app.routes / app.config */
class AppRoutes {
    private Guards guards;
    private Shell shell;
    private AuthInterceptor interceptor;
}
