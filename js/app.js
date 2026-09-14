/* ============================================================
   CRF - APLICACIÓN PRINCIPAL
============================================================ */


document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);


function iniciarAplicacion() {

    try {

        configurarNavegacion();

        inicializarMapa();

        renderizarVehiculos();

        renderizarAvisos();

        renderizarLeyendaRutas();

        renderizarPlanificacion();

        configurarBotonesAcciones();

        iniciarReloj();

        actualizarHoraActualizacion();

        iniciarSimulacionGPS();


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


    actualizarEstadoMapa(
        mensajes[seccion] ||
        "Sección seleccionada."
    );
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
                        window.POSICIONES_VEHICULOS[id];


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

                        sentido[id] *= -1;

                    }


                    if (
                        posicion.lng > -0.15 ||
                        posicion.lng < -0.75
                    ) {

                        sentido[id] *= -1;

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

