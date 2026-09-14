```javascript
/* ============================================================
   CRF COORDINACIÓN DE RECOGIDAS
   APLICACIÓN PRINCIPAL · V2
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
            "CRF · Dashboard V2 iniciado correctamente."
        );


    } catch (error) {

        console.error(
            "Error iniciando la aplicación:",
            error
        );

        mostrarErrorAplicacion(error);
    }
}


/* ============================================================
   NAVEGACIÓN
============================================================ */

function configurarNavegacion() {

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".nav-item")
                        .forEach(
                            elemento =>
                                elemento.classList.remove(
                                    "active"
                                )
                        );


                    item.classList.add("active");


                    const seccion =
                        item.dataset.section;


                    manejarCambioSeccion(
                        seccion
                    );
                }
            );

        });
}


/* ============================================================
   CAMBIO DE SECCIÓN
============================================================ */

function manejarCambioSeccion(seccion) {

    console.log(
        "Sección seleccionada:",
        seccion
    );


    /*
     * Por ahora las secciones son parte de la navegación
     * de la maqueta.
     *
     * En la siguiente fase cada una tendrá su propia vista.
     */


    const mensajes = {

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

function actualizarEstadoMapa(texto) {

    const elemento =
        document.getElementById(
            "map-status-text"
        );


    if (!elemento) {
        return;
    }


    /*
     * No sustituimos permanentemente el mensaje GPS:
     * mostramos brevemente el contexto y después volvemos
     * al estado normal.
     */

    const anterior =
        elemento.textContent;


    elemento.textContent =
        texto;


    window.clearTimeout(
        window._estadoMapaTimeout
    );


    window._estadoMapaTimeout =
        window.setTimeout(
            () => {

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

    setInterval(
        actualizarReloj,
        1000
    );
}


function actualizarReloj() {

    const reloj =
        document.getElementById(
            "reloj"
        );


    if (!reloj) {
        return;
    }


    const ahora =
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

    const elemento =
        document.getElementById(
            "ultima-actualizacion"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        "Datos actualizados · modo demostración";
}


/* ============================================================
   SIMULACIÓN GPS
============================================================ */

/*
 * IMPORTANTE:
 *
 * Esta simulación mueve únicamente los marcadores GPS.
 *
 * NO modifica:
 *
 * - R1
 * - R2
 * - R3
 * - puntos colaboradores
 * - avisos
 *
 * Esto reproduce deliberadamente la arquitectura
 * que utilizaremos después con POSICIONES.
 */

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


    const velocidades = {

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


    /*
     * Cada vehículo lleva una pequeña dirección.
     */

    let sentido = {

        V1: 1,
        V2: 1,
        V3: 1

    };


    setInterval(
        () => {

            if (
                typeof window.POSICIONES_VEHICULOS !==
                "object"
            ) {
                return;
            }


            Object.keys(
                window.POSICIONES_VEHICULOS
            ).forEach(id => {

                const posicion =
                    window.POSICIONES_VEHICULOS[id];


                const velocidad =
                    velocidades[id] ||
                    {
                        lat: 0.00012,
                        lng: 0.00012
                    };


                if (!posicion) {
                    return;
                }


                /*
                 * Movimiento pequeño.
                 *
                 * No pretende representar una ruta real.
                 * Solo demuestra que el GPS es independiente
                 * de la ruta planificada.
                 */

                posicion.lat +=
                    velocidad.lat *
                    sentido[id];


                posicion.lng +=
                    velocidad.lng *
                    sentido[id];


                /*
                 * Cuando se aleja demasiado del área
                 * de demostración, invertimos dirección.
                 */

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

            });


        },

        5000
    );
}


/* ============================================================
   BOTONES DE ACCIONES
============================================================ */

function configurarBotonesAcciones() {

    document
        .getElementById("accion-confirmar")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "La confirmación de rutas se implementará cuando conectemos la planificación real."
                );

            }
        );


    document
        .getElementById("accion-aviso")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "El formulario de nuevo aviso se implementará en la siguiente fase."
                );

            }
        );


    document
        .getElementById("accion-recalcular")
        ?.addEventListener(
            "click",
            () => {

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


    document
        .getElementById("accion-exportar")
        ?.addEventListener(
            "click",
            () => {

                window.print();

            }
        );


    document
        .getElementById("btn-refresh")
        ?.addEventListener(
            "click",
            () => {

                refrescarVehiculos();

                renderizarAvisos();

                renderizarPlanificacion();

                actualizarHoraActualizacion();

            }
        );
}


/* ============================================================
   ERROR
============================================================ */

function mostrarErrorAplicacion(error) {

    const mensaje =
        document.createElement("div");


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


    mensaje.innerHTML = `
        <strong>Error iniciando el dashboard.</strong>
        <br>
        <small>
            Revisa la consola del navegador (F12).
        </small>
    `;


    document.body.appendChild(
        mensaje
    );
}
```
