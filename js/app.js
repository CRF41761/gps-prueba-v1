/* =========================================================
   APLICACIÓN PRINCIPAL
========================================================= */

let datosActuales = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);


async function iniciarAplicacion() {

    try {

        inicializarMapa();

        actualizarReloj();

        setInterval(
            actualizarReloj,
            1000
        );


        datosActuales =
            await API.obtenerDatos();


        renderizarAplicacion();


        iniciarSimulacionGPS();


    } catch (error) {

        console.error(
            "Error iniciando aplicación:",
            error
        );

        mostrarError(
            error
        );

    }

}


/* =========================================================
   RENDER GENERAL
========================================================= */

function renderizarAplicacion() {

    if (!datosActuales) {
        return;
    }


    renderizarVehiculos(
        datosActuales.vehiculos
    );


    renderizarAvisos(
        datosActuales.avisos
    );


    renderizarLeyendaRutas(
        datosActuales.rutas
    );


    renderizarPlanificacion(
        datosActuales.planificacion
    );


    actualizarKPIs(

        datosActuales.avisos,

        datosActuales.vehiculos

    );


    dibujarRutas(
        datosActuales.rutas
    );


    dibujarPuntos(
        datosActuales.puntos
    );


    dibujarAvisos(
        datosActuales.avisos
    );


    dibujarVehiculos(
        datosActuales.posiciones
    );


    actualizarFechaActualizacion();
}


/* =========================================================
   RELOJ
========================================================= */

function actualizarReloj() {

    const ahora =
        new Date();


    const horas =
        String(
            ahora.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutos =
        String(
            ahora.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const segundos =
        String(
            ahora.getSeconds()
        ).padStart(
            2,
            "0"
        );


    document.getElementById(
        "reloj"
    ).textContent =

        `${horas}:${minutos}:${segundos}`;
}


/* =========================================================
   ÚLTIMA ACTUALIZACIÓN
========================================================= */

function actualizarFechaActualizacion() {

    const ahora =
        new Date();


    document.getElementById(
        "ultimaActualizacion"
    ).textContent =

        `Última actualización: ${
            ahora.toLocaleTimeString(
                "es-ES"
            )
        }`;
}


/* =========================================================
   SIMULACIÓN DE GPS
========================================================= */

/*
   IMPORTANTE:

   Esto NO modifica la planificación.

   Simula únicamente las posiciones GPS
   de los vehículos.

   En producción estas posiciones llegarán
   desde POSICIONES mediante Apps Script.
*/

function iniciarSimulacionGPS() {

    setInterval(

        () => {

            if (!datosActuales) {
                return;
            }


            Object.values(
                datosActuales.posiciones
            ).forEach(posicion => {

                posicion.latitud +=
                    (Math.random() - 0.5)
                    * 0.0015;


                posicion.longitud +=
                    (Math.random() - 0.5)
                    * 0.0015;


                posicion.ultimaActualizacion =
                    new Date();

            });


            dibujarVehiculos(
                datosActuales.posiciones
            );


            actualizarFechaActualizacion();

        },

        CONFIG.refrescoGPS

    );
}


/* =========================================================
   ERROR
========================================================= */

function mostrarError(error) {

    console.error(error);

    const contenedor =
        document.getElementById(
            "listaVehiculos"
        );

    contenedor.innerHTML = `

        <div class="mock-warning">

            <strong>
                Error cargando datos
            </strong>

            <p>
                ${error.message}
            </p>

        </div>

    `;
}
