```javascript
/* ============================================================
   RUTAS Y PLANIFICACIÓN
============================================================ */


/* ============================================================
   LEYENDA
============================================================ */

function renderizarLeyendaRutas() {

    const contenedor =
        document.getElementById(
            "leyenda-rutas"
        );


    if (!contenedor) {
        return;
    }


    const rutas =
        Array.isArray(window.DATOS_MOCK?.RUTAS)
            ? window.DATOS_MOCK.RUTAS
            : [

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


    contenedor.innerHTML = "";


    rutas.forEach(ruta => {

        const id =
            String(
                ruta.ruta_id ||
                ruta.id ||
                ""
            ).toUpperCase();


        const nombre =
            ruta.nombre ||
            ruta.nombre_ruta ||
            id;


        let color =
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


        const item =
            document.createElement("div");


        item.className =
            "route-legend-item";


        item.innerHTML = `

            <span
                class="route-line"
                style="background:${color}"
            ></span>

            <span class="route-name">
                ${escapeHtml(nombre)}
            </span>

        `;


        contenedor.appendChild(item);
    });
}


/* ============================================================
   PLANIFICACIÓN DIARIA
============================================================ */

function renderizarPlanificacion() {

    const contenedor =
        document.getElementById(
            "planificacion-dia"
        );


    if (!contenedor) {
        return;
    }


    let plan =
        Array.isArray(window.DATOS_MOCK?.PLANIFICACION)
            ? window.DATOS_MOCK.PLANIFICACION
            : [];


    /*
     * Si el mock todavía no tiene planificación,
     * generamos una vista coherente a partir de VEHICULOS.
     */

    if (!plan.length) {

        const vehiculos =
            Array.isArray(window.DATOS_MOCK?.VEHICULOS)
                ? window.DATOS_MOCK.VEHICULOS
                : [];


        plan =
            vehiculos.map(
                (vehiculo, indice) => ({

                    vehiculo_id:
                        vehiculo.id_vehiculo ||
                        vehiculo.id ||
                        `V${indice + 1}`,

                    ruta_id:
                        vehiculo.ruta_id ||
                        vehiculo.ruta ||
                        `R${indice + 1}`,

                    descripcion:
                        "Ruta planificada para la jornada"

                })
            );
    }


    contenedor.innerHTML = "";


    plan.forEach((item, indice) => {

        const vehiculo =
            item.vehiculo_id ||
            item.id_vehiculo ||
            item.vehiculo ||
            `V${indice + 1}`;


        const ruta =
            String(
                item.ruta_id ||
                item.ruta ||
                `R${indice + 1}`
            ).toUpperCase();


        const descripcion =
            item.descripcion ||
            item.observaciones ||
            item.detalle ||
            "Sin observaciones";


        const element =
            document.createElement("div");


        element.className =
            "planning-item";


        element.innerHTML = `

            <div class="planning-head">

                <span class="planning-vehicle">
                    🚐 ${escapeHtml(vehiculo)}
                </span>

                <span class="planning-route ${ruta.toLowerCase()}">
                    ${escapeHtml(ruta)}
                </span>

            </div>

            <div class="planning-description">
                ${escapeHtml(descripcion)}
            </div>

        `;


        contenedor.appendChild(element);
    });
}
```
