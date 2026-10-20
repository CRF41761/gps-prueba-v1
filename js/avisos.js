/* ============================================================
   CRF - AVISOS
============================================================ */

function normalizarEstado(
    estado
) {

    var valor =
        String(
            estado || "PENDIENTE"
        ).toUpperCase();


    if (
        valor.indexOf("RECOG") >= 0 ||
        valor.indexOf("COMPLET") >= 0
    ) {
        return "RECOGIDO";
    }


    if (
        valor.indexOf("ASIGN") >= 0
    ) {
        return "ASIGNADO";
    }


    return "PENDIENTE";
}


function renderizarAvisos() {

    var contenedor =
        document.getElementById(
            "lista-avisos"
        );


    if (!contenedor) return;


    var avisos = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(
            window.DATOS_MOCK.AVISOS
        )
    ) {
        avisos =
            window.DATOS_MOCK.AVISOS;
    }


    contenedor.innerHTML = "";


    avisos.forEach(
        function(aviso, indice) {

            var estado =
                normalizarEstado(
                    aviso.estado
                );


            var id =
                aviso.id_aviso ||
                aviso.aviso_id ||
                aviso.id ||
                "AV-" +
                String(indice + 1)
                    .padStart(3, "0");


            var ubicacion =
                aviso.punto ||
                aviso.nombre_punto ||
                aviso.municipio ||
                "Ubicación no indicada";


            var especie =
                aviso.especie ||
                aviso.especie_reportada ||
                "Especie no determinada";


            var vehiculo =
                aviso.vehiculo_id ||
                aviso.id_vehiculo ||
                aviso.vehiculo ||
                "";


            var card =
                document.createElement(
                    "article"
                );


            var clase =
                estado === "ASIGNADO"
                    ? "assigned"
                    : estado === "RECOGIDO"
                        ? "collected"
                        : "";


            var claseEstado =
                estado === "PENDIENTE"
                    ? "pending"
                    : estado === "ASIGNADO"
                        ? "assigned"
                        : "collected";


            card.className =
                "alert-card " +
                clase;


            card.innerHTML =
                '<div class="alert-card-top">' +

                    '<span class="alert-id">' +
                    escaparHTML(id) +
                    '</span>' +

                    '<span class="alert-status ' +
                    claseEstado +
                    '">' +
                    escaparHTML(estado) +
                    '</span>' +

                '</div>' +

                '<div class="alert-location">' +
                escaparHTML(ubicacion) +
                '</div>' +

                '<div class="alert-details">' +
                escaparHTML(especie) +

                (
                    vehiculo
                        ? " · " +
                          escaparHTML(vehiculo)
                        : ""
                ) +

                '</div>';


            card.addEventListener(
                "click",
                function() {

                    seleccionarAviso(
                        aviso
                    );

                }
            );


            contenedor.appendChild(
                card
            );
        }
    );


    actualizarKpisAvisos(
        avisos
    );


    actualizarBadgeAvisos(
        avisos
    );
}


function seleccionarAviso(
    aviso
) {

    var lat =
        Number(
            aviso.lat !== undefined
                ? aviso.lat
                : aviso.latitud
        );


    var lng =
        Number(
            aviso.lng !== undefined
                ? aviso.lng
                : aviso.longitud !== undefined
                    ? aviso.longitud
                    : aviso.lon
        );


    if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        typeof mapa !== "undefined" &&
        mapa
    ) {

        mapa.setView(
            [lat, lng],
            Math.max(
                mapa.getZoom(),
                12
            ),
            {
                animate: true
            }
        );

    }
}


function actualizarKpisAvisos(
    avisos
) {

    var pendientes =
        avisos.filter(
            function(aviso) {

                return normalizarEstado(
                    aviso.estado
                ) === "PENDIENTE";

            }
        ).length;


    var asignados =
        avisos.filter(
            function(aviso) {

                return normalizarEstado(
                    aviso.estado
                ) === "ASIGNADO";

            }
        ).length;


    var recogidos =
        avisos.filter(
            function(aviso) {

                return normalizarEstado(
                    aviso.estado
                ) === "RECOGIDO";

            }
        ).length;


    var elementoPendientes =
        document.getElementById(
            "kpi-pendientes"
        );


    var elementoAsignados =
        document.getElementById(
            "kpi-asignados"
        );


    var elementoRecogidos =
        document.getElementById(
            "kpi-recogidos"
        );


    if (elementoPendientes) {
        elementoPendientes.textContent =
            pendientes;
    }


    if (elementoAsignados) {
        elementoAsignados.textContent =
            asignados;
    }


    if (elementoRecogidos) {
        elementoRecogidos.textContent =
            recogidos;
    }
}


function actualizarBadgeAvisos(
    avisos
) {

    var pendientes =
        avisos.filter(
            function(aviso) {

                return normalizarEstado(
                    aviso.estado
                ) === "PENDIENTE";

            }
        ).length;


    var badge =
        document.getElementById(
            "badge-avisos"
        );


    var contador =
        document.getElementById(
            "contador-avisos"
        );


    if (badge) {
        badge.textContent =
            pendientes;
    }


    if (contador) {
        contador.textContent =
            pendientes;
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
