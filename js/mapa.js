```javascript
/* ============================================================
   MAPA OPERATIVO
   Rutas, vehículos, puntos y avisos son capas independientes.
============================================================ */

let mapa = null;

let capas = {
    rutas: null,
    puntos: null,
    avisos: null,
    vehiculos: null
};

let marcadoresVehiculos = {};
let posicionesVehiculos = {};

const VALENCIA_CENTER = [39.4699, -0.3763];


/* ============================================================
   INICIALIZAR MAPA
============================================================ */

function inicializarMapa() {

    mapa = L.map("map", {
        zoomControl: true,
        preferCanvas: true
    }).setView(VALENCIA_CENTER, 9);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }
    ).addTo(mapa);


    capas.rutas = L.layerGroup().addTo(mapa);
    capas.puntos = L.layerGroup().addTo(mapa);
    capas.avisos = L.layerGroup().addTo(mapa);
    capas.vehiculos = L.layerGroup().addTo(mapa);


    dibujarRutas();
    dibujarPuntos();
    dibujarAvisos();
    dibujarVehiculos();


    configurarCapasMapa();
}


/* ============================================================
   UTILIDADES
============================================================ */

function obtenerLat(obj) {

    return Number(
        obj?.lat ??
        obj?.latitud ??
        obj?.latitude ??
        obj?.y
    );
}


function obtenerLng(obj) {

    return Number(
        obj?.lng ??
        obj?.longitud ??
        obj?.longitude ??
        obj?.lon ??
        obj?.x
    );
}


function coordenadasValidas(lat, lng) {

    return Number.isFinite(lat) &&
           Number.isFinite(lng) &&
           lat >= -90 &&
           lat <= 90 &&
           lng >= -180 &&
           lng <= 180;
}


function obtenerNombreRuta(ruta) {

    return ruta?.nombre ||
           ruta?.ruta_nombre ||
           ruta?.ruta_id ||
           ruta?.id ||
           "Ruta";
}


function obtenerColorRuta(ruta) {

    const id = String(
        ruta?.ruta_id ||
        ruta?.id ||
        ""
    ).toUpperCase();

    if (id === "R1") return "#1976D2";
    if (id === "R2") return "#388E3C";
    if (id === "R3") return "#F57C00";

    return "#467886";
}


/* ============================================================
   RUTAS
============================================================ */

function dibujarRutas() {

    capas.rutas.clearLayers();

    const rutas = Array.isArray(window.DATOS_MOCK?.RUTAS)
        ? window.DATOS_MOCK.RUTAS
        : [];

    const rutasMock = obtenerRutasGeometricasMock();

    rutasMock.forEach(ruta => {

        const coordenadas = ruta.coordenadas;

        if (!coordenadas || coordenadas.length < 2) {
            return;
        }

        const color = obtenerColorRuta(ruta);

        const linea = L.polyline(
            coordenadas,
            {
                color: color,
                weight: 5,
                opacity: 0.78,
                lineJoin: "round"
            }
        );

        linea.bindPopup(`
            <strong>${escapeHtml(obtenerNombreRuta(ruta))}</strong>
            <br>
            Ruta planificada
            <br>
            <small>La posición GPS del vehículo se muestra por separado.</small>
        `);

        linea.addTo(capas.rutas);
    });
}


/* ============================================================
   GEOMETRÍA MOCK
   Solo demostración.
   Posteriormente llegará desde RUTAS / planificación.
============================================================ */

function obtenerRutasGeometricasMock() {

    return [

        {
            ruta_id: "R1",
            nombre: "R1 · Norte",
            coordenadas: [
                [39.470, -0.377],
                [39.515, -0.350],
                [39.555, -0.300],
                [39.610, -0.290],
                [39.670, -0.300],
                [39.735, -0.340]
            ]
        },

        {
            ruta_id: "R2",
            nombre: "R2 · Interior",
            coordenadas: [
                [39.470, -0.377],
                [39.440, -0.450],
                [39.470, -0.530],
                [39.500, -0.600],
                [39.550, -0.650]
            ]
        },

        {
            ruta_id: "R3",
            nombre: "R3 · Sur",
            coordenadas: [
                [39.470, -0.377],
                [39.425, -0.400],
                [39.370, -0.430],
                [39.300, -0.460],
                [39.240, -0.470],
                [39.170, -0.500]
            ]
        }

    ];
}


/* ============================================================
   PUNTOS COLABORADORES
============================================================ */

function dibujarPuntos() {

    capas.puntos.clearLayers();

    const puntos = Array.isArray(window.DATOS_MOCK?.PUNTOS_RECOGIDA)
        ? window.DATOS_MOCK.PUNTOS_RECOGIDA
        : [];

    puntos.forEach(punto => {

        const lat = obtenerLat(punto);
        const lng = obtenerLng(punto);

        if (!coordenadasValidas(lat, lng)) {
            return;
        }

        const icono = L.divIcon({
            className: "point-map-marker-wrapper",
            html: `<div class="point-map-marker"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const marker = L.marker(
            [lat, lng],
            { icon: icono }
        );

        marker.bindPopup(`
            <strong>${escapeHtml(
                punto.nombre ||
                punto.nombre_punto ||
                "Punto colaborador"
            )}</strong>
            <br>
            ${escapeHtml(
                punto.tipo ||
                "Colaborador"
            )}
            <br>
            <small>${escapeHtml(
                punto.municipio ||
                ""
            )}</small>
        `);

        marker.addTo(capas.puntos);
    });
}


/* ============================================================
   AVISOS
============================================================ */

function dibujarAvisos() {

    capas.avisos.clearLayers();

    const avisos = Array.isArray(window.DATOS_MOCK?.AVISOS)
        ? window.DATOS_MOCK.AVISOS
        : [];

    avisos.forEach(aviso => {

        const lat = obtenerLat(aviso);
        const lng = obtenerLng(aviso);

        if (!coordenadasValidas(lat, lng)) {
            return;
        }

        const estado = normalizarEstadoAviso(aviso.estado);

        let clase = "alert-pending";

        if (estado === "ASIGNADO") {
            clase = "alert-assigned";
        }

        if (estado === "RECOGIDO") {
            clase = "alert-collected";
        }

        const icono = L.divIcon({
            className: "alert-map-marker-wrapper",
            html: `<div class="alert-map-marker ${clase}">!</div>`,
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        });

        const marker = L.marker(
            [lat, lng],
            { icon: icono }
        );

        marker.bindPopup(`
            <strong>${escapeHtml(
                aviso.id_aviso ||
                aviso.aviso_id ||
                aviso.id ||
                "Aviso"
            )}</strong>
            <br>
            <b>${escapeHtml(
                aviso.especie ||
                aviso.especie_reportada ||
                "Especie no determinada"
            )}</b>
            <br>
            Estado: ${escapeHtml(estado)}
            <br>
            ${escapeHtml(
                aviso.observaciones ||
                ""
            )}
        `);

        marker.on("click", () => {

            if (typeof seleccionarAviso === "function") {
                seleccionarAviso(aviso);
            }
        });

        marker.addTo(capas.avisos);
    });
}


/* ============================================================
   VEHÍCULOS
============================================================ */

function dibujarVehiculos() {

    capas.vehiculos.clearLayers();

    marcadoresVehiculos = {};

    const vehiculos = Array.isArray(window.DATOS_MOCK?.VEHICULOS)
        ? window.DATOS_MOCK.VEHICULOS
        : [];

    const posiciones = Array.isArray(window.DATOS_MOCK?.POSICIONES)
        ? window.DATOS_MOCK.POSICIONES
        : [];


    vehiculos.forEach((vehiculo, indice) => {

        const id = String(
            vehiculo.id_vehiculo ||
            vehiculo.vehiculo_id ||
            vehiculo.id ||
            `V${indice + 1}`
        );


        let posicion = posiciones.find(pos =>
            String(
                pos.id_vehiculo ||
                pos.vehiculo_id ||
                pos.id ||
                ""
            ) === id
        );


        /*
         * Si POSICIONES no tiene una posición válida,
         * utilizamos una posición inicial de demostración.
         */
        let lat = obtenerLat(posicion);
        let lng = obtenerLng(posicion);


        if (!coordenadasValidas(lat, lng)) {

            const posicionesIniciales = [
                [39.485, -0.410],
                [39.440, -0.475],
                [39.400, -0.355]
            ];

            const inicial =
                posicionesIniciales[indice] ||
                VALENCIA_CENTER;

            lat = inicial[0];
            lng = inicial[1];
        }


        posicionesVehiculos[id] = {
            lat,
            lng
        };


        const rutaId = String(
            vehiculo.ruta_id ||
            vehiculo.ruta_habitual ||
            vehiculo.ruta ||
            `R${indice + 1}`
        ).toUpperCase();


        const color =
            rutaId === "R1"
                ? "#1976D2"
                : rutaId === "R2"
                    ? "#388E3C"
                    : "#F57C00";


        const icono = L.divIcon({

            className: "vehicle-map-marker",

            html: `
                <div
                    class="vehicle-marker"
                    style="border-color:${color}"
                >
                    🚐
                </div>

                <div class="vehicle-marker-label">
                    ${escapeHtml(id)}
                </div>
            `,

            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });


        const marker = L.marker(
            [lat, lng],
            {
                icon: icono,
                zIndexOffset: 1000
            }
        );


        marker.bindPopup(`
            <strong>${escapeHtml(
                vehiculo.nombre ||
                vehiculo.matricula ||
                id
            )}</strong>
            <br>
            Vehículo: ${escapeHtml(id)}
            <br>
            Ruta habitual: ${escapeHtml(rutaId)}
            <br>
            <small>Posición GPS independiente de la ruta planificada.</small>
        `);


        marker.on("click", () => {

            if (typeof seleccionarVehiculo === "function") {
                seleccionarVehiculo(id);
            }

        });


        marker.addTo(capas.vehiculos);

        marcadoresVehiculos[id] = marker;
    });


    /*
     * Si hay vehículos, guardamos una posición inicial
     * también en window para la simulación GPS.
     */
    window.POSICIONES_VEHICULOS = posicionesVehiculos;
}


/* ============================================================
   ACTUALIZAR POSICIÓN DE VEHÍCULO
============================================================ */

function actualizarPosicionVehiculo(idVehiculo, lat, lng) {

    if (!coordenadasValidas(lat, lng)) {
        return;
    }

    if (!marcadoresVehiculos[idVehiculo]) {
        return;
    }

    marcadoresVehiculos[idVehiculo].setLatLng([lat, lng]);

    posicionesVehiculos[idVehiculo] = {
        lat,
        lng
    };
}


/* ============================================================
   CENTRAR VEHÍCULO
============================================================ */

function centrarVehiculo(idVehiculo) {

    const marker = marcadoresVehiculos[idVehiculo];

    if (!marker) {
        return;
    }

    mapa.setView(
        marker.getLatLng(),
        Math.max(mapa.getZoom(), 11),
        {
            animate: true
        }
    );

    marker.openPopup();
}


/* ============================================================
   CENTRAR TODOS
============================================================ */

function centrarTodosLosVehiculos() {

    const markers = Object.values(marcadoresVehiculos);

    if (!markers.length) {
        mapa.setView(VALENCIA_CENTER, 9);
        return;
    }

    const grupo = L.featureGroup(markers);

    mapa.fitBounds(
        grupo.getBounds().pad(0.25),
        {
            animate: true,
            maxZoom: 10
        }
    );
}


/* ============================================================
   CENTRAR VALENCIA
============================================================ */

function centrarValencia() {

    mapa.setView(
        VALENCIA_CENTER,
        9,
        {
            animate: true
        }
    );
}


/* ============================================================
   CAPAS
============================================================ */

function configurarCapasMapa() {

    document
        .getElementById("layer-vehiculos")
        ?.addEventListener("change", event => {

            cambiarVisibilidadCapa(
                "vehiculos",
                event.target.checked
            );

        });


    document
        .getElementById("layer-rutas")
        ?.addEventListener("change", event => {

            cambiarVisibilidadCapa(
                "rutas",
                event.target.checked
            );

        });


    document
        .getElementById("layer-puntos")
        ?.addEventListener("change", event => {

            cambiarVisibilidadCapa(
                "puntos",
                event.target.checked
            );

        });


    document
        .getElementById("layer-avisos")
        ?.addEventListener("change", event => {

            cambiarVisibilidadCapa(
                "avisos",
                event.target.checked
            );

        });


    document
        .getElementById("btn-centrar-todos")
        ?.addEventListener("click", centrarTodosLosVehiculos);


    document
        .getElementById("btn-zoom-valencia")
        ?.addEventListener("click", centrarValencia);
}


function cambiarVisibilidadCapa(nombre, visible) {

    if (!mapa || !capas[nombre]) {
        return;
    }

    if (visible) {
        capas[nombre].addTo(mapa);
    } else {
        mapa.removeLayer(capas[nombre]);
    }
}


/* ============================================================
   ESTADO DE AVISO
============================================================ */

function normalizarEstadoAviso(estado) {

    const valor = String(
        estado || "PENDIENTE"
    ).trim().toUpperCase();

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
   ESCAPE HTML
============================================================ */

function escapeHtml(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
```
