/* =========================================================
   MAPA
========================================================= */

let mapa;

let capaRutas;
let capaPuntos;
let capaAvisos;
let capaVehiculos;

const marcadoresVehiculos = {};
const marcadoresAvisos = {};
const marcadoresPuntos = {};

const polilineasRutas = {};


function inicializarMapa() {

    mapa = L.map("map").setView(
        CONFIG.mapa.centro,
        CONFIG.mapa.zoom
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(mapa);


    capaRutas = L.layerGroup().addTo(mapa);

    capaPuntos = L.layerGroup().addTo(mapa);

    capaAvisos = L.layerGroup().addTo(mapa);

    capaVehiculos = L.layerGroup().addTo(mapa);


    document
        .getElementById("capaRutas")
        .addEventListener(
            "change",
            controlarCapas
        );

    document
        .getElementById("capaPuntos")
        .addEventListener(
            "change",
            controlarCapas
        );

    document
        .getElementById("capaAvisos")
        .addEventListener(
            "change",
            controlarCapas
        );

    document
        .getElementById("capaVehiculos")
        .addEventListener(
            "change",
            controlarCapas
        );
}


/* =========================================================
   RUTAS
========================================================= */

function dibujarRutas(rutas) {

    capaRutas.clearLayers();

    rutas.forEach(ruta => {

        const coordenadas =
            obtenerCoordenadasRuta(
                ruta.id
            );

        if (!coordenadas.length) {
            return;
        }

        const linea = L.polyline(
            coordenadas,
            {
                color: ruta.color,

                weight: 5,

                opacity: 0.65,

                lineCap: "round",

                lineJoin: "round"
            }
        );

        linea.bindTooltip(
            `Ruta ${ruta.id} · ${ruta.nombre}`,
            {
                sticky: true
            }
        );

        linea.addTo(capaRutas);

        polilineasRutas[ruta.id] = linea;
    });
}


/* =========================================================
   COORDENADAS SIMULADAS DE LAS RUTAS
========================================================= */

function obtenerCoordenadasRuta(id) {

    const rutas = {

        R1: [

            [39.4699, -0.3763],
            [39.4900, -0.3900],
            [39.5100, -0.4050],
            [39.5000, -0.3490],
            [39.5400, -0.3500],
            [39.5800, -0.3900]

        ],

        R2: [

            [39.4699, -0.3763],
            [39.4700, -0.5000],
            [39.4720, -0.7170],
            [39.4940, -0.6860],
            [39.5890, -0.4610]

        ],

        R3: [

            [39.4699, -0.3763],
            [39.4300, -0.4000],
            [39.4050, -0.4020],
            [39.3000, -0.4200],
            [39.1920, -0.4350],
            [39.1500, -0.4500]

        ]

    };

    return rutas[id] || [];
}


/* =========================================================
   PUNTOS PERMANENTES
========================================================= */

function dibujarPuntos(puntos) {

    capaPuntos.clearLayers();

    puntos.forEach(punto => {

        const icono = L.divIcon({

            className: "",

            html:
                `<div class="point-marker">P</div>`,

            iconSize: [25, 25],

            iconAnchor: [12, 12]

        });


        const marcador = L.marker(
            [
                punto.latitud,
                punto.longitud
            ],
            {
                icon: icono
            }
        );


        marcador.bindPopup(`

            <strong>${punto.nombre}</strong>

            <br>

            ${punto.municipio}

            <br><br>

            <small>
                Punto permanente
            </small>

        `);


        marcador.addTo(capaPuntos);

        marcadoresPuntos[punto.id] =
            marcador;
    });
}


/* =========================================================
   AVISOS
========================================================= */

function dibujarAvisos(avisos) {

    capaAvisos.clearLayers();

    avisos.forEach(aviso => {

        let clase = "pending";

        let simbolo = "!";

        if (aviso.estado === "ASIGNADO") {

            clase = "assigned";

            simbolo = "→";

        }

        if (aviso.estado === "RECOGIDO") {

            clase = "collected";

            simbolo = "✓";
        }


        const icono = L.divIcon({

            className: "",

            html:
                `<div class="notice-marker ${clase}">
                    ${simbolo}
                </div>`,

            iconSize: [28, 28],

            iconAnchor: [14, 14]

        });


        const marcador = L.marker(

            [
                aviso.latitud,
                aviso.longitud
            ],

            {
                icon: icono
            }

        );


        marcador.bindPopup(`

            <strong>${aviso.punto}</strong>

            <br><br>

            <strong>Especie:</strong>
            ${aviso.especie}

            <br>

            <strong>Animales:</strong>
            ${aviso.cantidad}

            <br>

            <strong>Estado:</strong>
            ${aviso.estado}

            <br>

            <strong>Ruta:</strong>
            ${aviso.ruta}

            <br>

            <strong>Vehículo:</strong>
            ${aviso.vehiculo || "Sin asignar"}

            <br><br>

            <small>
                ${aviso.observaciones}
            </small>

        `);


        marcador.addTo(capaAvisos);

        marcadoresAvisos[aviso.id] =
            marcador;
    });
}


/* =========================================================
   VEHÍCULOS
========================================================= */

function dibujarVehiculos(posiciones) {

    capaVehiculos.clearLayers();

    Object
        .values(posiciones)
        .forEach(posicion => {

            crearOMoverVehiculo(
                posicion
            );

        });
}


function crearOMoverVehiculo(posicion) {

    const vehiculo =
        MOCK_DATA.vehiculos.find(
            v => v.id === posicion.vehiculo
        );

    if (!vehiculo) {
        return;
    }


    const claseRuta =
        vehiculo.rutaHabitual
            .toLowerCase();


    const icono = L.divIcon({

        className: "",

        html:
            `<div class="vehicle-marker ${claseRuta}">
                🚐
            </div>`,

        iconSize: [34, 34],

        iconAnchor: [17, 17]

    });


    let marcador =
        marcadoresVehiculos[
            posicion.vehiculo
        ];


    if (!marcador) {

        marcador = L.marker(

            [
                posicion.latitud,
                posicion.longitud
            ],

            {
                icon: icono,
                zIndexOffset: 1000
            }

        );


        marcador.bindPopup(`
            <strong>${vehiculo.nombre}</strong>
            <br>
            Tablet: ${vehiculo.tablet}
            <br>
            Ruta habitual: ${vehiculo.rutaHabitual}
            <br>
            <small>
                GPS independiente de la planificación
            </small>
        `);


        marcador.addTo(capaVehiculos);

        marcadoresVehiculos[
            posicion.vehiculo
        ] = marcador;

    } else {

        marcador.setLatLng([

            posicion.latitud,

            posicion.longitud

        ]);
    }
}


/* =========================================================
   CENTRAR EN VEHÍCULO
========================================================= */

function centrarVehiculo(id) {

    const marcador =
        marcadoresVehiculos[id];

    if (!marcador) {
        return;
    }

    mapa.setView(
        marcador.getLatLng(),
        12,
        {
            animate: true
        }
    );

    marcador.openPopup();
}


/* =========================================================
   CENTRAR EN AVISO
========================================================= */

function centrarAviso(id) {

    const marcador =
        marcadoresAvisos[id];

    if (!marcador) {
        return;
    }

    mapa.setView(
        marcador.getLatLng(),
        13,
        {
            animate: true
        }
    );

    marcador.openPopup();
}


/* =========================================================
   CAPAS
========================================================= */

function controlarCapas() {

    const controles = [

        {
            id: "capaRutas",
            capa: capaRutas
        },

        {
            id: "capaPuntos",
            capa: capaPuntos
        },

        {
            id: "capaAvisos",
            capa: capaAvisos
        },

        {
            id: "capaVehiculos",
            capa: capaVehiculos
        }

    ];


    controles.forEach(control => {

        const checkbox =
            document.getElementById(
                control.id
            );

        if (checkbox.checked) {

            if (!mapa.hasLayer(control.capa)) {

                mapa.addLayer(
                    control.capa
                );
            }

        } else {

            if (mapa.hasLayer(control.capa)) {

                mapa.removeLayer(
                    control.capa
                );
            }
        }

    });
}
