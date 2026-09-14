/* =========================================================
   RUTAS Y PLANIFICACIÓN
========================================================= */

function renderizarLeyendaRutas(rutas) {

    const contenedor =
        document.getElementById(
            "leyendaRutas"
        );

    contenedor.innerHTML = "";


    rutas.forEach(ruta => {

        const elemento =
            document.createElement("div");


        elemento.className =
            "route-legend-item";


        const clase =
            ruta.id.toLowerCase();


        elemento.innerHTML = `

            <span class="route-line ${clase}">
            </span>

            <span>
                <strong>${ruta.id}</strong>
                · ${ruta.nombre}
            </span>

        `;


        contenedor.appendChild(
            elemento
        );

    });
}


/* =========================================================
   PLANIFICACIÓN
========================================================= */

function renderizarPlanificacion(
    planificacion
) {

    const contenedor =
        document.getElementById(
            "planificacion"
        );

    contenedor.innerHTML = "";


    planificacion.forEach(plan => {

        const claseRuta =
            plan.rutaActiva.toLowerCase();


        const elemento =
            document.createElement("div");


        elemento.className =
            "plan-card";


        let paradasHTML = "";


        plan.paradas.forEach(parada => {

            let iconoEstado = "○";


            if (parada.estado === "RECOGIDO") {
                iconoEstado = "✓";
            }

            if (parada.estado === "PENDIENTE") {
                iconoEstado = "!";
            }


            paradasHTML += `

                <div class="plan-stop">

                    <div class="stop-number">
                        ${parada.orden}
                    </div>

                    <div class="stop-content">

                        <strong>
                            ${parada.hora}
                            ·
                            ${parada.nombre}
                        </strong>

                        <span>
                            ${parada.tipo}
                            ·
                            ${parada.estado}
                            ${iconoEstado}
                        </span>

                    </div>

                </div>

            `;

        });


        elemento.innerHTML = `

            <div class="plan-header">

                <strong>
                    ${plan.vehiculo}
                </strong>

                <span>
                    ${plan.horaSalida}
                    →
                    ${plan.horaEstimadaRegreso}
                </span>

            </div>


            <div class="plan-route">

                <span class="route-chip route-${claseRuta}">
                    ${plan.rutaActiva}
                    ·
                    ${plan.rutaNombre}
                </span>

                <span>
                    Ruta activa de hoy
                </span>

            </div>


            <div class="plan-stops">

                ${paradasHTML}

            </div>

        `;


        contenedor.appendChild(
            elemento
        );

    });
}
