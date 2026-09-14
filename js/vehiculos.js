/* =========================================================
   VEHÍCULOS
========================================================= */

function renderizarVehiculos(vehiculos) {

    const contenedor =
        document.getElementById(
            "listaVehiculos"
        );

    contenedor.innerHTML = "";


    vehiculos.forEach(vehiculo => {

        const ruta =
            CONFIG.nombresRutas[
                vehiculo.rutaHabitual
            ];


        const claseRuta =
            vehiculo.rutaHabitual
                .toLowerCase();


        const elemento =
            document.createElement("div");


        elemento.className =
            "vehicle-card";


        elemento.dataset.vehiculo =
            vehiculo.id;


        elemento.innerHTML = `

            <div class="vehicle-header">

                <div class="vehicle-name">
                    ${vehiculo.nombre}
                </div>

                <div class="vehicle-state">

                    <span class="status-dot"></span>

                    En ruta

                </div>

            </div>


            <div class="vehicle-details">

                <div>
                    Tablet: <strong>
                    ${vehiculo.tablet}
                    </strong>
                </div>

                <div>
                    GPS: <strong>
                    activo
                    </strong>
                </div>

            </div>


            <div class="vehicle-route">

                <span class="route-chip route-${claseRuta}">
                    ${vehiculo.rutaHabitual} · ${ruta}
                </span>

            </div>

        `;


        elemento.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".vehicle-card"
                    )
                    .forEach(card =>
                        card.classList.remove(
                            "selected"
                        )
                    );


                elemento.classList.add(
                    "selected"
                );


                centrarVehiculo(
                    vehiculo.id
                );

            }
        );


        contenedor.appendChild(
            elemento
        );

    });


    document.getElementById(
        "contadorVehiculos"
    ).textContent =
        vehiculos.length;
}
