```javascript
/* ============================================================
   CRF - MAPA OPERATIVO
   Version limpia y sin template literals
============================================================ */

var mapa = null;

var capas = {
    rutas: null,
    puntos: null,
    avisos: null,
    vehiculos: null
};

var marcadoresVehiculos = {};
var posicionesVehiculos = {};

var CENTRO_VALENCIA = [39.4699, -0.3763];


/* ============================================================
   UTILIDADES
============================================================ */

function obtenerLat(obj) {
    if (!obj) return NaN;

    return Number(
        obj.lat !== undefined ? obj.lat :
        obj.latitud !== undefined ? obj.latitud :
        obj.latitude !== undefined ? obj.latitude :
        obj.y
    );
}


function obtenerLng(obj) {
    if (!obj) return NaN;

    return Number(
        obj.lng !== undefined ? obj.lng :
        obj.longitud !== undefined ? obj.longitud :
        obj.longitude !== undefined ? obj.longitude :
        obj.lon !== undefined ? obj.lon :
        obj.x
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


function escaparHTML(valor) {
    return String(valor === undefined || valor === null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function obtenerIdVehiculo(vehiculo, indice) {
    if (vehiculo.id_vehiculo !== undefined) {
        return String(vehiculo.id_vehiculo);
    }

    if (vehiculo.vehiculo_id !== undefined) {
        return String(vehiculo.vehiculo_id);
    }

    if (vehiculo.id !== undefined) {
        return String(vehiculo.id);
    }

    return "V" + (indice + 1);
}


/* ============================================================
   INICIALIZAR MAPA
============================================================ */

function inicializarMapa() {

    mapa = L.map("map", {
        zoomControl: true,
        preferCanvas: true
    }).setView(CENTRO_VALENCIA, 9);


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
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
   RUTAS
============================================================ */

function obtenerColorRuta(id) {

    id = String(id || "").toUpperCase();

    if (id === "R1") return "#1976D2";
    if (id === "R2") return "#388E3C";
    if (id === "R3") return "#F57C00";

    return "#467886";
}


function dibujarRutas() {

    if (!capas.rutas) return;

    capas.rutas.clearLayers();

    var rutas = obtenerRutasGeometricasMock();

    rutas.forEach(function(ruta) {

        var linea = L.polyline(
            ruta.coordenadas,
            {
                color: obtenerColorRuta(ruta.ruta_id),
                weight: 5,
                opacity: 0.78,
                lineJoin: "round"
            }
        );


        linea.bindPopup(
            "<strong>" +
            escaparHTML(ruta.nombre) +
            "</strong><br>" +
            "Ruta planificada<br>" +
            "<small>La posición GPS del vehículo se muestra por separado.</small>"
        );


        linea.addTo(capas.rutas);
    });
}


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
   PUNTOS
============================================================ */

function dibujarPuntos() {

    if (!capas.puntos) return;

    capas.puntos.clearLayers();

    var puntos = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(window.DATOS_MOCK.PUNTOS_RECOGIDA)
    ) {
        puntos = window.DATOS_MOCK.PUNTOS_RECOGIDA;
    }


    puntos.forEach(function(punto) {

        var lat = obtenerLat(punto);
        var lng = obtenerLng(punto);

        if (!coordenadasValidas(lat, lng)) {
            return;
        }


        var icono = L.divIcon({
            className: "point-map-marker-wrapper",
            html: '<div class="point-map-marker"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });


        var marker = L.marker(
            [lat, lng],
            { icon: icono }
        );


        var nombre =
            punto.nombre ||
            punto.nombre_punto ||
            "Punto colaborador";


        var tipo =
            punto.tipo ||
            "Colaborador";


        var municipio =
            punto.municipio ||
            "";


        marker.bindPopup(
            "<strong>" +
            escaparHTML(nombre) +
            "</strong><br>" +
            escaparHTML(tipo) +
            "<br><small>" +
            escaparHTML(municipio) +
            "</small>"
        );


        marker.addTo(capas.puntos);
    });
}


/* ============================================================
   AVISOS
============================================================ */

function dibujarAvisos() {

    if (!capas.avisos) return;

    capas.avisos.clearLayers();

    var avisos = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(window.DATOS_MOCK.AVISOS)
    ) {
        avisos = window.DATOS_MOCK.AVISOS;
    }


    avisos.forEach(function(aviso) {

        var lat = obtenerLat(aviso);
        var lng = obtenerLng(aviso);

        if (!coordenadasValidas(lat, lng)) {
            return;
        }


        var estado =
            normalizarEstadoAviso(
                aviso.estado
            );


        var clase =
            "alert-pending";


        if (estado === "ASIGNADO") {
            clase = "alert-assigned";
        }

        if (estado === "RECOGIDO") {
            clase = "alert-collected";
        }


        var icono = L.divIcon({

            className:
                "alert-map-marker-wrapper",

            html:
                '<div class="alert-map-marker ' +
                clase +
                '">!</div>',

            iconSize: [25, 25],
            iconAnchor: [12, 12]

        });


        var marker = L.marker(
            [lat, lng],
            { icon: icono }
        );


        var id =
            aviso.id_aviso ||
            aviso.aviso_id ||
            aviso.id ||
            "Aviso";


        var especie =
            aviso.especie ||
            aviso.especie_reportada ||
            "Especie no determinada";


        marker.bindPopup(
            "<strong>" +
            escaparHTML(id) +
            "</strong><br>" +
            "<b>" +
            escaparHTML(especie) +
            "</b><br>" +
            "Estado: " +
            escaparHTML(estado)
        );


        marker.on(
            "click",
            function() {

                if (
                    typeof seleccionarAviso ===
                    "function"
                ) {
                    seleccionarAviso(aviso);
                }

            }
        );


        marker.addTo(capas.avisos);
    });
}


/* ============================================================
   VEHÍCULOS
============================================================ */

function dibujarVehiculos() {

    if (!capas.vehiculos) return;

    capas.vehiculos.clearLayers();

    marcadoresVehiculos = {};
    posicionesVehiculos = {};


    var vehiculos = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(window.DATOS_MOCK.VEHICULOS)
    ) {
        vehiculos =
            window.DATOS_MOCK.VEHICULOS;
    }


    var posiciones = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(window.DATOS_MOCK.POSICIONES)
    ) {
        posiciones =
            window.DATOS_MOCK.POSICIONES;
    }


    var posicionesIniciales = [

        [39.485, -0.410],

        [39.440, -0.475],

        [39.400, -0.355]

    ];


    vehiculos.forEach(
        function(vehiculo, indice) {

            var id =
                obtenerIdVehiculo(
                    vehiculo,
                    indice
                );


            var posicionEncontrada =
                null;


            posiciones.some(
                function(posicion) {

                    var idPos =
                        posicion.id_vehiculo !== undefined
                            ? String(posicion.id_vehiculo)
                            : posicion.vehiculo_id !== undefined
                                ? String(posicion.vehiculo_id)
                                : posicion.id !== undefined
                                    ? String(posicion.id)
                                    : "";


                    if (idPos === id) {

                        posicionEncontrada =
                            posicion;

                        return true;
                    }

                    return false;
                }
            );


            var lat =
                obtenerLat(
                    posicionEncontrada
                );


            var lng =
                obtenerLng(
                    posicionEncontrada
                );


            if (
                !coordenadasValidas(
                    lat,
                    lng
                )
            ) {

                var inicial =
                    posicionesIniciales[
                        indice
                    ] ||
                    CENTRO_VALENCIA;


                lat = inicial[0];
                lng = inicial[1];
            }


            posicionesVehiculos[id] = {
                lat: lat,
                lng: lng
            };


            var rutaId =
                String(
                    vehiculo.ruta_id ||
                    vehiculo.ruta_habitual ||
                    vehiculo.ruta ||
                    "R" + (indice + 1)
                ).toUpperCase();


            var color =
                obtenerColorRuta(
                    rutaId
                );


            var icono =
                L.divIcon({

                    className:
                        "vehicle-map-marker",

                    html:
                        '<div class="vehicle-marker" ' +
                        'style="border-color:' +
                        color +
                        '">🚐</div>' +

                        '<div class="vehicle-marker-label">' +
                        escaparHTML(id) +
                        "</div>",

                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
                    popupAnchor: [0, -20]

                });


            var marker =
                L.marker(
                    [lat, lng],
                    {
                        icon: icono,
                        zIndexOffset: 1000
                    }
                );


            marker.bindPopup(
                "<strong>" +
                escaparHTML(
                    vehiculo.nombre ||
                    "Vehículo " + id
                ) +
                "</strong><br>" +
                "Vehículo: " +
                escaparHTML(id) +
                "<br>" +
                "Ruta habitual: " +
                escaparHTML(rutaId) +
                "<br><small>" +
                "GPS independiente de la ruta planificada." +
                "</small>"
            );


            marker.on(
                "click",
                function() {

                    if (
                        typeof seleccionarVehiculo ===
                        "function"
                    ) {
                        seleccionarVehiculo(id);
                    }

                }
            );


            marker.addTo(
                capas.vehiculos
            );


            marcadoresVehiculos[id] =
                marker;

        }
    );


    window.POSICIONES_VEHICULOS =
        posicionesVehiculos;
}


/* ============================================================
   ACTUALIZAR VEHÍCULO
============================================================ */

function actualizarPosicionVehiculo(
    idVehiculo,
    lat,
    lng
) {

    if (
        !coordenadasValidas(
            lat,
            lng
        )
    ) {
        return;
    }


    if (
        !marcadoresVehiculos[idVehiculo]
    ) {
        return;
    }


    marcadoresVehiculos[
        idVehiculo
    ].setLatLng(
        [lat, lng]
    );


    posicionesVehiculos[
        idVehiculo
    ] = {
        lat: lat,
        lng: lng
    };
}


/* ============================================================
   CENTRAR VEHÍCULO
============================================================ */

function centrarVehiculo(idVehiculo) {

    if (
        !mapa ||
        !marcadoresVehiculos[idVehiculo]
    ) {
        return;
    }


    mapa.setView(
        marcadoresVehiculos[
            idVehiculo
        ].getLatLng(),

        Math.max(
            mapa.getZoom(),
            11
        ),

        {
            animate: true
        }
    );


    marcadoresVehiculos[
        idVehiculo
    ].openPopup();
}


/* ============================================================
   CENTRAR TODOS
============================================================ */

function centrarTodosLosVehiculos() {

    if (!mapa) return;

    var markers =
        Object.values(
            marcadoresVehiculos
        );


    if (!markers.length) {

        mapa.setView(
            CENTRO_VALENCIA,
            9
        );

        return;
    }


    var grupo =
        L.featureGroup(
            markers
        );


    mapa.fitBounds(
        grupo.getBounds().pad(0.25),
        {
            animate: true,
            maxZoom: 10
        }
    );
}


/* ============================================================
   VALENCIA
============================================================ */

function centrarValencia() {

    if (!mapa) return;

    mapa.setView(
        CENTRO_VALENCIA,
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

    var elementos = [

        ["layer-vehiculos", "vehiculos"],

        ["layer-rutas", "rutas"],

        ["layer-puntos", "puntos"],

        ["layer-avisos", "avisos"]

    ];


    elementos.forEach(
        function(item) {

            var elemento =
                document.getElementById(
                    item[0]
                );


            if (!elemento) return;


            elemento.addEventListener(
                "change",
                function() {

                    cambiarVisibilidadCapa(
                        item[1],
                        elemento.checked
                    );

                }
            );

        }
    );


    var btnTodos =
        document.getElementById(
            "btn-centrar-todos"
        );


    if (btnTodos) {

        btnTodos.addEventListener(
            "click",
            centrarTodosLosVehiculos
        );

    }


    var btnValencia =
        document.getElementById(
            "btn-zoom-valencia"
        );


    if (btnValencia) {

        btnValencia.addEventListener(
            "click",
            centrarValencia
        );

    }
}


function cambiarVisibilidadCapa(
    nombre,
    visible
) {

    if (
        !mapa ||
        !capas[nombre]
    ) {
        return;
    }


    if (visible) {

        capas[nombre].addTo(
            mapa
        );

    } else {

        mapa.removeLayer(
            capas[nombre]
        );

    }
}


/* ============================================================
   ESTADO AVISO
============================================================ */

function normalizarEstadoAviso(
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
```
