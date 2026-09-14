/* =========================================================
   AVISOS
========================================================= */

function renderizarAvisos(avisos) {

    const contenedor =
        document.getElementById(
            "listaAvisos"
        );

    contenedor.innerHTML = "";


    avisos.forEach(aviso => {

        const elemento =
            document.createElement("div");


        let claseEstado =
            "pending";

        let textoEstado =
            "PENDIENTE";


        if (aviso.estado === "ASIGNADO") {

            claseEstado =
                "assigned";

            textoEstado =
                "ASIGNADO";
        }


        if (aviso.estado === "RECOGIDO") {

            claseEstado =
                "collected";

            textoEstado =
                "RECOGIDO";
        }


        elemento.className =
            `alert-card ${claseEstado}`;


        elemento.innerHTML = `

            <div class="alert-header">

                <div class="alert-point">
                    ${aviso.punto}
                </div>

                <span class="alert-status ${claseEstado}">
                    ${textoEstado}
                </span>

            </div>


            <div class="alert-info">

                <span>
                    🐾 ${aviso.especie}
                </span>

                <span>
                    ${aviso.cantidad} animal(es)
                </span>

                <span>
                    ${aviso.ruta}
                </span>

                <span>
                    ${aviso.vehiculo || "Sin asignar"}
                </span>

            </div>

        `;


        elemento.addEventListener(
            "click",
            () => {

                centrarAviso(
                    aviso.id
                );

            }
        );


        contenedor.appendChild(
            elemento
        );

    });


    document.getElementById(
        "contadorAvisos"
    ).textContent =
        avisos.length;
}


/* =========================================================
   KPIs
========================================================= */

function actualizarKPIs(
    avisos,
    vehiculos
) {

    const pendientes =
        avisos.filter(
            aviso =>
                aviso.estado === "PENDIENTE"
        ).length;


    const asignados =
        avisos.filter(
            aviso =>
                aviso.estado === "ASIGNADO"
        ).length;


    const recogidos =
        avisos.filter(
            aviso =>
                aviso.estado === "RECOGIDO"
        ).length;


    const activos =
        vehiculos.filter(
            vehiculo =>
                vehiculo.activo
        ).length;


    document.getElementById(
        "kpiPendientes"
    ).textContent =
        pendientes;


    document.getElementById(
        "kpiAsignados"
    ).textContent =
        asignados;


    document.getElementById(
        "kpiRecogidos"
    ).textContent =
        recogidos;


    document.getElementById(
        "kpiVehiculos"
    ).textContent =
        activos;
}
