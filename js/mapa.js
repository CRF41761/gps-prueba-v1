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

var marcadoresAvisos = {};

var CENTRO_VALENCIA = [39.4699, -0.3763];

/* Modo selección de punto en mapa (una sola parada por clic) */
var vehiculoSeleccionNuevoPunto = null;
var modoSeleccionNuevoPunto = false;
var intervaloIndicacionSeleccionPunto = null;
var seleccionPuntoConfigurada = false;

var TEXTO_SELECCION_PUNTO =
    "SELECCIÓN DE PUNTO · Haz clic en el mapa (Escape para cancelar)";

var TEXTO_ESTADO_MAPA_NORMAL =
    "GPS operativo · posiciones simuladas";


/* ============================================================
   UTILIDADES
============================================================ */

function normalizarCoordenadaMapa(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return NaN;
    }


    if (
        typeof valor === "string" &&
        valor.trim() === ""
    ) {
        return NaN;
    }


    var numero =
        Number(
            String(valor)
                .replace(",", ".")
                .trim()
        );


    return Number.isFinite(numero)
        ? numero
        : NaN;

}


function primeraCoordenadaValidaMapa(candidatos) {

    for (
        var indice = 0;
        indice < candidatos.length;
        indice += 1
    ) {

        var valor =
            normalizarCoordenadaMapa(
                candidatos[indice]
            );


        if (Number.isFinite(valor)) {

            return valor;

        }

    }


    return NaN;

}


function obtenerLatMapa(obj) {
    if (!obj) return NaN;

    return primeraCoordenadaValidaMapa([
        obj.lat,
        obj.latitud,
        obj.latitude,
        obj.y
    ]);
}


function obtenerLngMapa(obj) {
    if (!obj) return NaN;

    return primeraCoordenadaValidaMapa([
        obj.lng,
        obj.longitud,
        obj.longitude,
        obj.lon,
        obj.x
    ]);
}


function coordenadasValidasMapa(lat, lng) {
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

    configurarSeleccionPuntoEnMapa();
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


function obtenerPlanMapa(vehiculoId) {

    try {

        if (
            typeof planificacionDia === "undefined" ||
            !planificacionDia
        ) {
            return null;
        }

        return (
            planificacionDia[
                String(vehiculoId)
            ] ||
            null
        );

    } catch (error) {

        return null;
    }
}


function obtenerVehiculoPlanSeleccionadoMapa() {

    try {

        if (
            typeof vehiculoPlanSeleccionado === "undefined" ||
            !vehiculoPlanSeleccionado
        ) {
            return null;
        }

        return String(
            vehiculoPlanSeleccionado
        );

    } catch (error) {

        return null;
    }
}


function normalizarCoordenadasRutaCalculadaMapa(coordenadas) {

    if (!Array.isArray(coordenadas)) {
        return [];
    }


    var normalizadas = [];


    for (
        var indice = 0;
        indice < coordenadas.length;
        indice++
    ) {

        var punto =
            coordenadas[indice];


        if (!Array.isArray(punto)) {
            return [];
        }


        var lat =
            normalizarCoordenadaMapa(
                punto[0]
            );


        var lng =
            normalizarCoordenadaMapa(
                punto[1]
            );


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return [];
        }


        normalizadas.push(
            [lat, lng]
        );
    }


    return normalizadas.length >= 2
        ? normalizadas
        : [];
}


function obtenerCoordenadasRutaCalculadaMapa(plan) {

    if (
        !plan ||
        !Array.isArray(plan.paradas) ||
        plan.paradas.length === 0
    ) {
        return [];
    }


    var calculos =
        plan.calculosRuta;


    if (
        !calculos ||
        calculos.estado !== "OK" ||
        calculos.geometriaEstado !== "OK"
    ) {
        return [];
    }


    return normalizarCoordenadasRutaCalculadaMapa(
        calculos.geometria
    );
}


function dibujarRutaCalculadaSeleccionada() {

    var vehiculoId =
        obtenerVehiculoPlanSeleccionadoMapa();


    if (!vehiculoId) {
        return;
    }


    var plan =
        obtenerPlanMapa(
            vehiculoId
        );


    var coordenadas =
        obtenerCoordenadasRutaCalculadaMapa(
            plan
        );


    if (!coordenadas.length) {
        return;
    }


    var rutaId =
        String(
            plan.rutaActiva ||
            ""
        ).toUpperCase();


    var linea = L.polyline(
        coordenadas,
        {
            color: obtenerColorRuta(rutaId),
            weight: 6,
            opacity: 0.95,
            lineJoin: "round"
        }
    );


    linea.bindPopup(
        "<strong>Recorrido calculado</strong><br>" +
        "Vehículo: " +
        escaparHTML(vehiculoId) +
        "<br>" +
        "Ruta diaria: " +
        escaparHTML(
            rutaId || "Sin ruta asignada"
        ) +
        "<br><small>" +
        "Trazado real devuelto por el cálculo de rutas." +
        "</small>"
    );


    linea.addTo(capas.rutas);
}


function dibujarRutas() {

    if (!capas.rutas) return;

    capas.rutas.clearLayers();

    var rutas = obtenerRutasGeometricasMock();

    rutas.forEach(function(ruta) {

        var casilla = document.getElementById(
            "capa-ruta-" + String(ruta.ruta_id).toUpperCase()
        );

        if (casilla && !casilla.checked) return;

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
            "Trazado estático de referencia<br>" +
            "<small>No es el recorrido diario calculado. " +
            "La posición GPS del vehículo se muestra por separado.</small>"
        );


        linea.addTo(capas.rutas);
    });


    dibujarRutaCalculadaSeleccionada();
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

        var lat = obtenerLatMapa(punto);
        var lng = obtenerLngMapa(punto);

        if (!coordenadasValidasMapa(lat, lng)) {
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

function obtenerIdAvisoMapa(aviso) {

    if (!aviso) {
        return null;
    }


    if (typeof obtenerIdAviso === "function") {

        var id =
            obtenerIdAviso(aviso);


        if (
            id !== null &&
            id !== undefined &&
            String(id).trim() !== ""
        ) {

            return id;

        }

    }


    return (
        aviso.id_aviso ||
        aviso.aviso_id ||
        aviso.id ||
        aviso.ID_AVISO ||
        aviso.AVISO_ID ||
        null
    );

}


function buscarPuntoAvisoMapa(aviso) {

    if (!aviso) {
        return null;
    }


    if (
        aviso.punto &&
        typeof aviso.punto === "object" &&
        coordenadasValidasMapa(
            obtenerLatMapa(aviso.punto),
            obtenerLngMapa(aviso.punto)
        )
    ) {

        return aviso.punto;

    }


    if (
        aviso.punto_recogida &&
        typeof aviso.punto_recogida === "object" &&
        coordenadasValidasMapa(
            obtenerLatMapa(aviso.punto_recogida),
            obtenerLngMapa(aviso.punto_recogida)
        )
    ) {

        return aviso.punto_recogida;

    }


    var datos =
        window.DATOS_MOCK || {};


    var puntos =
        Array.isArray(datos.PUNTOS_RECOGIDA)
            ? datos.PUNTOS_RECOGIDA
            : [];


    var candidatos = [
        aviso.punto_id,
        aviso.puntoId,
        aviso.id_punto,
        aviso.PUNTO_ID
    ];


    if (
        typeof aviso.punto === "string" ||
        typeof aviso.punto === "number"
    ) {

        candidatos.push(
            aviso.punto
        );

    }


    var ids =
        candidatos
            .filter(
                function(valor) {

                    return (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor).trim() !== ""
                    );

                }
            )
            .map(
                function(valor) {

                    return String(valor).trim();

                }
            );


    if (ids.length === 0) {
        return null;
    }


    return (
        puntos.find(
            function(punto) {

                var idsPunto = [
                    punto.punto_id,
                    punto.id_punto,
                    punto.id,
                    punto.PUNTO_ID,
                    punto.ID_PUNTO
                ];


                return idsPunto.some(
                    function(valor) {

                        return (
                            valor !== null &&
                            valor !== undefined &&
                            ids.indexOf(
                                String(valor).trim()
                            ) !== -1
                        );

                    }
                );

            }
        ) ||
        null
    );

}


function resolverCoordenadasAviso(aviso) {

    var lat =
        obtenerLatMapa(aviso);

    var lng =
        obtenerLngMapa(aviso);


    if (!coordenadasValidasMapa(lat, lng)) {

        lat =
            primeraCoordenadaValidaMapa([
                aviso && aviso.lat_aviso,
                aviso && aviso.latitud_aviso
            ]);


        lng =
            primeraCoordenadaValidaMapa([
                aviso && aviso.lng_aviso,
                aviso && aviso.longitud_aviso
            ]);

    }


    if (
        !coordenadasValidasMapa(lat, lng) &&
        aviso &&
        aviso.coordenadas
    ) {

        if (Array.isArray(aviso.coordenadas)) {

            lat =
                normalizarCoordenadaMapa(
                    aviso.coordenadas[0]
                );

            lng =
                normalizarCoordenadaMapa(
                    aviso.coordenadas[1]
                );

        } else if (
            typeof aviso.coordenadas === "object"
        ) {

            lat =
                obtenerLatMapa(
                    aviso.coordenadas
                );

            lng =
                obtenerLngMapa(
                    aviso.coordenadas
                );

        }

    }


    if (!coordenadasValidasMapa(lat, lng)) {

        var punto =
            buscarPuntoAvisoMapa(
                aviso
            );


        if (punto) {

            lat =
                obtenerLatMapa(punto);

            lng =
                obtenerLngMapa(punto);

        }

    }


    if (!coordenadasValidasMapa(lat, lng)) {

        return {
            lat: NaN,
            lng: NaN,
            valido: false
        };

    }


    return {
        lat: lat,
        lng: lng,
        valido: true
    };

}


/*
 * Un aviso está asignado cuando el modelo lo confirma mediante
 * su pertenencia al plan vigente o mediante el estado ASIGNADO
 * junto con un vehículo. Un estado ASIGNADO aislado, sin plan ni
 * vehículo, es ambiguo y no recibe la marca de asignación.
 */
function avisoEstaAsignadoMapa(aviso) {

    if (!aviso) {
        return false;
    }


    var estado =
        normalizarEstadoAviso(
            aviso.estado
        );


    if (estado === "RECOGIDO") {
        return false;
    }


    var id =
        obtenerIdAvisoMapa(
            aviso
        );


    if (
        id !== null &&
        id !== undefined &&
        typeof avisoEstaPlanificadoEnFechaSeleccionada ===
            "function"
    ) {

        try {

            if (
                avisoEstaPlanificadoEnFechaSeleccionada(
                    id
                )
            ) {
                return true;
            }

        } catch (error) {
            /* Sin plan disponible se usa la validación siguiente. */
        }
    }


    if (estado !== "ASIGNADO") {
        return false;
    }


    var vehiculo =
        aviso.vehiculo_id ||
        aviso.vehiculo ||
        aviso.id_vehiculo ||
        aviso.VEHICULO_ID ||
        aviso.VEHICULO;


    return (
        vehiculo !== null &&
        vehiculo !== undefined &&
        String(vehiculo).trim() !== ""
    );
}


function crearMarcadorAvisoMapa(aviso) {

    var coordenadas =
        resolverCoordenadasAviso(
            aviso
        );


    if (!coordenadas.valido) {
        return null;
    }


    var estado =
        normalizarEstadoAviso(
            aviso.estado
        );


    var clase =
        "alert-pending";

    var contenido =
        "!";


    if (estado === "RECOGIDO") {

        clase =
            "alert-collected";

        contenido =
            '<span class="alert-map-check" aria-hidden="true">✓</span>';

    } else if (
        avisoEstaAsignadoMapa(
            aviso
        )
    ) {

        clase =
            "alert-assigned alert-assigned-confirmed";

        contenido =
            '<span class="alert-map-check" aria-hidden="true">✓</span>';

    } else if (estado === "ASIGNADO") {

        /*
         * Estado incompleto: se conserva la presentación amarilla
         * anterior, sin afirmar una asignación no confirmada.
         */
        clase =
            "alert-assigned";
    }


    var icono = L.divIcon({

        className:
            "alert-map-marker-wrapper",

        html:
            '<div class="alert-map-marker ' +
            clase +
            '">' +
            contenido +
            '</div>',

        iconSize: [25, 25],
        iconAnchor: [12, 12]

    });


    var marker = L.marker(
        [
            coordenadas.lat,
            coordenadas.lng
        ],
        { icon: icono }
    );


    var id =
        obtenerIdAvisoMapa(
            aviso
        );


    var especie =
        aviso.especie ||
        aviso.especie_indicada ||
        aviso.especie_reportada ||
        "Especie no determinada";


    marker.bindPopup(
        "<strong>" +
        escaparHTML(
            id !== null && id !== undefined
                ? id
                : "Aviso"
        ) +
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


    return {
        marker: marker,
        id: id
    };

}


function dibujarAvisos() {

    if (!capas.avisos) return;

    capas.avisos.clearLayers();

    marcadoresAvisos = {};

    var avisos = [];

    if (
        window.DATOS_MOCK &&
        Array.isArray(window.DATOS_MOCK.AVISOS)
    ) {
        avisos = window.DATOS_MOCK.AVISOS;
    }


    avisos.forEach(function(aviso) {

        var creado =
            crearMarcadorAvisoMapa(
                aviso
            );


        if (!creado) {
            return;
        }


        if (
            creado.id !== null &&
            creado.id !== undefined
        ) {

            marcadoresAvisos[
                String(creado.id)
            ] = creado.marker;

        }


        creado.marker.addTo(
            capas.avisos
        );

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
                obtenerLatMapa(
                    posicionEncontrada
                );


            var lng =
                obtenerLngMapa(
                    posicionEncontrada
                );


            if (
                !coordenadasValidasMapa(
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


            var rutaHabitualId =
                String(
                    vehiculo.ruta_habitual_identificada ||
                    vehiculo.rutaHabitual ||
                    vehiculo.ruta_habitual ||
                    vehiculo.ruta_id ||
                    vehiculo.ruta ||
                    ""
                ).toUpperCase();


            var plan =
                obtenerPlanMapa(id);


            var rutaDiariaId =
                plan
                    ? String(
                        plan.rutaActiva ||
                        ""
                    ).toUpperCase()
                    : "";


            /*
             * El color del marcador representa la ruta diaria cuando
             * existe un plan para el vehículo. Si el plan no tiene
             * ruta, se usa el color neutro: nunca se pinta como una
             * ruta R1/R2/R3 que no ha sido seleccionada.
             */
            var rutaColorId =
                plan
                    ? rutaDiariaId
                    : rutaHabitualId;


            var color =
                obtenerColorRuta(
                    rutaColorId
                );


            var tablet =
                vehiculo.tablet ||
                vehiculo.tablet_id ||
                vehiculo.id_tablet ||
                "";


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
                        (tablet ? " · " + escaparHTML(tablet) : "") +
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
                escaparHTML(rutaHabitualId) +
                "<br>" +
                "Ruta diaria: " +
                escaparHTML(
                    plan
                        ? (
                            rutaDiariaId ||
                            "Sin ruta asignada"
                        )
                        : "Sin planificación cargada"
                ) +
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
        !coordenadasValidasMapa(
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
            animate: false
        }
    );


    marcadoresVehiculos[
        idVehiculo
    ].openPopup();
}


/* ============================================================
   VER AVISO EN MAPA
============================================================ */

function verAvisoEnMapa(avisoId) {

    var aviso =
        typeof encontrarAvisoPorId === "function"
            ? encontrarAvisoPorId(avisoId)
            : null;


    if (
        !aviso &&
        typeof buscarAvisoAplicacionPorId ===
            "function"
    ) {

        aviso =
            buscarAvisoAplicacionPorId(
                avisoId
            );

    }


    if (!aviso) {

        alert("No se ha encontrado el aviso.");

        return;
    }


    var coordenadas =
        resolverCoordenadasAviso(
            aviso
        );


    if (!coordenadas.valido) {

        alert(
            "Este aviso no tiene ubicación disponible. " +
            "Revisa las coordenadas del punto de recogida asociado."
        );

        return;
    }


    if (!mapa) {

        alert(
            "El mapa todavía no está disponible. " +
            "Inténtalo de nuevo cuando termine de cargar."
        );

        return;
    }


    if (
        !capas ||
        !capas.avisos
    ) {

        alert(
            "La capa de avisos del mapa todavía no está disponible. " +
            "Inténtalo de nuevo cuando termine de cargar."
        );

        return;
    }


    var casilla =
        document.getElementById(
            "capa-avisos"
        );


    if (
        casilla &&
        !casilla.checked
    ) {

        casilla.checked = true;

        if (
            typeof cambiarVisibilidadCapa ===
                "function"
        ) {
            cambiarVisibilidadCapa(
                "avisos",
                true
            );
        }
    }


    /*
     * Redibujar antes de buscar el marcador evita depender de una
     * caché antigua tras crear, editar o eliminar un aviso.
     */
    if (
        typeof dibujarAvisos ===
        "function"
    ) {

        dibujarAvisos();

    }


    var id =
        obtenerIdAvisoMapa(
            aviso
        );


    var marker =
        marcadoresAvisos[String(id)] ||
        marcadoresAvisos[String(avisoId)];


    if (!marker) {

        var creado =
            crearMarcadorAvisoMapa(
                aviso
            );


        if (
            creado &&
            creado.marker
        ) {

            marker =
                creado.marker;


            if (capas.avisos) {

                marker.addTo(
                    capas.avisos
                );

            }


            if (
                creado.id !== null &&
                creado.id !== undefined
            ) {

                marcadoresAvisos[
                    String(creado.id)
                ] = marker;

            }

        }

    }


    if (!marker) {

        alert(
            "No se ha podido representar la ubicación del aviso en el mapa."
        );

        return;
    }


    mapa.setView(
        marker.getLatLng(),
        Math.max(
            mapa.getZoom(),
            13
        ),
        {
            animate: false
        }
    );


    marker.openPopup();
}


if (typeof window !== "undefined") {
    window.verAvisoEnMapa = verAvisoEnMapa;
}

if (typeof globalThis !== "undefined") {
    globalThis.verAvisoEnMapa = verAvisoEnMapa;
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

    ["capa-vehiculos", "vehiculos"],

    ["capa-puntos", "puntos"],

    ["capa-avisos", "avisos"]

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


    var btnCentrarMapa =
        document.getElementById(
            "btn-centrar-mapa"
        );


    if (btnCentrarMapa) {

        btnCentrarMapa.addEventListener(
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


/* ============================================================
   SELECCIÓN DE PUNTO EN MAPA
============================================================ */

function configurarSeleccionPuntoEnMapa() {

    if (seleccionPuntoConfigurada) {
        return;
    }

    seleccionPuntoConfigurada = true;


    /* Único listener de clic del mapa. Comprueba al principio
       si el modo está activo, así el comportamiento normal
       del mapa permanece intacto. */

    if (mapa) {

        mapa.on(
            "click",
            manejarClicMapaSeleccionPunto
        );
    }


    /* Único listener de teclado. Escape solo actúa si el
       modo de selección está activo. */

    document.addEventListener(
        "keydown",
        manejarTeclaSeleccionPunto
    );
}


function mostrarIndicacionSeleccionPunto() {

    var elemento =
        document.getElementById(
            "map-status-text"
        );


    var indicador =
        document.getElementById(
            "map-status"
        );


    var punto =
        document.querySelector(
            "#map-status .status-dot"
        );


    /* Anula el temporizador de 2500 ms de actualizarEstadoMapa()
       para que la indicación no se restaure sola. */

    window.clearTimeout(
        window._estadoMapaTimeout
    );


    if (elemento) {

        elemento.textContent =
            TEXTO_SELECCION_PUNTO;
    }


    if (punto) {

        punto.style.background =
            "#D97706";
    }


    /* El indicador no debe interceptar el clic de selección. */

    if (indicador) {

        indicador.style.pointerEvents =
            "none";
    }


    /* Reafirma la indicación mientras el modo siga activo,
       por si otra parte de la app vuelve a escribir el estado. */

    window.clearInterval(
        intervaloIndicacionSeleccionPunto
    );


    intervaloIndicacionSeleccionPunto =
        window.setInterval(
            function() {

                if (!modoSeleccionNuevoPunto) {
                    return;
                }

                window.clearTimeout(
                    window._estadoMapaTimeout
                );

                var texto =
                    document.getElementById(
                        "map-status-text"
                    );

                if (texto) {

                    texto.textContent =
                        TEXTO_SELECCION_PUNTO;
                }
            },
            1000
        );
}


function ocultarIndicacionSeleccionPunto() {

    window.clearInterval(
        intervaloIndicacionSeleccionPunto
    );

    intervaloIndicacionSeleccionPunto = null;


    window.clearTimeout(
        window._estadoMapaTimeout
    );


    var indicador =
        document.getElementById(
            "map-status"
        );


    if (indicador) {

        indicador.style.pointerEvents =
            "";
    }


    var punto =
        document.querySelector(
            "#map-status .status-dot"
        );


    if (punto) {

        punto.style.background =
            "";
    }


    var elemento =
        document.getElementById(
            "map-status-text"
        );


    if (elemento) {

        elemento.textContent =
            TEXTO_ESTADO_MAPA_NORMAL;
    }
}


function activarSeleccionPuntoMapa(
    vehiculoId
) {

    if (
        vehiculoId === null ||
        vehiculoId === undefined ||
        String(vehiculoId) === ""
    ) {
        return false;
    }


    vehiculoSeleccionNuevoPunto =
        String(vehiculoId);


    modoSeleccionNuevoPunto = true;


    if (mapa && mapa.getContainer()) {

        mapa.getContainer().style.cursor =
            "crosshair";
    }


    mostrarIndicacionSeleccionPunto();


    return true;
}


function desactivarSeleccionPuntoMapa() {

    modoSeleccionNuevoPunto = false;

    vehiculoSeleccionNuevoPunto = null;


    if (mapa && mapa.getContainer()) {

        mapa.getContainer().style.cursor =
            "";
    }


    ocultarIndicacionSeleccionPunto();
}


function manejarClicMapaSeleccionPunto(
    evento
) {

    if (!modoSeleccionNuevoPunto) {
        return;
    }


    if (!evento || !evento.latlng) {
        return;
    }


    var lat =
        Number(evento.latlng.lat);


    var lng =
        Number(evento.latlng.lng);


    /* Validación explícita: null, undefined, NaN o valores
       fuera de rango nunca se aceptan. */

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        return;
    }


    var vehiculoId =
        vehiculoSeleccionNuevoPunto;


    /* Un solo clic: se desactiva antes de crear la parada
       para que un segundo clic no añada otra. */

    desactivarSeleccionPuntoMapa();


    if (!vehiculoId) {
        return;
    }


    if (
        typeof window.crearParadaDesdeMapa ===
            "function"
    ) {

        window.crearParadaDesdeMapa(
            vehiculoId,
            lat,
            lng
        );
    }
}


function manejarTeclaSeleccionPunto(
    evento
) {

    if (!modoSeleccionNuevoPunto) {
        return;
    }


    if (!evento) {
        return;
    }


    if (
        evento.key !== "Escape" &&
        evento.key !== "Esc"
    ) {
        return;
    }


    desactivarSeleccionPuntoMapa();
}


window.activarSeleccionPuntoMapa =
    activarSeleccionPuntoMapa;
