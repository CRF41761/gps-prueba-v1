```javascript
/* ============================================================
   AVISOS
============================================================ */

function normalizarEstado(estado) {

    const valor = String(
        estado || "PENDIENTE"
    ).toUpperCase();

    if (
        valor.includes("RECOG") ||
        valor.includes("COMPLET")
    ) {
        return "RECOGIDO";
    }

    if (
        valor.includes("ASIGN")
    ) {
        return "ASIGNADO";
    }

    return "PENDIENTE";
}


/* ============================================================
   RENDER AVISOS
============================================================ */

function renderizarAvisos() {

    const contenedor =
        document.getElementById("lista-avisos");

    if (!contenedor) {
        return;
    }


    const avisos =
        Array.isArray(window.DATOS_MOCK?.AVISOS)
            ? window.DATOS_MOCK.AVISOS
            : [];


    contenedor.innerHTML = "";


    avisos.forEach((aviso, indice) => {

        const estado =
            normalizarEstado(aviso.estado);


        const id =
            aviso.id_aviso ||
            aviso.aviso_id ||
            aviso.id ||
            `AV-${String(indice + 1).padStart(3, "0")}`;


        const ubicacion =
            aviso.punto ||
            aviso.nombre_punto ||
            aviso.municipio ||
            "Ubicación no indicada";


        const especie =
            aviso.especie ||
            aviso.especie_reportada ||
            "Especie no determinada";


        const vehiculo =
            aviso.vehiculo_id ||
            aviso.id_vehiculo ||
            aviso.vehiculo ||
            "";


        const card =
            document.createElement("article");


        card.className =
            "alert-card " +
            (
                estado === "ASIGNADO"
                    ? "assigned"
                    : estado === "RECOGIDO"
                        ? "collected"
                        : ""
            );


        card.innerHTML = `

            <div class="alert-card-top">

                <span class="alert-id">
                    ${escapeHtml(id)}
                </span>

                <span class="alert-status ${
                    estado === "PENDIENTE"
                        ? "pending"
                        : estado === "ASIGNADO"
                            ? "assigned"
                            : "collected"
                }">
                    ${escapeHtml(estado)}
                </span>

            </div>


            <div class="alert-location">
                ${escapeHtml(ubicacion)}
            </div>


            <div class="alert-details">

                ${escapeHtml(especie)}

                ${
                    vehiculo
                        ? ` · ${escapeHtml(vehiculo)}`
                        : ""
                }

            </div>

        `;


        card.addEventListener(
            "click",
            () => seleccionarAviso(aviso)
        );


        contenedor.appendChild(card);
    });


    actualizarKpisAvisos(avisos);

    actualizarBadgeAvisos(avisos);
}


/* ============================================================
   SELECCIONAR AVISO
============================================================ */

function seleccionarAviso(aviso) {

    const lat =
        Number(
            aviso.lat ??
            aviso.latitud
        );

    const lng =
        Number(
            aviso.lng ??
            aviso.longitud ??
            aviso.lon
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


/* ============================================================
   KPI
============================================================ */

function actualizarKpisAvisos(avisos) {

    const pendientes =
        avisos.filter(
            a =>
                normalizarEstado(a.estado) ===
                "PENDIENTE"
        ).length;


    const asignados =
        avisos.filter(
            a =>
                normalizarEstado(a.estado) ===
                "ASIGNADO"
        ).length;


    const recogidos =
        avisos.filter(
            a =>
                normalizarEstado(a.estado) ===
                "RECOGIDO"
        ).length;


    const kpiPendientes =
        document.getElementById(
            "kpi-pendientes"
        );


    const kpiAsignados =
        document.getElementById(
            "kpi-asignados"
        );


    const kpiRecogidos =
        document.getElementById(
            "kpi-recogidos"
        );


    if (kpiPendientes) {
        kpiPendientes.textContent =
            pendientes;
    }

    if (kpiAsignados) {
        kpiAsignados.textContent =
            asignados;
    }

    if (kpiRecogidos) {
        kpiRecogidos.textContent =
            recogidos;
    }
}


/* ============================================================
   BADGE
============================================================ */

function actualizarBadgeAvisos(avisos) {

    const pendientes =
        avisos.filter(
            a =>
                normalizarEstado(a.estado) ===
                "PENDIENTE"
        ).length;


    const badge =
        document.getElementById(
            "badge-avisos"
        );


    const contador =
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
```
