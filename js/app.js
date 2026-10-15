/* ============================================================
CRF - APLICACIÓN PRINCIPAL
==========================

Flujo de datos:

MOCK_DATA / API
↓
API.obtenerDatos()
↓
normalizarDatosAplicacion()
↓
window.DATOS_MOCK
↓
mapa / vehículos / avisos / rutas
============================================================ */


/* ============================================================
INICIO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);


async function iniciarAplicacion() {

    try {

        var datos =
            await API.obtenerDatos();


        window.DATOS_MOCK =
            normalizarDatosAplicacion(
                datos
            );


        console.log(
            "CRF - Datos cargados correctamente:",
            window.DATOS_MOCK
        );


        /* --------------------------------------------
           NAVEGACIÓN
        -------------------------------------------- */

        configurarNavegacion();


        /* --------------------------------------------
           MAPA
        -------------------------------------------- */

        inicializarMapa();


        /* --------------------------------------------
           VEHÍCULOS
        -------------------------------------------- */

        renderizarVehiculos();


        /* --------------------------------------------
           AVISOS
        -------------------------------------------- */

        renderizarAvisos();


        /* --------------------------------------------
           RUTAS
        -------------------------------------------- */

        if (
            typeof inicializarPlanificacion ===
            "function"
        ) {

            inicializarPlanificacion();

        } else {

            if (
                typeof renderizarLeyendaRutas ===
                "function"
            ) {

                renderizarLeyendaRutas();

            }


            if (
                typeof renderizarPlanificacion ===
                "function"
            ) {

                renderizarPlanificacion();

            }

        }


        /* --------------------------------------------
           ACCIONES
        -------------------------------------------- */

        configurarBotonesAcciones();


        /* --------------------------------------------
           PANELES REDIMENSIONABLES · FASE 1
        -------------------------------------------- */

        if (
            typeof configurarPanelesRedimensionables ===
            "function"
        ) {
            configurarPanelesRedimensionables();
        }


        if (
            typeof configurarRestauracionDistribucion ===
            "function"
        ) {
            configurarRestauracionDistribucion();
        }


        /* --------------------------------------------
           RELOJ
        -------------------------------------------- */

        iniciarReloj();


        /* --------------------------------------------
           ACTUALIZACIÓN
        -------------------------------------------- */

        actualizarHoraActualizacion();


        /* --------------------------------------------
           GPS SIMULADO
        -------------------------------------------- */

        iniciarSimulacionGPS();


        /* --------------------------------------------
           VISTA INICIAL
        -------------------------------------------- */

        mostrarVista(
            "inicio"
        );


        console.log(
            "CRF - Dashboard V2 iniciado correctamente."
        );


    } catch (error) {

        console.error(
            "Error iniciando el dashboard:",
            error
        );


        mostrarErrorAplicacion(
            error
        );

    }

}


/* ============================================================
NORMALIZACIÓN DE DATOS
============================================================ */

/*
 * FASE 3F.6.6-B2 · valida YYYY-MM-DD con calendario real, sin
 * objetos Date ni zonas horarias. Devuelve la cadena o null.
 */
function validarFechaServidor(valor) {

    if (typeof valor !== "string") {

        return null;
    }


    var coincidencia =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);


    if (!coincidencia) {

        return null;
    }


    var anio = Number(coincidencia[1]);

    var mes = Number(coincidencia[2]);

    var dia = Number(coincidencia[3]);


    if (
        mes < 1 ||
        mes > 12 ||
        dia < 1
    ) {

        return null;
    }


    var bisiesto =
        (anio % 4 === 0 && anio % 100 !== 0) ||
        anio % 400 === 0;

    var diasPorMes = [
        31, bisiesto ? 29 : 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31
    ];


    if (dia > diasPorMes[mes - 1]) {

        return null;
    }


    return valor;
}


function normalizarDatosAplicacion(
    datos
) {

    if (
        !datos ||
        typeof datos !== "object"
    ) {

        throw new Error(
            "La API no ha devuelto un objeto de datos válido."
        );

    }


    /* ========================================================
       FECHA EFECTIVA DEL SERVIDOR (FASE 3F.6.6-B2)
       --------------------------------------------------------
       Referencia autoritativa del día. Si falta o es inválida
       se propaga null y el guardado queda bloqueado: nunca se
       sustituye por la fecha del dispositivo.
    ======================================================== */


    /* ========================================================
       VEHÍCULOS
    ======================================================== */

    var vehiculosOrigen =
        Array.isArray(datos.vehiculos)
            ? datos.vehiculos
            : [];


    var vehiculos =
        vehiculosOrigen.map(
            function(
                vehiculo,
                indice
            ) {

                var id =
                    vehiculo.id_vehiculo !== undefined
                        ? String(
                            vehiculo.id_vehiculo
                        )
                        : vehiculo.id !== undefined
                            ? String(
                                vehiculo.id
                            )
                            : "V" +
                              (
                                  indice + 1
                              );


                return {

                    id_vehiculo:
                        id,

                    id:
                        id,

                    nombre:
                        vehiculo.nombre ||
                        "Vehículo " +
                        (
                            indice + 1
                        ),

                    ruta_id:
                        vehiculo.ruta_id ||
                        vehiculo.rutaHabitual ||
                        vehiculo.ruta_habitual ||
                        vehiculo.ruta ||
                        "R" +
                        (
                            indice + 1
                        ),

                    rutaHabitual:
                        vehiculo.rutaHabitual ||
                        vehiculo.ruta_habitual ||
                        vehiculo.ruta_id ||
                        vehiculo.ruta ||
                        "R" +
                        (
                            indice + 1
                        ),

                    tablet:
                        vehiculo.tablet ||
                        vehiculo.tablet_id ||
                        vehiculo.id_tablet ||
                        "",

                    activo:
                        vehiculo.activo !== false,

                    estado:
                        vehiculo.estado ||
                        "EN_RUTA"

                };

            }
        );


    /* ========================================================
       PUNTOS DE RECOGIDA
    ======================================================== */

    var puntosOrigen =
        Array.isArray(datos.puntos)
            ? datos.puntos
            : [];


    var puntos =
        puntosOrigen.map(
            function(
                punto,
                indice
            ) {

                var id =
                    punto.id_punto !== undefined
                        ? String(
                            punto.id_punto
                        )
                        : punto.id !== undefined
                            ? String(
                                punto.id
                            )
                            : "PR" +
                              String(
                                  indice + 1
                              ).padStart(
                                  3,
                                  "0"
                              );


                return {

                    id_punto:
                        id,

                    id:
                        id,

                    nombre:
                        punto.nombre ||
                        punto.nombre_punto ||
                        "Punto colaborador",

                    tipo:
                        punto.tipo ||
                        "OTRO",

                    municipio:
                        punto.municipio ||
                        "",

                    latitud:
                        Number(
                            punto.latitud !== undefined
                                ? punto.latitud
                                : punto.lat
                        ),

                    longitud:
                        Number(
                            punto.longitud !== undefined
                                ? punto.longitud
                                : punto.lng !== undefined
                                    ? punto.lng
                                    : punto.lon
                        ),

                    activo:
                        punto.activo !== false

                };

            }
        );


    /* ========================================================
       AVISOS
    ======================================================== */

    var avisosOrigen =
        Array.isArray(datos.avisos)
            ? datos.avisos
            : [];


    var avisos =
        avisosOrigen.map(
            function(
                aviso,
                indice
            ) {

                var id =
                    aviso.id_aviso !== undefined
                        ? String(
                            aviso.id_aviso
                        )
                        : aviso.id !== undefined
                            ? String(
                                aviso.id
                            )
                            : "AV" +
                              String(
                                  indice + 1
                              ).padStart(
                                  3,
                                  "0"
                              );


                return {

                    id_aviso:
                        id,

                    id:
                        id,

                    puntoId:
                        aviso.puntoId ||
                        aviso.id_punto ||
                        "",

                    punto:
                        aviso.punto ||
                        aviso.nombre_punto ||
                        "",

                    especie:
                        aviso.especie ||
                        aviso.especie_reportada ||
                        "Especie no determinada",

                    especie_reportada:
                        aviso.especie_reportada ||
                        aviso.especie ||
                        "Especie no determinada",

                    cantidad:
                        aviso.cantidad !== undefined
                            ? Number(
                                aviso.cantidad
                            )
                            : 1,

                    telefono:
                        aviso.telefono ||
                        "",

                    observaciones:
                        aviso.observaciones ||
                        "",

                    ruta:
                        aviso.ruta ||
                        aviso.ruta_id ||
                        "",

                    ruta_id:
                        aviso.ruta_id ||
                        aviso.ruta ||
                        "",

                    vehiculo:
                        aviso.vehiculo ||
                        aviso.vehiculo_id ||
                        "",

                    vehiculo_id:
                        aviso.vehiculo_id ||
                        aviso.vehiculo ||
                        "",

                    estado:
                        aviso.estado ||
                        "PENDIENTE",

                    latitud:
                        Number(
                            aviso.latitud !== undefined
                                ? aviso.latitud
                                : aviso.lat
                        ),

                    longitud:
                        Number(
                            aviso.longitud !== undefined
                                ? aviso.longitud
                                : aviso.lng !== undefined
                                    ? aviso.lng
                                    : aviso.lon
                        )

                };

            }
        );


    /* ========================================================
       POSICIONES GPS
    ======================================================== */

    var posicionesOrigen =
        datos.posiciones &&
        typeof datos.posiciones === "object"
            ? datos.posiciones
            : {};


    var posiciones =
        Object.keys(
            posicionesOrigen
        ).map(
            function(
                idVehiculo
            ) {

                var posicion =
                    posicionesOrigen[
                        idVehiculo
                    ];


                return {

                    id_vehiculo:
                        String(
                            posicion.vehiculo ||
                            posicion.id_vehiculo ||
                            idVehiculo
                        ),

                    vehiculo_id:
                        String(
                            posicion.vehiculo ||
                            posicion.id_vehiculo ||
                            idVehiculo
                        ),

                    tablet:
                        posicion.tablet ||
                        "",

                    latitud:
                        Number(
                            posicion.latitud !== undefined
                                ? posicion.latitud
                                : posicion.lat
                        ),

                    longitud:
                        Number(
                            posicion.longitud !== undefined
                                ? posicion.longitud
                                : posicion.lng !== undefined
                                    ? posicion.lng
                                    : posicion.lon
                        ),

                    precision:
                        Number(
                            posicion.precision !== undefined
                                ? posicion.precision
                                : 0
                        ),

                    ultimaActualizacion:
                        posicion.ultimaActualizacion ||
                        null

                };

            }
        );


    /* ========================================================
       RUTAS
    ======================================================== */

    var rutasOrigen =
        Array.isArray(datos.rutas)
            ? datos.rutas
            : [];


    var rutas =
        rutasOrigen.map(
            function(ruta) {

                var id =
                    ruta.id_ruta ||
                    ruta.ruta_id ||
                    ruta.id ||
                    "";


                return {

                    ruta_id:
                        String(
                            id
                        ).toUpperCase(),

                    id:
                        String(
                            id
                        ).toUpperCase(),

                    nombre:
                        ruta.nombre ||
                        ruta.nombre_ruta ||
                        "",

                    color:
                        ruta.color ||
                        ""

                };

            }
        );


    /* ========================================================
       PLANIFICACIÓN
    ======================================================== */

    var planificacionOrigen =
        Array.isArray(datos.planificacion)
            ? datos.planificacion
            : [];


    var planificacion =
        planificacionOrigen.map(
            function(
                item,
                indice
            ) {

                return {

                    vehiculo_id:
                        item.vehiculo_id ||
                        item.vehiculo ||
                        "V" +
                        (
                            indice + 1
                        ),

                    ruta_id:
                        item.ruta_id ||
                        item.rutaActiva ||
                        item.ruta ||
                        "R" +
                        (
                            indice + 1
                        ),

                    descripcion:
                        item.descripcion ||
                        (
                            item.rutaNombre
                                ? "Ruta " +
                                  item.rutaNombre
                                : "Ruta planificada para la jornada"
                        ),

                    horaSalida:
                        item.horaSalida ||
                        "",

                    horaEstimadaRegreso:
                        item.horaEstimadaRegreso ||
                        "",

                    paradas:
                        Array.isArray(
                            item.paradas
                        )
                            ? item.paradas
                            : []

                };

            }
        );


    /* ========================================================
       RESULTADO NORMALIZADO
    ======================================================== */

    return {

        FECHA_SERVIDOR:
            validarFechaServidor(datos.fecha),

        VEHICULOS:
            vehiculos,

        PUNTOS_RECOGIDA:
            puntos,

        AVISOS:
            avisos,

        POSICIONES:
            posiciones,

        RUTAS:
            rutas,

        PLANIFICACION:
            planificacion,

        TABLETS:
            Array.isArray(
                datos.tablets
            )
                ? datos.tablets
                : [],

        ASIGNACIONES_RUTA:
            Array.isArray(
                datos.asignacionesRuta
            )
                ? datos.asignacionesRuta
                : []

    };

}


/* ============================================================
NAVEGACIÓN
============================================================ */

function configurarNavegacion() {

    var elementos =
        document.querySelectorAll(
            ".nav-item"
        );


    elementos.forEach(
        function(item) {

            item.addEventListener(
                "click",
                function() {

                    elementos.forEach(
                        function(elemento) {

                            elemento.classList.remove(
                                "active"
                            );

                        }
                    );


                    item.classList.add(
                        "active"
                    );


                    manejarCambioSeccion(
                        item.dataset.section
                    );

                }
            );

        }
    );

}


/* ============================================================
CAMBIO DE SECCIÓN
============================================================ */

function manejarCambioSeccion(
    seccion
) {

    var mensajes = {

        inicio:
            "Vista general de la operación.",

        planificacion:
            "Planificación diaria de vehículos y avisos.",

        avisos:
            "Gestión de avisos de recogida.",

        vehiculos:
            "Estado y seguimiento de vehículos.",

        puntos:
            "Gestión de puntos colaboradores.",

        rutas:
            "Configuración de rutas y zonas.",

        historial:
            "Historial de recogidas.",

        estadisticas:
            "Estadísticas operativas.",

        ajustes:
            "Configuración del sistema."

    };


    mostrarVista(
        seccion
    );


    actualizarEstadoMapa(
        mensajes[seccion] ||
        "Sección seleccionada."
    );

}


/* ============================================================
CAMBIO REAL DE VISTA
============================================================ */

function mostrarVista(
    seccion
) {

    var vistaInicio =
        document.getElementById(
            "vista-inicio"
        );


    var vistaPlanificacion =
        document.getElementById(
            "vista-planificacion"
        );


    var vistaPlaceholder =
        document.getElementById(
            "vista-placeholder"
        );


    /* --------------------------------------------
       Ocultar todas las vistas
    -------------------------------------------- */

    if (vistaInicio) {

        vistaInicio.style.display =
            "none";

    }


    if (vistaPlanificacion) {

        vistaPlanificacion.style.display =
            "none";

    }


    if (vistaPlaceholder) {

        vistaPlaceholder.style.display =
            "none";

    }


    /* --------------------------------------------
       INICIO
    -------------------------------------------- */

    if (
        seccion ===
        "inicio"
    ) {

        if (vistaInicio) {

            vistaInicio.style.display =
                "";

        }

        return;

    }


    /* --------------------------------------------
       PLANIFICACIÓN
    -------------------------------------------- */

    if (
        seccion ===
        "planificacion"
    ) {

        if (vistaPlanificacion) {

            vistaPlanificacion.style.display =
                "";

        }


        actualizarFechaPlanificacion();


        if (
            typeof renderizarPlanificacion ===
            "function"
        ) {

            renderizarPlanificacion();

        }


        if (
            typeof actualizarZonaBorrado ===
                "function"
        ) {

            actualizarZonaBorrado();

        }


        return;

    }


    /* --------------------------------------------
       RESTO DE SECCIONES
    -------------------------------------------- */

    if (vistaPlaceholder) {

        vistaPlaceholder.style.display =
            "";

    }


    configurarPlaceholder(
        seccion
    );

}


/* ============================================================
PLACEHOLDER DE SECCIONES FUTURAS
============================================================ */

function configurarPlaceholder(
    seccion
) {

    var titulos = {

        avisos:
            "Avisos de recogida",

        vehiculos:
            "Vehículos",

        puntos:
            "Puntos colaboradores",

        rutas:
            "Rutas y zonas",

        historial:
            "Historial",

        estadisticas:
            "Estadísticas",

        ajustes:
            "Ajustes"

    };


    var descripciones = {

        avisos:
            "Aquí se gestionarán los avisos de recogida, su estado y su asignación a vehículos.",

        vehiculos:
            "Aquí se mostrará el estado detallado de los vehículos, tablets y posiciones GPS.",

        puntos:
            "Aquí se gestionarán los puntos colaboradores permanentes y sus datos.",

        rutas:
            "Aquí se configurarán las rutas habituales, zonas de trabajo y parámetros de planificación.",

        historial:
            "Aquí se consultará el historial de avisos y recogidas realizadas.",

        estadisticas:
            "Aquí se mostrarán indicadores y estadísticas de funcionamiento del servicio.",

        ajustes:
            "Aquí se configurarán los parámetros generales del sistema."

    };


    var titulo =
        document.getElementById(
            "placeholder-titulo"
        );


    var descripcion =
        document.getElementById(
            "placeholder-descripcion"
        );


    if (titulo) {

        titulo.textContent =
            titulos[seccion] ||
            "Sección";

    }


    if (descripcion) {

        descripcion.textContent =
            descripciones[seccion] ||
            "Esta sección estará disponible en una fase posterior.";

    }

}


/* ============================================================
FECHA DE PLANIFICACIÓN
============================================================ */

/*
 * FASE 3F.6.6-B2 · formatea YYYY-MM-DD validado a fecha larga
 * local solo para presentación. No se usa para decidir envíos.
 */
function formatearFechaLargaServidor(valor) {

    var partes =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor || "");


    if (!partes) {

        return "";
    }


    var fecha =
        new Date(
            Number(partes[1]),
            Number(partes[2]) - 1,
            Number(partes[3])
        );

    var texto =
        fecha.toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    return (
        texto.charAt(0).toUpperCase() +
        texto.slice(1)
    );
}


function actualizarFechaPlanificacion() {

    var elemento =
        document.getElementById(
            "fecha-planificacion"
        );


    if (!elemento) return;


    var info = null;

    try {

        if (
            typeof obtenerInfoDiaPlanificacion ===
                "function"
        ) {

            info =
                obtenerInfoDiaPlanificacion();
        }

    } catch (error) {

        info = null;
    }


    var texto = "";


    if (
        info &&
        info.pausa
    ) {

        texto =
            "Plan del " + info.pausa.fechaPlan +
            " · hoy " + info.pausa.fechaNueva +
            " — en pausa";

    } else if (
        info &&
        info.fechaServidor
    ) {

        texto =
            formatearFechaLargaServidor(
                info.fechaServidor
            ) ||
            "Fecha desconocida — guardado bloqueado";

    } else {

        texto =
            "Fecha desconocida — guardado bloqueado";
    }


    elemento.textContent = texto;

}


/* ============================================================
ESTADO MAPA
============================================================ */

function actualizarEstadoMapa(
    texto
) {

    var elemento =
        document.getElementById(
            "map-status-text"
        );


    if (!elemento) return;


    elemento.textContent =
        texto;


    window.clearTimeout(
        window._estadoMapaTimeout
    );


    window._estadoMapaTimeout =
        window.setTimeout(
            function() {

                elemento.textContent =
                    "GPS operativo · posiciones simuladas";

            },
            2500
        );

}


/* ============================================================
RELOJ
============================================================ */

function iniciarReloj() {

    actualizarReloj();


    window.setInterval(
        actualizarReloj,
        1000
    );

}


function actualizarReloj() {

    var reloj =
        document.getElementById(
            "reloj"
        );


    if (!reloj) return;


    var ahora =
        new Date();


    reloj.textContent =
        ahora.toLocaleTimeString(
            "es-ES",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    /*
     * FASE 3F.6.6-B2 · detección del cambio de día en cada
     * tick. evaluarCambioDia es barata e idempotente y solo
     * actúa en transiciones (pausa, recarga limpia o aviso).
     */
    try {

        if (
            typeof evaluarCambioDia === "function"
        ) {

            evaluarCambioDia();
        }

    } catch (error) {
        /* el reloj nunca se interrumpe por el diagnóstico */
    }

}


/* ============================================================
ACTUALIZACIÓN
============================================================ */

function actualizarHoraActualizacion() {

    var elemento =
        document.getElementById(
            "ultima-actualizacion"
        );


    if (!elemento) return;


    elemento.textContent =
        "Datos actualizados · modo demostración";

}


/* ============================================================
SIMULACIÓN GPS
============================================================ */

function iniciarSimulacionGPS() {

    if (
        typeof actualizarPosicionVehiculo !==
        "function"
    ) {

        console.warn(
            "No se puede iniciar la simulación GPS."
        );

        return;

    }


    var velocidades = {

        V1: {
            lat: 0.00020,
            lng: 0.00030
        },

        V2: {
            lat: 0.00014,
            lng: -0.00024
        },

        V3: {
            lat: -0.00017,
            lng: 0.00022
        }

    };


    var sentido = {

        V1: 1,

        V2: 1,

        V3: 1

    };


    window.setInterval(
        function() {

            if (
                typeof window.POSICIONES_VEHICULOS !==
                "object"
            ) {

                return;

            }


            Object.keys(
                window.POSICIONES_VEHICULOS
            ).forEach(
                function(id) {

                    var posicion =
                        window.POSICIONES_VEHICULOS[
                            id
                        ];


                    if (!posicion) {

                        return;

                    }


                    var velocidad =
                        velocidades[id] ||
                        {
                            lat: 0.00012,
                            lng: 0.00012
                        };


                    posicion.lat +=
                        velocidad.lat *
                        sentido[id];


                    posicion.lng +=
                        velocidad.lng *
                        sentido[id];


                    if (
                        posicion.lat > 39.80 ||
                        posicion.lat < 39.10
                    ) {

                        sentido[id] *=
                            -1;

                    }


                    if (
                        posicion.lng > -0.15 ||
                        posicion.lng < -0.75
                    ) {

                        sentido[id] *=
                            -1;

                    }


                    actualizarPosicionVehiculo(
                        id,
                        posicion.lat,
                        posicion.lng
                    );

                }
            );

        },
        5000
    );

}


/* ============================================================
ACCIONES
============================================================ */

function configurarBotonesAcciones() {

    var confirmar =
        document.getElementById(
            "accion-confirmar"
        );


    if (confirmar) {

        confirmar.addEventListener(
            "click",
            function() {

                alert(
                    "La confirmación de rutas se implementará cuando conectemos la planificación real."
                );

            }
        );

    }


    var aviso =
        document.getElementById(
            "accion-aviso"
        );


    if (aviso) {

        aviso.addEventListener(
            "click",
            function() {

                alert(
                    "El formulario de nuevo aviso se implementará en la siguiente fase."
                );

            }
        );

    }


    var recalcular =
        document.getElementById(
            "accion-recalcular"
        );


    if (recalcular) {

        recalcular.addEventListener(
            "click",
            function() {

                if (
                    typeof dibujarRutas ===
                    "function"
                ) {

                    dibujarRutas();

                }


                actualizarEstadoMapa(
                    "Planificación recalculada · modo demostración"
                );

            }
        );

    }


    var exportar =
        document.getElementById(
            "accion-exportar"
        );


    if (exportar) {

        exportar.addEventListener(
            "click",
            function() {

                window.print();

            }
        );

    }


    var refresh =
        document.getElementById(
            "btn-refresh"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            function() {

                refrescarVehiculos();

                renderizarAvisos();

                renderizarPlanificacion();

                actualizarHoraActualizacion();

            }
        );

    }

}


/* ============================================================
ERROR
============================================================ */

function mostrarErrorAplicacion(
    error
) {

    console.error(
        "Detalle del error:",
        error
    );


    var mensaje =
        document.createElement(
            "div"
        );


    mensaje.style.position =
        "fixed";

    mensaje.style.left =
        "20px";

    mensaje.style.right =
        "20px";

    mensaje.style.bottom =
        "20px";

    mensaje.style.zIndex =
        "99999";

    mensaje.style.padding =
        "15px";

    mensaje.style.background =
        "#b71c1c";

    mensaje.style.color =
        "white";

    mensaje.style.borderRadius =
        "8px";

    mensaje.style.fontFamily =
        "system-ui";


    mensaje.innerHTML =
        "<strong>" +
        "Error iniciando el dashboard." +
        "</strong><br>" +
        "<small>" +
        "Revisa la consola del navegador (F12)." +
        "</small>";


    document.body.appendChild(
        mensaje
    );

}


/* ============================================================
PANELES REDIMENSIONABLES · FASE 1
------------------------------------------------------------
Solo anchos laterales (.workspace en grid de 3 columnas).
Sin persistencia, sin separador horizontal.
Activo unicamente con (min-width: 1151px).
============================================================ */

var REDIMENSION_MIN_IZQ = 180;
var REDIMENSION_MAX_IZQ = 420;
var REDIMENSION_MIN_DER = 220;
var REDIMENSION_MAX_DER = 420;
var REDIMENSION_MIN_MAPA = 320;

var redimensionConfigurada = false;
var redimensionMedia = null;
var redimensionArrastre = null;
var redimensionRafPendiente = false;


function redimensionPermitida() {

    return typeof window.matchMedia === "function" &&
        window.matchMedia("(min-width: 1151px)").matches;
}


function obtenerWorkspace() {

    return document.querySelector(".workspace");
}


function configurarPanelesRedimensionables() {

    if (redimensionConfigurada) {
        return;
    }

    redimensionConfigurada = true;


    sincronizarAsiderosRedimension();


    if (typeof window.matchMedia === "function") {

        redimensionMedia =
            window.matchMedia("(min-width: 1151px)");

        if (typeof redimensionMedia.addEventListener === "function") {

            redimensionMedia.addEventListener(
                "change",
                sincronizarAsiderosRedimension
            );

        } else if (typeof redimensionMedia.addListener === "function") {

            redimensionMedia.addListener(
                sincronizarAsiderosRedimension
            );
        }
    }


    window.addEventListener(
        "resize",
        colocarAsiderosRedimension
    );


        /* --------------------------------------------
           FASE 2 · asidero horizontal
        -------------------------------------------- */

        if (
            typeof configurarAsideroHorizontal ===
            "function"
        ) {
            configurarAsideroHorizontal();
        }
}


function sincronizarAsiderosRedimension() {

    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var existentes =
        workspace.querySelectorAll(
            ".resize-handle-vertical"
        );


    if (!redimensionPermitida()) {

        workspace.style.gridTemplateColumns = "";

        existentes.forEach(function (asidero) {
            asidero.remove();
        });

        return;
    }


    if (existentes.length !== 2) {

        existentes.forEach(function (asidero) {
            asidero.remove();
        });

        crearAsideroRedimension(
            workspace,
            "izq"
        );

        crearAsideroRedimension(
            workspace,
            "der"
        );
    }


    colocarAsiderosRedimension();

    aplicarAnchosGuardados();
}


function crearAsideroRedimension(
    workspace,
    lado
) {

    var asidero =
        document.createElement("div");

    asidero.className =
        "resize-handle resize-handle-vertical";

    asidero.setAttribute(
        "data-lado",
        lado
    );


    asidero.addEventListener(
        "pointerdown",
        function (evento) {
            iniciarArrastreRedimension(
                evento,
                lado
            );
        }
    );


    workspace.appendChild(
        asidero
    );
}


function colocarAsiderosRedimension() {

    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var asideros =
        workspace.querySelectorAll(
            ".resize-handle-vertical"
        );

    if (!asideros.length) {
        return;
    }


    var panelIzq =
        workspace.querySelector(".left-panel");

    var panelDer =
        workspace.querySelector(".right-panel");

    if (!panelIzq || !panelDer) {
        return;
    }


    asideros.forEach(function (asidero) {

        if (
            asidero.getAttribute("data-lado") ===
            "izq"
        ) {
            asidero.style.left =
                panelIzq.offsetWidth + "px";
        } else {
            asidero.style.left =
                (workspace.clientWidth - panelDer.offsetWidth) +
                "px";
        }
    });
}


function limitarAnchoRedimension(
    valor,
    minimo,
    maximo
) {

    if (valor < minimo) {
        return minimo;
    }

    if (valor > maximo) {
        return maximo;
    }

    return Math.round(valor);
}


function iniciarArrastreRedimension(
    evento,
    lado
) {

    if (!redimensionPermitida()) {
        return;
    }


    if (redimensionArrastreH) {
        return;
    }


    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var panelIzq =
        workspace.querySelector(".left-panel");

    var panelDer =
        workspace.querySelector(".right-panel");

    if (!panelIzq || !panelDer) {
        return;
    }


    evento.preventDefault();
    evento.stopPropagation();


    redimensionArrastre = {
        lado: lado,
        inicioX: evento.clientX,
        anchoIzq: panelIzq.offsetWidth,
        anchoDer: panelDer.offsetWidth,
        asidero: evento.currentTarget
    };


    try {
        evento.currentTarget.setPointerCapture(
            evento.pointerId
        );
    } catch (error) { }


    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    evento.currentTarget.classList.add(
        "activo"
    );


    window.addEventListener(
        "pointermove",
        moverArrastreRedimension
    );

    window.addEventListener(
        "pointerup",
        terminarArrastreRedimension
    );

    window.addEventListener(
        "pointercancel",
        terminarArrastreRedimension
    );
}


function moverArrastreRedimension(
    evento
) {

    if (!redimensionArrastre) {
        return;
    }


    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var anchoWorkspace = workspace.clientWidth;

    var desplazamiento =
        evento.clientX -
        redimensionArrastre.inicioX;


    var anchoIzq = redimensionArrastre.anchoIzq;
    var anchoDer = redimensionArrastre.anchoDer;


    if (redimensionArrastre.lado === "izq") {

        var maxIzq = Math.min(
            REDIMENSION_MAX_IZQ,
            anchoWorkspace -
                anchoDer -
                REDIMENSION_MIN_MAPA
        );

        anchoIzq = limitarAnchoRedimension(
            redimensionArrastre.anchoIzq +
                desplazamiento,
            REDIMENSION_MIN_IZQ,
            Math.max(
                REDIMENSION_MIN_IZQ,
                maxIzq
            )
        );

    } else {

        var maxDer = Math.min(
            REDIMENSION_MAX_DER,
            anchoWorkspace -
                anchoIzq -
                REDIMENSION_MIN_MAPA
        );

        anchoDer = limitarAnchoRedimension(
            redimensionArrastre.anchoDer -
                desplazamiento,
            REDIMENSION_MIN_DER,
            Math.max(
                REDIMENSION_MIN_DER,
                maxDer
            )
        );
    }


    workspace.style.gridTemplateColumns =
        anchoIzq +
        "px minmax(0, 1fr) " +
        anchoDer +
        "px";


    colocarAsiderosRedimension();

    programarInvalidateSize();
}


function terminarArrastreRedimension() {

    window.removeEventListener(
        "pointermove",
        moverArrastreRedimension
    );

    window.removeEventListener(
        "pointerup",
        terminarArrastreRedimension
    );

    window.removeEventListener(
        "pointercancel",
        terminarArrastreRedimension
    );


    if (
        redimensionArrastre &&
        redimensionArrastre.asidero
    ) {
        redimensionArrastre.asidero.classList.remove(
            "activo"
        );
    }

    redimensionArrastre = null;

    document.body.style.userSelect = "";
    document.body.style.cursor = "";


    colocarAsiderosRedimension();
    programarInvalidateSize();

    guardarAnchosRedimension();
}


function programarInvalidateSize() {

    if (redimensionRafPendiente) {
        return;
    }

    redimensionRafPendiente = true;


    var ejecutar = function () {

        redimensionRafPendiente = false;

        if (
            typeof mapa !== "undefined" &&
            mapa &&
            typeof mapa.invalidateSize ===
                "function"
        ) {
            mapa.invalidateSize();
        }
    };


    if (
        typeof window.requestAnimationFrame ===
        "function"
    ) {
        window.requestAnimationFrame(ejecutar);
    } else {
        ejecutar();
    }
}


/* ============================================================
PANELES REDIMENSIONABLES · FASE 2
------------------------------------------------------------
Asidero horizontal (.workspace frente a .dashboard-lower).
Sin persistencia, sin boton de reset.
Activo unicamente con (min-width: 901px).
============================================================ */

var REDIMENSION_MIN_ALTURA_WORKSPACE = 560;
var REDIMENSION_MIN_ZONA_INFERIOR = 320;
var REDIMENSION_MARGEN_ALTURA = 448;

var redimensionHorizontalConfigurado = false;
var redimensionMediaHorizontal = null;
var redimensionArrastreH = null;


function redimensionHorizontalPermitida() {

    return typeof window.matchMedia === "function" &&
        window.matchMedia("(min-width: 901px)").matches;
}


function configurarAsideroHorizontal() {

    if (redimensionHorizontalConfigurado) {
        return;
    }

    redimensionHorizontalConfigurado = true;


    sincronizarAsideroHorizontal();


    if (typeof window.matchMedia === "function") {

        redimensionMediaHorizontal =
            window.matchMedia("(min-width: 901px)");

        if (typeof redimensionMediaHorizontal.addEventListener === "function") {

            redimensionMediaHorizontal.addEventListener(
                "change",
                sincronizarAsideroHorizontal
            );

        } else if (typeof redimensionMediaHorizontal.addListener === "function") {

            redimensionMediaHorizontal.addListener(
                sincronizarAsideroHorizontal
            );
        }
    }
}


function sincronizarAsideroHorizontal() {

    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var existentes =
        workspace.querySelectorAll(
            ".resize-handle-horizontal"
        );


    if (!redimensionHorizontalPermitida()) {

        workspace.style.height = "";

        existentes.forEach(function (asidero) {
            asidero.remove();
        });

        return;
    }


    if (existentes.length !== 1) {

        existentes.forEach(function (asidero) {
            asidero.remove();
        });

        crearAsideroHorizontal(
            workspace
        );
    }


    aplicarAlturaGuardada();
}


function crearAsideroHorizontal(
    workspace
) {

    var asidero =
        document.createElement("div");

    asidero.className =
        "resize-handle resize-handle-horizontal";

    asidero.setAttribute(
        "data-lado",
        "horizontal"
    );


    asidero.addEventListener(
        "pointerdown",
        iniciarArrastreHorizontal
    );


    workspace.appendChild(
        asidero
    );
}


function limitarAlturaWorkspace(
    valor
) {

    var maximo =
        window.innerHeight -
        REDIMENSION_MARGEN_ALTURA;


    if (valor < REDIMENSION_MIN_ALTURA_WORKSPACE) {
        return REDIMENSION_MIN_ALTURA_WORKSPACE;
    }

    if (
        maximo >= REDIMENSION_MIN_ALTURA_WORKSPACE &&
        valor > maximo
    ) {
        return maximo;
    }

    return Math.round(valor);
}


function iniciarArrastreHorizontal(
    evento
) {

    if (!redimensionHorizontalPermitida()) {
        return;
    }


    if (redimensionArrastre) {
        return;
    }


    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    evento.preventDefault();
    evento.stopPropagation();


    redimensionArrastreH = {
        inicioY: evento.clientY,
        alturaInicial: workspace.offsetHeight,
        asidero: evento.currentTarget
    };


    try {
        evento.currentTarget.setPointerCapture(
            evento.pointerId
        );
    } catch (error) { }


    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
    document.body.style.overflowAnchor = "none";

    evento.currentTarget.classList.add(
        "activo"
    );
    window.addEventListener(
        "pointermove",
        moverArrastreHorizontal
    );

    window.addEventListener(
        "pointerup",
        terminarArrastreHorizontal
    );

    window.addEventListener(
        "pointercancel",
        terminarArrastreHorizontal
    );
}


function moverArrastreHorizontal(
    evento
) {

    if (!redimensionArrastreH) {
        return;
    }


    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var desplazamiento =
        evento.clientY -
        redimensionArrastreH.inicioY;


    workspace.style.height =
        limitarAlturaWorkspace(
            redimensionArrastreH.alturaInicial +
                desplazamiento
        ) + "px";


    programarInvalidateSize();
}


function terminarArrastreHorizontal() {

    window.removeEventListener(
        "pointermove",
        moverArrastreHorizontal
    );

    window.removeEventListener(
        "pointerup",
        terminarArrastreHorizontal
    );

    window.removeEventListener(
        "pointercancel",
        terminarArrastreHorizontal
    );


    if (
        redimensionArrastreH &&
        redimensionArrastreH.asidero
    ) {
        redimensionArrastreH.asidero.classList.remove(
            "activo"
        );
    }

    redimensionArrastreH = null;

    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.body.style.overflowAnchor = "";


    programarInvalidateSize();

    guardarAlturaRedimension();
}


/* ============================================================
PANELES REDIMENSIONABLES · FASE 3
------------------------------------------------------------
Persistencia en localStorage y restauracion de la
distribucion original. Sin cambios en Fase 1 ni Fase 2.
============================================================ */

var DISTRIBUCION_CLAVE = "crf-distribucion-v1";

var restauracionConfigurada = false;


function leerDistribucionGuardada() {

    var texto = null;

    try {
        texto =
            window.localStorage.getItem(
                DISTRIBUCION_CLAVE
            );
    } catch (error) {
        return null;
    }


    if (!texto) {
        return null;
    }


    var datos = null;

    try {
        datos = JSON.parse(texto);
    } catch (error) {
        return null;
    }


    if (
        !datos ||
        typeof datos !== "object" ||
        datos.v !== 1
    ) {
        return null;
    }


    var resultado = { v: 1 };


    if (
        typeof datos.left === "number" &&
        isFinite(datos.left)
    ) {
        resultado.left = datos.left;
    }

    if (
        typeof datos.right === "number" &&
        isFinite(datos.right)
    ) {
        resultado.right = datos.right;
    }

    if (
        typeof datos.wsHeight === "number" &&
        isFinite(datos.wsHeight)
    ) {
        resultado.wsHeight = datos.wsHeight;
    }


    if (
        resultado.left === undefined &&
        resultado.right === undefined &&
        resultado.wsHeight === undefined
    ) {
        return null;
    }


    return resultado;
}


function guardarDistribucion(
    parcial
) {

    var actual =
        leerDistribucionGuardada() || { v: 1 };


    if (
        parcial &&
        typeof parcial.left === "number" &&
        isFinite(parcial.left)
    ) {
        actual.left = parcial.left;
    }

    if (
        parcial &&
        typeof parcial.right === "number" &&
        isFinite(parcial.right)
    ) {
        actual.right = parcial.right;
    }

    if (
        parcial &&
        typeof parcial.wsHeight === "number" &&
        isFinite(parcial.wsHeight)
    ) {
        actual.wsHeight = parcial.wsHeight;
    }

    actual.v = 1;


    try {
        window.localStorage.setItem(
            DISTRIBUCION_CLAVE,
            JSON.stringify(actual)
        );
    } catch (error) { }
}


function guardarAnchosRedimension() {

    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var texto =
        workspace.style.gridTemplateColumns ||
        "";

    var coincidencia =
        texto.match(
            /^\s*(\d+(?:\.\d+)?)px\s+minmax\([^)]*\)\s+(\d+(?:\.\d+)?)px\s*$/
        );

    if (!coincidencia) {
        return;
    }


    var izquierdo =
        Math.round(
            parseFloat(coincidencia[1])
        );

    var derecho =
        Math.round(
            parseFloat(coincidencia[2])
        );


    if (
        izquierdo < REDIMENSION_MIN_IZQ ||
        izquierdo > REDIMENSION_MAX_IZQ ||
        derecho < REDIMENSION_MIN_DER ||
        derecho > REDIMENSION_MAX_DER
    ) {
        return;
    }


    if (
        izquierdo + derecho + REDIMENSION_MIN_MAPA >
        workspace.clientWidth
    ) {
        return;
    }


    guardarDistribucion({
        left: izquierdo,
        right: derecho
    });
}


function guardarAlturaRedimension() {

    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var altura =
        Math.round(
            parseFloat(
                workspace.style.height ||
                ""
            )
        );


    if (!isFinite(altura)) {
        return;
    }

    if (altura < REDIMENSION_MIN_ALTURA_WORKSPACE) {
        return;
    }


    guardarDistribucion({
        wsHeight: altura
    });
}


function aplicarAnchosGuardados() {

    if (!redimensionPermitida()) {
        return;
    }


    var guardada = leerDistribucionGuardada();

    if (
        !guardada ||
        guardada.left === undefined ||
        guardada.right === undefined
    ) {
        return;
    }


    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var izquierdo = Math.round(guardada.left);
    var derecho = Math.round(guardada.right);


    if (
        izquierdo < REDIMENSION_MIN_IZQ ||
        izquierdo > REDIMENSION_MAX_IZQ ||
        derecho < REDIMENSION_MIN_DER ||
        derecho > REDIMENSION_MAX_DER
    ) {
        return;
    }


    if (
        izquierdo + derecho + REDIMENSION_MIN_MAPA >
        workspace.clientWidth
    ) {
        return;
    }


    workspace.style.gridTemplateColumns =
        izquierdo +
        "px minmax(0, 1fr) " +
        derecho +
        "px";


    colocarAsiderosRedimension();
    programarInvalidateSize();
}


function aplicarAlturaGuardada() {

    if (!redimensionHorizontalPermitida()) {
        return;
    }


    var guardada = leerDistribucionGuardada();

    if (
        !guardada ||
        guardada.wsHeight === undefined
    ) {
        return;
    }


    var workspace = obtenerWorkspace();

    if (!workspace) {
        return;
    }


    var altura =
        limitarAlturaWorkspace(
            Math.round(guardada.wsHeight)
        );


    if (altura < REDIMENSION_MIN_ALTURA_WORKSPACE) {
        return;
    }


    workspace.style.height =
        altura + "px";


    programarInvalidateSize();
}


function restaurarDistribucionOriginal() {

    try {
        window.localStorage.removeItem(
            DISTRIBUCION_CLAVE
        );
    } catch (error) { }


    var workspace = obtenerWorkspace();

    if (workspace) {
        workspace.style.gridTemplateColumns = "";
        workspace.style.height = "";
    }


    sincronizarAsiderosRedimension();
    sincronizarAsideroHorizontal();
    programarInvalidateSize();
}


function configurarRestauracionDistribucion() {

    if (restauracionConfigurada) {
        return;
    }

    restauracionConfigurada = true;


    var boton =
        document.getElementById(
            "btn-distribucion"
        );


    if (!boton) {
        return;
    }


    boton.addEventListener(
        "click",
        function () {
            restaurarDistribucionOriginal();
        }
    );
}



/* ============================================================
BORRADO EXPLÍCITO · FASE 3F.6.7-C2
------------------------------------------------------------
Zona de borrado inyectada dinámicamente en la vista de
planificación (index.html no se modifica). Botón + modal en
dos pasos + resultado persistente (nunca se autolimpia).
============================================================ */

function obtenerVehiculoSeleccionadoApp() {

    try {

        if (
            typeof obtenerPlanSeleccionado ===
                "function"
        ) {

            var plan =
                obtenerPlanSeleccionado();


            if (
                plan &&
                plan.vehiculoId
            ) {

                return String(plan.vehiculoId);
            }
        }

    } catch (error) {
        /* sin vehículo resoluble */
    }


    return "";
}


function obtenerPlanDeVehiculoApp(vehiculoId) {

    try {

        if (
            typeof planificacionDia !== "undefined" &&
            planificacionDia &&
            planificacionDia[vehiculoId]
        ) {

            return planificacionDia[vehiculoId];
        }

    } catch (error) {
        /* sin acceso al plan */
    }


    return null;
}


function nombreVehiculoApp(vehiculoId) {

    try {

        if (
            typeof obtenerNombreVehiculo ===
                "function"
        ) {

            return (
                obtenerNombreVehiculo(vehiculoId) +
                " (" + vehiculoId + ")"
            );
        }

    } catch (error) {
        /* nombre básico */
    }


    return String(vehiculoId);
}


function actualizarZonaBorrado() {

    var vista =
        document.getElementById(
            "vista-planificacion"
        );


    if (!vista) {

        return;
    }


    var zona =
        document.getElementById(
            "zona-borrado"
        );


    if (!zona) {

        zona =
            document.createElement("div");

        zona.id = "zona-borrado";

        vista.appendChild(zona);
    }


    var vehiculoId =
        obtenerVehiculoSeleccionadoApp();

    var plan =
        vehiculoId
            ? obtenerPlanDeVehiculoApp(vehiculoId)
            : null;

    var estado = null;

    try {

        if (
            typeof obtenerEstadoBorrado ===
                "function" &&
            vehiculoId
        ) {

            estado =
                obtenerEstadoBorrado(vehiculoId);
        }

    } catch (error) {

        estado = null;
    }


    var html = "";


    if (
        estado &&
        (
            estado.fase === "solicitado" ||
            estado.fase === "enviado"
        )
    ) {

        html +=
            '<div class="borrado-estado">' +
            "Borrado en curso… " +
            escaparBorrado(
                estado.mensaje ||
                estado.fase
            ) +
            "</div>";

    } else if (
        estado &&
        estado.fase === "confirmado"
    ) {

        html +=
            '<div class="borrado-ok" role="status">' +
            "✓ " +
            escaparBorrado(
                estado.mensaje ||
                "Planificación eliminada."
            );

        if (
            estado.cambiosPosteriores
        ) {

            html +=
                "<br>Hay cambios posteriores sin guardar: " +
                "consérvelos o descártelos explícitamente.";
        }

        html +=
            "</div>" +
            '<div class="borrado-acciones">' +
            '<button type="button" data-accion-borrado="guardar-nuevo">' +
            "Guardar cambios como planificación nueva" +
            "</button> " +
            '<button type="button" data-accion-borrado="descartar-bloqueo">' +
            "Descartar aviso" +
            "</button>" +
            "</div>";

    } else if (
        estado &&
        (
            estado.fase === "error" ||
            estado.fase === "desconocido"
        )
    ) {

        html +=
            '<div class="borrado-error" role="alert">' +
            "⚠ " +
            escaparBorrado(
                estado.mensaje ||
                "Error en el borrado."
            ) +
            "</div>" +
            '<div class="borrado-acciones">' +
            '<button type="button" data-accion-borrado="reintentar">' +
            (
                estado.fase === "desconocido"
                    ? "Reintentar reconciliación"
                    : "Reintentar borrado"
            ) +
            "</button> " +
            '<button type="button" data-accion-borrado="descartar-bloqueo">' +
            "Descartar aviso" +
            "</button>" +
            "</div>";

    } else {

        var puedeBorrar =
            !!plan &&
            !!plan.fecha &&
            !(
                estado &&
                estado.fase !== "ninguno"
            );

        var motivo =
            !vehiculoId
                ? "Seleccione un vehículo para eliminar su planificación."
                : !plan
                    ? "Sin planificación cargada."
                    : !plan.fecha
                        ? "Fecha desconocida: borrado bloqueado."
                        : "";

        html +=
            '<div class="borrado-acciones">' +
            '<button type="button" data-accion-borrado="abrir" ' +
            (puedeBorrar ? "" : "disabled") +
            ">Eliminar planificación del día</button>";

        if (motivo) {

            html +=
                '<div class="borrado-motivo">' +
                escaparBorrado(motivo) +
                "</div>";
        }

        html +=
            "</div>";
    }


    zona.innerHTML = html;


    function alPulsar(accion) {

        if (accion === "abrir") {

            mostrarDialogoBorrado(vehiculoId);

        } else if (accion === "guardar-nuevo") {

            try {

                var hecho =
                    guardarPlanificacionVehiculoSeleccionado();


                Promise.resolve(hecho).then(
                    function() {
                        actualizarZonaBorrado();
                    },
                    function() {
                        actualizarZonaBorrado();
                    }
                );

            } catch (error) {

                actualizarZonaBorrado();
            }

        } else if (accion === "reintentar") {

            if (
                estado &&
                estado.fase === "desconocido"
            ) {

                try {

                    var rec =
                        reconciliarBorrado(vehiculoId);


                    Promise.resolve(rec).then(
                        function() {
                            actualizarZonaBorrado();
                        },
                        function() {
                            actualizarZonaBorrado();
                        }
                    );

                } catch (error) {

                    actualizarZonaBorrado();
                }

            } else {

                mostrarDialogoBorrado(vehiculoId);
            }

        } else if (accion === "descartar-bloqueo") {

            /*
             * FASE 3F.6.7-C4-C · descarte diferenciado: solo
             * los estados sin envío posible se cierran
             * directamente; el resto exige el diálogo
             * reforzado (casilla + acción explícita).
             */
            var evaluacionDescarte = null;

            try {

                if (
                    typeof evaluarDescarteBloqueo ===
                        "function"
                ) {

                    evaluacionDescarte =
                        evaluarDescarteBloqueo(
                            vehiculoId
                        );
                }

            } catch (error) {

                evaluacionDescarte = null;
            }


            if (
                evaluacionDescarte &&
                evaluacionDescarte.ok === true &&
                evaluacionDescarte.requiereConfirmacion === true
            ) {

                try {

                    if (
                        typeof mostrarDialogoDescarteBorrado ===
                            "function"
                    ) {

                        mostrarDialogoDescarteBorrado(
                            vehiculoId
                        );
                    }

                } catch (error) {
                    /* sin diálogo no hay descarte */
                }

            } else {

                try {

                    if (
                        typeof descartarBloqueoBorrado ===
                            "function"
                    ) {

                        descartarBloqueoBorrado(
                            vehiculoId
                        );
                    }

                } catch (error) {
                    /* limpieza explícita: continuar */
                }
            }

            actualizarZonaBorrado();
        }
    }


    var botones =
        zona.querySelectorAll(
            "[data-accion-borrado]"
        );


    for (var i = 0; i < botones.length; i++) {

        (function(boton) {

            boton.addEventListener(
                "click",
                function() {

                    alPulsar(
                        boton.getAttribute(
                            "data-accion-borrado"
                        )
                    );
                }
            );

        })(botones[i]);
    }
}


function escaparBorrado(valor) {

    return String(
        valor === undefined ||
        valor === null
            ? ""
            : valor
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


function mostrarDialogoBorrado(vehiculoId) {

    var plan =
        obtenerPlanDeVehiculoApp(vehiculoId);


    if (
        !plan ||
        !plan.fecha
    ) {

        return;
    }


    cerrarDialogoBorrado();


    var fondo =
        document.createElement("div");

    fondo.id = "dialogo-borrado";

    fondo.setAttribute("role", "dialog");

    fondo.setAttribute("aria-modal", "true");

    fondo.style.cssText =
        "position:fixed;inset:0;z-index:10001;" +
        "background:rgba(0,0,0,0.6);display:flex;" +
        "align-items:center;justify-content:center;padding:16px;";


    var panel =
        document.createElement("div");

    panel.style.cssText =
        "background:#fff;color:#222;max-width:520px;width:100%;" +
        "border-radius:12px;padding:20px 22px;" +
        "font-family:inherit;box-shadow:0 12px 40px rgba(0,0,0,0.4);";


    var titulo =
        document.createElement("h2");

    titulo.textContent = "Eliminar planificación";

    titulo.style.cssText =
        "margin:0 0 8px;font-size:20px;color:#c62828;";


    var cuerpo =
        document.createElement("p");

    cuerpo.textContent =
        "Va a solicitar el borrado DEFINITIVO de la " +
        "planificación del día " + plan.fecha +
        " del vehículo " +
        nombreVehiculoApp(vehiculoId) + ". " +
        "Esta acción elimina las paradas guardadas en el " +
        "servidor y no se puede deshacer automáticamente.";

    cuerpo.style.cssText =
        "margin:0 0 16px;line-height:1.5;";


    function botonBase(texto, estilos) {

        var boton =
            document.createElement("button");

        boton.type = "button";

        boton.textContent = texto;

        boton.style.cssText =
            "display:block;width:100%;margin:8px 0 0;" +
            "padding:10px 12px;border-radius:8px;cursor:pointer;" +
            "font-size:15px;" + estilos;


        return boton;
    }


    var botonContinuar =
        botonBase(
            "Continuar",
            "background:#c62828;color:#fff;border:1px solid #c62828;"
        );

    botonContinuar.addEventListener(
        "click",
        function() {

            mostrarConfirmacionBorrado(
                vehiculoId,
                plan.fecha
            );
        }
    );


    var botonCancelar =
        botonBase(
            "Cancelar",
            "background:#eee;color:#222;border:1px solid #bbb;"
        );

    botonCancelar.addEventListener(
        "click",
        function() {

            cerrarDialogoBorrado();
        }
    );


    fondo.addEventListener(
        "keydown",
        function(evento) {

            if (
                evento &&
                evento.key === "Escape"
            ) {

                cerrarDialogoBorrado();
            }
        }
    );


    panel.appendChild(titulo);

    panel.appendChild(cuerpo);

    panel.appendChild(botonContinuar);

    panel.appendChild(botonCancelar);

    fondo.appendChild(panel);

    document.body.appendChild(fondo);


    try {

        botonCancelar.focus();

    } catch (error) {
        /* foco opcional */
    }
}


function mostrarConfirmacionBorrado(vehiculoId, fecha) {

    cerrarDialogoBorrado();


    var fondo =
        document.createElement("div");

    fondo.id = "dialogo-confirmar-borrado";

    fondo.setAttribute("role", "alertdialog");

    fondo.setAttribute("aria-modal", "true");

    fondo.style.cssText =
        "position:fixed;inset:0;z-index:10002;" +
        "background:rgba(0,0,0,0.65);display:flex;" +
        "align-items:center;justify-content:center;padding:16px;";


    var panel =
        document.createElement("div");

    panel.style.cssText =
        "background:#fff;color:#222;max-width:520px;width:100%;" +
        "border-radius:12px;padding:20px 22px;" +
        "font-family:inherit;box-shadow:0 12px 40px rgba(0,0,0,0.4);";


    var titulo =
        document.createElement("h2");

    titulo.textContent = "Confirmar borrado definitivo";

    titulo.style.cssText =
        "margin:0 0 8px;font-size:20px;color:#c62828;";


    var cuerpo =
        document.createElement("p");

    cuerpo.textContent =
        "Se borrará la planificación del día " + fecha +
        " del vehículo " +
        nombreVehiculoApp(vehiculoId) + ". " +
        "Confirme que ha comprendido que los datos " +
        "guardados se eliminarán.";

    cuerpo.style.cssText =
        "margin:0 0 12px;line-height:1.5;";


    var etiqueta =
        document.createElement("label");

    etiqueta.style.cssText =
        "display:flex;gap:8px;align-items:flex-start;" +
        "margin:0 0 12px;line-height:1.4;cursor:pointer;";


    var casilla =
        document.createElement("input");

    casilla.type = "checkbox";


    var textoCasilla =
        document.createElement("span");

    textoCasilla.textContent =
        "Entiendo que esta acción es definitiva.";


    etiqueta.appendChild(casilla);

    etiqueta.appendChild(textoCasilla);


    var botonConfirmar =
        botonBaseConfirmar("Eliminar definitivamente");

    botonConfirmar.disabled = true;


    casilla.addEventListener(
        "change",
        function() {

            botonConfirmar.disabled = !casilla.checked;
        }
    );

    botonConfirmar.addEventListener(
        "click",
        function() {

            if (!casilla.checked) {

                return;
            }


            cerrarDialogoBorrado();

            ejecutarBorradoConfirmado(vehiculoId);
        }
    );


    var botonVolver =
        botonBaseConfirmar("Volver");

    botonVolver.style.cssText +=
        "background:#eee;color:#222;border:1px solid #bbb;";

    botonVolver.addEventListener(
        "click",
        function() {

            mostrarDialogoBorrado(vehiculoId);
        }
    );


    fondo.addEventListener(
        "keydown",
        function(evento) {

            if (
                evento &&
                evento.key === "Escape"
            ) {

                mostrarDialogoBorrado(vehiculoId);
            }
        }
    );


    function botonBaseConfirmar(texto) {

        var boton =
            document.createElement("button");

        boton.type = "button";

        boton.textContent = texto;

        boton.style.cssText =
            "display:block;width:100%;margin:8px 0 0;" +
            "padding:10px 12px;border-radius:8px;cursor:pointer;" +
            "font-size:15px;background:#c62828;color:#fff;" +
            "border:1px solid #c62828;";


        return boton;
    }


    panel.appendChild(titulo);

    panel.appendChild(cuerpo);

    panel.appendChild(etiqueta);

    panel.appendChild(botonConfirmar);

    panel.appendChild(botonVolver);

    fondo.appendChild(panel);

    document.body.appendChild(fondo);


    try {

        botonVolver.focus();

    } catch (error) {
        /* foco opcional */
    }
}


async function ejecutarBorradoConfirmado(vehiculoId) {

    actualizarZonaBorrado();


    var resultado = null;

    try {

        resultado =
            await solicitarBorradoPlanificacion(
                vehiculoId
            );

    } catch (error) {

        resultado = {
            ok: false,
            error:
                String(
                    (error && error.message) || error
                )
        };
    }


    actualizarZonaBorrado();


    return resultado;
}


function cerrarDialogoBorrado() {

    var ids = [
        "dialogo-borrado",
        "dialogo-confirmar-borrado"
    ];


    for (var i = 0; i < ids.length; i++) {

        var elemento =
            document.getElementById(ids[i]);


        if (
            elemento &&
            elemento.parentNode
        ) {

            elemento.parentNode.removeChild(elemento);
        }
    }
}
