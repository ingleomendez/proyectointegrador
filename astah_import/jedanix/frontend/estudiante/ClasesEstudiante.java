package jedanix.frontend.estudiante;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.frontend.comun.*;
import jedanix.frontend.core.*;
import jedanix.frontend.director.*;
import jedanix.frontend.revision.*;
import jedanix.frontend.servicios.*;

/** component */
class Inicio {
    private AuthService authService;
}

/** component */
class EmpresasLista {
    private EmpresaService empresaService;
    private PostulacionService postulacionService;
}

/** component */
class EmpresaDetalle {
    private EmpresaService empresaService;
    private PostulacionService postulacionService;
}

/** component */
class PostulacionNueva {
    private ArchivoService archivoService;
    private EmpresaService empresaService;
    private PostulacionService postulacionService;
}

/** component */
class PostulacionesLista {
    private PostulacionService postulacionService;
}

/** component */
class PostulacionDetalle {
    private PostulacionService postulacionService;
}

/** component */
class MiPractica {
    private AvanceService avanceService;
    private EmpresaService empresaService;
    private ObjetivoService objetivoService;
    private PostulacionService postulacionService;
}

/** component */
class Objetivos {
    private ObjetivoService objetivoService;
}

/** component */
class AvancesLista {
    private ArchivoService archivoService;
    private AvanceService avanceService;
    private ObjetivoService objetivoService;
    private PostulacionService postulacionService;
}

/** component */
class AvanceNuevo {
    private ArchivoService archivoService;
    private AvanceService avanceService;
}

/** component */
class AvanceDetalle {
    private ArchivoService archivoService;
    private AvanceService avanceService;
}
