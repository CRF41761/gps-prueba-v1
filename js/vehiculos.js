/* ============================================================
   CRF - VEHÍCULOS
============================================================ */

var vehiculoSeleccionado = null;


function clasificarActividadTarjeta(
    valor
) {

    /*
     * BLOQUE 2 · criterio único: la tarjeta delega en el
     * clasificador de app.js. Si por orden de carga no estuviera
     * disponible, se devuelve desconocido (nunca activo).
     */
    if (
        typeof clasificarActividadVehiculo !==
        "function"
    ) {

        return "DESCONOCIDO";
    }


    return clasificarActividadVehiculo(
        valor
    );
}


function obtenerEstadoActividadVehiculo(
    vehiculo
) {

    var actividad =
        vehiculo &&
        vehiculo.actividad !== undefined
            ? clasificarActividadTarjeta(
                vehiculo.actividad
            )
            : clasificarActividadTarjeta(
                vehiculo
                    ? vehiculo.activo
                    : undefined
            );


    if (actividad === "ACTIVO") {

        return {
            clave: "activo",
            texto: "Activo"
        };
    }


    if (actividad === "INACTIVO") {

        return {
            clave: "inactivo",
            texto: "Inactivo"
        };
    }


    return {
        clave: "desconocido",
        texto: "Estado desconocido"
    };
}


function obtenerRutaHabitualVehiculo(
    vehiculo
) {

    if (!vehiculo) {

        return "";
    }


    if (
        Object.prototype.hasOwnProperty.call(
            vehiculo,
            "ruta_habitual_identificada"
        )
    ) {

        return String(
            vehiculo.ruta_habitual_identificada ||
            ""
        ).trim();
    }


    return String(
        vehiculo.rutaHabitual ||
        vehiculo.ruta_habitual ||
        vehiculo.ruta_id ||
        vehiculo.ruta ||
        ""
    ).trim();
}


function renderizarVehiculos() {

    var contenedor =
        document.getElementById(
            "lista-vehiculos"
        );


    if (!contenedor) return;


    var vehiculos = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(
            window.DATOS_MOCK.VEHICULOS
        )
    ) {
        vehiculos =
            window.DATOS_MOCK.VEHICULOS;
    }


    contenedor.innerHTML = "";


    vehiculos.forEach(
        function(vehiculo, indice) {

            var id =
                vehiculo.id_vehiculo !== undefined
                    ? String(vehiculo.id_vehiculo)
                    : vehiculo.vehiculo_id !== undefined
                        ? String(vehiculo.vehiculo_id)
                        : vehiculo.id !== undefined
                            ? String(vehiculo.id)
                            : "V" + (indice + 1);


            var nombre =
                vehiculo.nombre ||
                "Vehículo " + (indice + 1);


            var ruta =
                obtenerRutaHabitualVehiculo(
                    vehiculo
                );


            var tablet =
                vehiculo.tablet ||
                vehiculo.tablet_id ||
                vehiculo.id_tablet ||
                "";


            var estadoActividad =
                obtenerEstadoActividadVehiculo(
                    vehiculo
                );


            var tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "vehicle-card";


            tarjeta.dataset.id =
                id;


            tarjeta.innerHTML =
                '<div class="vehicle-top' +
                (
                    estadoActividad.clave === "desconocido"
                        ? " vehicle-top--desconocido"
                        : ""
                ) +
                '">' +

                    '<div class="vehicle-name">' +

                        '<span class="vehicle-icon">🚐</span>' +

                        '<span>' +
                        escaparHTML(nombre) +
                        '</span>' +

                    '</div>' +

                    '<div class="vehicle-status estado-' +
                    estadoActividad.clave +
                    '">' +

                        '<span class="vehicle-status-dot"></span>' +

                        estadoActividad.texto +

                    '</div>' +

                '</div>' +

                '<div class="vehicle-meta">' +

                    '<span>Vehículo <strong>' +
                    escaparHTML(id) +
                    '</strong></span>' +

                    '<span class="vehicle-tablet">Tablet <strong>' +
                    escaparHTML(tablet || "—") +
                    '</strong></span>' +

                    '<span title="Ruta habitual">Ruta <strong>' +
                    escaparHTML(ruta || "Sin ruta") +
                    '</strong></span>' +

                '</div>';


            tarjeta.addEventListener(
                "click",
                function() {

                    seleccionarVehiculo(
                        id
                    );

                }
            );


            contenedor.appendChild(
                tarjeta
            );
        }
    );


    actualizarKpiVehiculos(
        vehiculos
    );
}


function seleccionarVehiculo(
    idVehiculo
) {

    vehiculoSeleccionado =
        idVehiculo;


    document
        .querySelectorAll(
            ".vehicle-card"
        )
        .forEach(
            function(card) {

                card.classList.toggle(
                    "active",
                    card.dataset.id ===
                    idVehiculo
                );

            }
        );


    if (
        typeof centrarVehiculo ===
        "function"
    ) {

        centrarVehiculo(
            idVehiculo
        );

    }
}


function actualizarKpiVehiculos(
    vehiculos
) {

    var activos =
        vehiculos.filter(
            function(vehiculo) {

                return (
                    obtenerEstadoActividadVehiculo(
                        vehiculo
                    ).clave === "activo"
                );

            }
        ).length;


    var elemento =
        document.getElementById(
            "kpi-vehiculos"
        );


    if (elemento) {
        elemento.textContent =
            activos;
    }


    var resumen =
        document.getElementById(
            "summary-vehiculos"
        );


    if (resumen) {
        resumen.textContent =
            activos;
    }
}


function refrescarVehiculos() {

    renderizarVehiculos();

    if (
        typeof dibujarVehiculos ===
        "function"
    ) {

        dibujarVehiculos();

    }
}


function escaparHTML(valor) {

    return String(
        valor === undefined ||
        valor === null
            ? ""
            : valor
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
