```javascript
/* ============================================================
   VEHÍCULOS
============================================================ */

let vehiculoSeleccionado = null;


/* ============================================================
   RENDER
============================================================ */

function renderizarVehiculos() {

    const contenedor =
        document.getElementById("lista-vehiculos");

    if (!contenedor) {
        return;
    }

    const vehiculos =
        Array.isArray(window.DATOS_MOCK?.VEHICULOS)
            ? window.DATOS_MOCK.VEHICULOS
            : [];


    contenedor.innerHTML = "";


    vehiculos.forEach((vehiculo, indice) => {

        const id = String(
            vehiculo.id_vehiculo ||
            vehiculo.vehiculo_id ||
            vehiculo.id ||
            `V${indice + 1}`
        );


        const nombre =
            vehiculo.nombre ||
            `Vehículo ${indice + 1}`;


        const ruta =
            vehiculo.ruta_id ||
            vehiculo.ruta_habitual ||
            vehiculo.ruta ||
            `R${indice + 1}`;


        const activo =
            vehiculo.activo !== false;


        const tarjeta =
            document.createElement("article");


        tarjeta.className =
            "vehicle-card";


        tarjeta.dataset.id = id;


        tarjeta.innerHTML = `

            <div class="vehicle-top">

                <div class="vehicle-name">

                    <span class="vehicle-icon">
                        🚐
                    </span>

                    <span>
                        ${escapeHtml(
                            nombre
                        )}
                    </span>

                </div>

                <div class="vehicle-status">

                    <span class="vehicle-status-dot"></span>

                    ${activo ? "En ruta" : "Inactivo"}

                </div>

            </div>


            <div class="vehicle-meta">

                <span>
                    Vehículo
                    <strong>${escapeHtml(id)}</strong>
                </span>

                <span>
                    Ruta
                    <strong>${escapeHtml(ruta)}</strong>
                </span>

            </div>

        `;


        tarjeta.addEventListener(
            "click",
            () => seleccionarVehiculo(id)
        );


        contenedor.appendChild(tarjeta);
    });


    actualizarKpiVehiculos(vehiculos);
}


/* ============================================================
   SELECCIONAR
============================================================ */

function seleccionarVehiculo(idVehiculo) {

    vehiculoSeleccionado = idVehiculo;


    document
        .querySelectorAll(".vehicle-card")
        .forEach(card => {

            card.classList.toggle(
                "active",
                card.dataset.id === idVehiculo
            );

        });


    if (typeof centrarVehiculo === "function") {
        centrarVehiculo(idVehiculo);
    }
}


/* ============================================================
   KPI
============================================================ */

function actualizarKpiVehiculos(vehiculos) {

    const activos =
        vehiculos.filter(
            v => v.activo !== false
        ).length;


    const elemento =
        document.getElementById("kpi-vehiculos");


    if (elemento) {
        elemento.textContent = activos;
    }
}


/* ============================================================
   REFRESCAR
============================================================ */

function refrescarVehiculos() {

    renderizarVehiculos();

    if (typeof dibujarVehiculos === "function") {
        dibujarVehiculos();
    }
}
```
