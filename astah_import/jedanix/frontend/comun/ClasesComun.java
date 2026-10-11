package jedanix.frontend.comun;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.frontend.core.*;
import jedanix.frontend.director.*;
import jedanix.frontend.estudiante.*;
import jedanix.frontend.revision.*;
import jedanix.frontend.servicios.*;

/** component */
class Login {
    private AuthService authService;
}

/** component */
class Perfil {
    private ArchivoService archivoService;
    private AuthService authService;
    private UsuarioService usuarioService;
}

/** component */
class InicioRol {
    private AuthService authService;
    private EstadoEstudianteService estadoEstudianteService;
}
