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

function actualizarFechaPlanificacion() {

    var elemento =
        document.getElementById(
            "fecha-planificacion"
        );


    if (!elemento) return;


    var ahora =
        new Date();


    var fecha =
        ahora.toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    elemento.textContent =
        fecha.charAt(0).toUpperCase() +
        fecha.slice(1);

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
