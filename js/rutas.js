/* ============================================================
   CRF - RUTAS Y PLANIFICACIÓN
============================================================ */


function renderizarLeyendaRutas() {

    var contenedor =
        document.getElementById(
            "leyenda-rutas"
        );


    if (!contenedor) return;


    var rutas = [];


    if (
        window.DATOS_MOCK &&
        Array.isArray(
            window.DATOS_MOCK.RUTAS
        )
    ) {

        rutas =
            window.DATOS_MOCK.RUTAS;

    }


    if (!rutas.length) {

        rutas = [

            {
                ruta_id: "R1",
                nombre: "R1 · Norte"
            },

            {
                ruta_id: "R2",
                nombre: "R2 · Interior"
            },

            {
                ruta_id: "R3",
                nombre: "R3 · Sur"
            }

        ];
    }


    contenedor.innerHTML = "";


    rutas.forEach(
        function(ruta) {

            var id =
                String(
                    ruta.ruta_id ||
                    ruta.id ||
                    ""
                ).toUpperCase();


            var nombre =
                ruta.nombre ||
                ruta.nombre_ruta ||
                id;


            var color =
                "#467886";


            if (id === "R1") {
                color = "#1976D2";
            }


            if (id === "R2") {
                color = "#388E3C";
            }


            if (id === "R3") {
                color = "#F57C00";
            }


            var item =
                document.createElement(
                    "div"
                );


            item.className =
                "route-legend-item";


            item.innerHTML =
                '<span class="route-line" ' +
                'style="background:' +
                color +
                '"></span>' +

                '<span class="route-name">' +
                escaparHTML(nombre) +
                '</span>';


            contenedor.appendChild(
                item
            );
        }
    );
}


function renderizarPlanificacion() {

    var contenedor =
        document.getElementById(
            "planificacion-dia"
        );


    if (!contenedor) return;


    var plan = [];


    if (
        window.DATOS_MOCK &&
        Array.isArray(
            window.DATOS_MOCK.PLANIFICACION
        )
    ) {

        plan =
            window.DATOS_MOCK.PLANIFICACION;

    }


    if (!plan.length) {

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


        plan =
            vehiculos.map(
                function(vehiculo, indice) {

                    return {

                        vehiculo_id:
                            vehiculo.id_vehiculo ||
                            vehiculo.id ||
                            "V" +
                            (indice + 1),

                        ruta_id:
                            vehiculo.ruta_id ||
                            vehiculo.ruta ||
                            "R" +
                            (indice + 1),

                        descripcion:
                            "Ruta planificada para la jornada"

                    };

                }
            );
    }


    contenedor.innerHTML = "";


    plan.forEach(
        function(item, indice) {

            var vehiculo =
                item.vehiculo_id ||
                item.id_vehiculo ||
                item.vehiculo ||
                "V" +
                (indice + 1);


            var ruta =
                String(
                    item.ruta_id ||
                    item.ruta ||
                    "R" +
                    (indice + 1)
                ).toUpperCase();


            var descripcion =
                item.descripcion ||
                item.observaciones ||
                item.detalle ||
                "Sin observaciones";


            var elemento =
                document.createElement(
                    "div"
                );


            elemento.className =
                "planning-item";


            elemento.innerHTML =
                '<div class="planning-head">' +

                    '<span class="planning-vehicle">' +
                    '🚐 ' +
                    escaparHTML(vehiculo) +
                    '</span>' +

                    '<span class="planning-route ' +
                    ruta.toLowerCase() +
                    '">' +
                    escaparHTML(ruta) +
                    '</span>' +

                '</div>' +

                '<div class="planning-description">' +
                escaparHTML(descripcion) +
                '</div>';


            contenedor.appendChild(
                elemento
            );
        }
    );
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
