package jedanix.frontend.director;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.frontend.comun.*;
import jedanix.frontend.core.*;
import jedanix.frontend.estudiante.*;
import jedanix.frontend.revision.*;
import jedanix.frontend.servicios.*;

/** component */
class UsuariosLista {
    private AuthService authService;
    private UsuarioService usuarioService;
}

/** component */
class UsuarioForm {
    private UsuarioService usuarioService;
}

/** component */
class EmpresasListaDirector {
    private EmpresaService empresaService;
}

/** component */
class EmpresaDetalleDirector {
    private EmpresaService empresaService;
}

/** component */
class EmpresaForm {
    private EmpresaService empresaService;
    private UsuarioService usuarioService;
}

/** component */
class SolicitudesLista {
    private PostulacionService postulacionService;
}

/** component */
class SolicitudDetalle {
    private ArchivoService archivoService;
    private EmpresaService empresaService;
    private PostulacionService postulacionService;
    private UsuarioService usuarioService;
}

/** component */
class MatriculadosLista {
    private PostulacionService postulacionService;
}

/** component */
class MatriculadoDetalle {
    private AvanceService avanceService;
    private EmpresaService empresaService;
    private ObjetivoService objetivoService;
    private PostulacionService postulacionService;
    private UsuarioService usuarioService;
}

/** component */
class CierrePractica {
    private AvanceService avanceService;
    private EmpresaService empresaService;
    private PostulacionService postulacionService;
}
