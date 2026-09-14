/* ============================================================
   CRF - VEHÍCULOS
============================================================ */

var vehiculoSeleccionado = null;


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
                vehiculo.ruta_id ||
                vehiculo.ruta_habitual ||
                vehiculo.ruta ||
                "R" + (indice + 1);


            var activo =
                vehiculo.activo !== false;


            var tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "vehicle-card";


            tarjeta.dataset.id =
                id;


            tarjeta.innerHTML =
                '<div class="vehicle-top">' +

                    '<div class="vehicle-name">' +

                        '<span class="vehicle-icon">🚐</span>' +

                        '<span>' +
                        escaparHTML(nombre) +
                        '</span>' +

                    '</div>' +

                    '<div class="vehicle-status">' +

                        '<span class="vehicle-status-dot"></span>' +

                        (activo ? "En ruta" : "Inactivo") +

                    '</div>' +

                '</div>' +

                '<div class="vehicle-meta">' +

                    '<span>Vehículo <strong>' +
                    escaparHTML(id) +
                    '</strong></span>' +

                    '<span>Ruta <strong>' +
                    escaparHTML(ruta) +
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

                return vehiculo.activo !== false;

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
```
