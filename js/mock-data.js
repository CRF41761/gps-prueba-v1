```javascript
/* =========================================================
   CRF - DATOS DE DEMOSTRACIÓN
   ---------------------------------------------------------
   Datos simulados con estructura equivalente a las hojas
   reales del sistema.
========================================================= */

const MOCK_DATA = {

    /* =====================================================
       VEHICULOS
    ====================================================== */

    vehiculos: [

        {
            id: "V1",
            nombre: "Vehículo 1",
            rutaHabitual: "R1",
            tablet: "T1",
            activo: true,
            estado: "EN_RUTA"
        },

        {
            id: "V2",
            nombre: "Vehículo 2",
            rutaHabitual: "R2",
            tablet: "T4",
            activo: true,
            estado: "EN_RUTA"
        },

        {
            id: "V3",
            nombre: "Vehículo 3",
            rutaHabitual: "R3",
            tablet: "T2",
            activo: true,
            estado: "EN_RUTA"
        }

    ],


    /* =====================================================
       TABLETS
    ====================================================== */

    tablets: [

        {
            id: "T1",
            nombre: "Tablet 1",
            vehiculo: "V1",
            activa: true
        },

        {
            id: "T4",
            nombre: "Tablet 4",
            vehiculo: "V2",
            activa: true
        },

        {
            id: "T2",
            nombre: "Tablet 2",
            vehiculo: "V3",
            activa: true
        },

        {
            id: "T3",
            nombre: "Tablet 3",
            vehiculo: null,
            activa: false
        }

    ],


    /* =====================================================
       RUTAS
    ====================================================== */

    rutas: [

        {
            id: "R1",
            nombre: "Norte",
            color: "#1976D2"
        },

        {
            id: "R2",
            nombre: "Interior",
            color: "#388E3C"
        },

        {
            id: "R3",
            nombre: "Sur",
            color: "#F57C00"
        }

    ],


    /* =====================================================
       ASIGNACIONES_RUTA
    ====================================================== */

    asignacionesRuta: [

        {
            vehiculo: "V1",
            ruta: "R1",
            orden: 1,
            activa: true
        },

        {
            vehiculo: "V1",
            ruta: "R2",
            orden: 2,
            activa: true
        },

        {
            vehiculo: "V2",
            ruta: "R2",
            orden: 1,
            activa: true
        },

        {
            vehiculo: "V3",
            ruta: "R3",
            orden: 1,
            activa: true
        }

    ],


    /* =====================================================
       PUNTOS_RECOGIDA
    ====================================================== */

    puntos: [

        {
            id: "PR001",
            nombre: "Policía Local de Alboraya",
            tipo: "POLICIA_LOCAL",
            municipio: "Alboraya",
            latitud: 39.5000,
            longitud: -0.3490,
            activo: true
        },

        {
            id: "PR002",
            nombre: "Policía Local de Burjassot",
            tipo: "POLICIA_LOCAL",
            municipio: "Burjassot",
            latitud: 39.5090,
            longitud: -0.4130,
            activo: true
        },

        {
            id: "PR003",
            nombre: "Policía Local de Bétera",
            tipo: "POLICIA_LOCAL",
            municipio: "Bétera",
            latitud: 39.5890,
            longitud: -0.4610,
            activo: true
        },

        {
            id: "PR004",
            nombre: "Policía Local de Chiva",
            tipo: "POLICIA_LOCAL",
            municipio: "Chiva",
            latitud: 39.4720,
            longitud: -0.7170,
            activo: true
        },

        {
            id: "PR005",
            nombre: "Policía Local de Cheste",
            tipo: "POLICIA_LOCAL",
            municipio: "Cheste",
            latitud: 39.4940,
            longitud: -0.6860,
            activo: true
        },

        {
            id: "PR006",
            nombre: "Policía Local de Catarroja",
            tipo: "POLICIA_LOCAL",
            municipio: "Catarroja",
            latitud: 39.4050,
            longitud: -0.4020,
            activo: true
        },

        {
            id: "PR007",
            nombre: "Policía Local de Algemesí",
            tipo: "POLICIA_LOCAL",
            municipio: "Algemesí",
            latitud: 39.1920,
            longitud: -0.4350,
            activo: true
        },

        {
            id: "PR008",
            nombre: "Policía Local de Almussafes",
            tipo: "POLICIA_LOCAL",
            municipio: "Almussafes",
            latitud: 39.2950,
            longitud: -0.4130,
            activo: true
        }

    ],


    /* =====================================================
       AVISOS
    ====================================================== */

    avisos: [

        {
            id: "AV001",
            puntoId: "PR001",
            punto: "Policía Local de Alboraya",
            especie: "Erizo europeo",
            cantidad: 1,
            telefono: "96 XXX XX XX",
            observaciones: "Animal localizado en zona urbana.",
            ruta: "R1",
            vehiculo: "V1",
            estado: "PENDIENTE",
            latitud: 39.5000,
            longitud: -0.3490
        },

        {
            id: "AV002",
            puntoId: "PR002",
            punto: "Policía Local de Burjassot",
            especie: "Cernícalo",
            cantidad: 1,
            telefono: "96 XXX XX XX",
            observaciones: "Ave aparentemente debilitada.",
            ruta: "R1",
            vehiculo: "V1",
            estado: "ASIGNADO",
            latitud: 39.5090,
            longitud: -0.4130
        },

        {
            id: "AV003",
            puntoId: "PR003",
            punto: "Policía Local de Bétera",
            especie: "Zorro",
            cantidad: 1,
            telefono: "96 XXX XX XX",
            observaciones: "Aviso recibido por policía.",
            ruta: "R2",
            vehiculo: "V2",
            estado: "ASIGNADO",
            latitud: 39.5890,
            longitud: -0.4610
        },

        {
            id: "AV004",
            puntoId: "PR004",
            punto: "Policía Local de Chiva",
            especie: "Búho",
            cantidad: 1,
            telefono: "96 XXX XX XX",
            observaciones: "Pendiente de recogida.",
            ruta: "R2",
            vehiculo: "V2",
            estado: "PENDIENTE",
            latitud: 39.4720,
            longitud: -0.7170
        },

        {
            id: "AV005",
            puntoId: "PR006",
            punto: "Policía Local de Catarroja",
            especie: "Gaviota",
            cantidad: 1,
            telefono: "96 XXX XX XX",
            observaciones: "Animal recogido correctamente.",
            ruta: "R3",
            vehiculo: "V3",
            estado: "RECOGIDO",
            latitud: 39.4050,
            longitud: -0.4020
        },

        {
            id: "AV006",
            puntoId: "PR007",
            punto: "Policía Local de Algemesí",
            especie: "Culebra",
            cantidad: 1,
            telefono: "96 XXX XX XX",
            observaciones: "Aviso recibido esta mañana.",
            ruta: "R3",
            vehiculo: "V3",
            estado: "PENDIENTE",
            latitud: 39.1920,
            longitud: -0.4350
        }

    ],


    /* =====================================================
       POSICIONES GPS
    ====================================================== */

    posiciones: {

        V1: {

            vehiculo: "V1",
            tablet: "T1",
            latitud: 39.4705,
            longitud: -0.3600,
            precision: 18,
            ultimaActualizacion: new Date()

        },

        V2: {

            vehiculo: "V2",
            tablet: "T4",
            latitud: 39.5200,
            longitud: -0.5600,
            precision: 25,
            ultimaActualizacion: new Date()

        },

        V3: {

            vehiculo: "V3",
            tablet: "T2",
            latitud: 39.3600,
            longitud: -0.4300,
            precision: 30,
            ultimaActualizacion: new Date()

        }

    },


    /* =====================================================
       PLANIFICACIÓN DIARIA
    ====================================================== */

    planificacion: [

        {
            vehiculo: "V1",
            rutaActiva: "R1",
            rutaNombre: "Norte",
            horaSalida: "08:30",
            horaEstimadaRegreso: "13:15",

            paradas: [

                {
                    orden: 1,
                    hora: "09:00",
                    nombre: "Policía Local de Alboraya",
                    tipo: "AVISO",
                    estado: "PENDIENTE"
                },

                {
                    orden: 2,
                    hora: "09:35",
                    nombre: "Policía Local de Burjassot",
                    tipo: "AVISO",
                    estado: "ASIGNADO"
                },

                {
                    orden: 3,
                    hora: "10:15",
                    nombre: "Policía Local de Bétera",
                    tipo: "PUNTO",
                    estado: "PLANIFICADO"
                }

            ]

        },

        {
            vehiculo: "V2",
            rutaActiva: "R2",
            rutaNombre: "Interior",
            horaSalida: "08:40",
            horaEstimadaRegreso: "13:30",

            paradas: [

                {
                    orden: 1,
                    hora: "09:20",
                    nombre: "Policía Local de Chiva",
                    tipo: "AVISO",
                    estado: "PENDIENTE"
                },

                {
                    orden: 2,
                    hora: "10:00",
                    nombre: "Policía Local de Cheste",
                    tipo: "PUNTO",
                    estado: "PLANIFICADO"
                }

            ]

        },

        {
            vehiculo: "V3",
            rutaActiva: "R3",
            rutaNombre: "Sur",
            horaSalida: "08:30",
            horaEstimadaRegreso: "13:00",

            paradas: [

                {
                    orden: 1,
                    hora: "09:10",
                    nombre: "Policía Local de Catarroja",
                    tipo: "AVISO",
                    estado: "RECOGIDO"
                },

                {
                    orden: 2,
                    hora: "10:00",
                    nombre: "Policía Local de Algemesí",
                    tipo: "AVISO",
                    estado: "PENDIENTE"
                },

                {
                    orden: 3,
                    hora: "10:30",
                    nombre: "Policía Local de Almussafes",
                    tipo: "PUNTO",
                    estado: "PLANIFICADO"
                }

            ]

        }

    ]

};
```

### 2. `app.js`

Aquí está la parte importante. `app.js` ahora obtiene los datos mediante `API.obtenerDatos()`, los normaliza y crea `window.DATOS_MOCK` **antes de inicializar el mapa y los demás módulos**.

Además, he dejado la normalización preparada para que más adelante podamos recibir estructuras procedentes de Google Sheets sin obligar a modificar `mapa.js`, `avisos.js`, `vehiculos.js`, etc.

```javascript
/* ============================================================
   CRF - APLICACIÓN PRINCIPAL
   ------------------------------------------------------------
   Flujo de datos:

   MOCK_DATA / API
          ↓
   API.obtenerDatos()
          ↓
   normalizarDatosAplicacion()
          ↓
   window.DATOS_MOCK
          ↓
   mapa / vehículos / avisos / rutas
============================================================ */


/* ============================================================
   INICIO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);


async function iniciarAplicacion() {

    try {

        /*
         * 1. Obtener los datos desde la capa API.
         *
         * En modo mock:
         *     API.obtenerDatos()
         * devuelve MOCK_DATA.
         *
         * Más adelante:
         *     API.obtenerDatos()
         * podrá devolver Google Sheets.
         */

        var datos =
            await API.obtenerDatos();


        /*
         * 2. Normalizar los datos para que todos los módulos
         *    de la aplicación trabajen con una estructura única.
         */

        window.DATOS_MOCK =
            normalizarDatosAplicacion(
                datos
            );


        console.log(
            "CRF - Datos cargados correctamente:",
            window.DATOS_MOCK
        );


        /*
         * 3. Inicializar interfaz.
         */

        configurarNavegacion();

        inicializarMapa();

        renderizarVehiculos();

        renderizarAvisos();

        renderizarLeyendaRutas();

        renderizarPlanificacion();

        configurarBotonesAcciones();

        iniciarReloj();

        actualizarHoraActualizacion();

        iniciarSimulacionGPS();


        console.log(
            "CRF - Dashboard V2 iniciado correctamente."
        );


    } catch (error) {

        console.error(
            "Error iniciando el dashboard:",
            error
        );


        mostrarErrorAplicacion(
            error
        );
    }
}


/* ============================================================
   NORMALIZACIÓN DE DATOS
============================================================ */

function normalizarDatosAplicacion(
    datos
) {

    if (!datos || typeof datos !== "object") {

        throw new Error(
            "La API no ha devuelto un objeto de datos válido."
        );
    }


    /*
     * --------------------------------------------------------
     * VEHÍCULOS
     * --------------------------------------------------------
     */

    var vehiculosOrigen =
        Array.isArray(datos.vehiculos)
            ? datos.vehiculos
            : [];


    var vehiculos =
        vehiculosOrigen.map(
            function(vehiculo, indice) {

                var id =
                    vehiculo.id_vehiculo !== undefined
                        ? String(vehiculo.id_vehiculo)
                        : vehiculo.id !== undefined
                            ? String(vehiculo.id)
                            : "V" +
                              (indice + 1);


                return {

                    id_vehiculo: id,

                    id: id,

                    nombre:
                        vehiculo.nombre ||
                        "Vehículo " +
                        (indice + 1),

                    ruta_id:
                        vehiculo.ruta_id ||
                        vehiculo.rutaHabitual ||
                        vehiculo.ruta_habitual ||
                        vehiculo.ruta ||
                        "R" +
                        (indice + 1),

                    rutaHabitual:
                        vehiculo.rutaHabitual ||
                        vehiculo.ruta_habitual ||
                        vehiculo.ruta_id ||
                        vehiculo.ruta ||
                        "R" +
                        (indice + 1),

                    tablet:
                        vehiculo.tablet ||
                        vehiculo.id_tablet ||
                        "",

                    activo:
                        vehiculo.activo !== false,

                    estado:
                        vehiculo.estado ||
                        "EN_RUTA"

                };

            }
        );


    /*
     * --------------------------------------------------------
     * PUNTOS DE RECOGIDA
     * --------------------------------------------------------
     */

    var puntosOrigen =
        Array.isArray(datos.puntos)
            ? datos.puntos
            : Array.isArray(datos.puntos_recojida)
                ? datos.puntos_recojida
                : [];


    var puntos =
        puntosOrigen.map(
            function(punto, indice) {

                var id =
                    punto.id_punto !== undefined
                        ? String(punto.id_punto)
                        : punto.id !== undefined
                            ? String(punto.id)
                            : "PR" +
                              String(indice + 1)
                                  .padStart(3, "0");


                return {

                    id_punto: id,

                    id: id,

                    nombre:
                        punto.nombre ||
                        punto.nombre_punto ||
                        "Punto colaborador",

                    tipo:
                        punto.tipo ||
                        "OTRO",

                    municipio:
                        punto.municipio ||
                        "",

                    latitud:
                        Number(
                            punto.latitud !== undefined
                                ? punto.latitud
                                : punto.lat
                        ),

                    longitud:
                        Number(
                            punto.longitud !== undefined
                                ? punto.longitud
                                : punto.lng !== undefined
                                    ? punto.lng
                                    : punto.lon
                        ),

                    activo:
                        punto.activo !== false

                };

            }
        );


    /*
     * --------------------------------------------------------
     * AVISOS
     * --------------------------------------------------------
     */

    var avisosOrigen =
        Array.isArray(datos.avisos)
            ? datos.avisos
            : [];


    var avisos =
        avisosOrigen.map(
            function(aviso, indice) {

                var id =
                    aviso.id_aviso !== undefined
                        ? String(aviso.id_aviso)
                        : aviso.id !== undefined
                            ? String(aviso.id)
                            : "AV" +
                              String(indice + 1)
                                  .padStart(3, "0");


                return {

                    id_aviso: id,

                    id: id,

                    puntoId:
                        aviso.puntoId ||
                        aviso.id_punto ||
                        "",

                    punto:
                        aviso.punto ||
                        aviso.nombre_punto ||
                        "",

                    especie:
                        aviso.especie ||
                        aviso.especie_reportada ||
                        "Especie no determinada",

                    especie_reportada:
                        aviso.especie_reportada ||
                        aviso.especie ||
                        "Especie no determinada",

                    cantidad:
                        aviso.cantidad !== undefined
                            ? Number(aviso.cantidad)
                            : 1,

                    telefono:
                        aviso.telefono ||
                        "",

                    observaciones:
                        aviso.observaciones ||
                        "",

                    ruta:
                        aviso.ruta ||
                        aviso.ruta_id ||
                        "",

                    ruta_id:
                        aviso.ruta_id ||
                        aviso.ruta ||
                        "",

                    vehiculo:
                        aviso.vehiculo ||
                        aviso.vehiculo_id ||
                        "",

                    vehiculo_id:
                        aviso.vehiculo_id ||
                        aviso.vehiculo ||
                        "",

                    estado:
                        aviso.estado ||
                        "PENDIENTE",

                    latitud:
                        Number(
                            aviso.latitud !== undefined
                                ? aviso.latitud
                                : aviso.lat
                        ),

                    longitud:
                        Number(
                            aviso.longitud !== undefined
                                ? aviso.longitud
                                : aviso.longitud !== undefined
                                    ? aviso.longitud
                                    : aviso.lng !== undefined
                                        ? aviso.lng
                                        : aviso.lon
                        )

                };

            }
        );


    /*
     * --------------------------------------------------------
     * POSICIONES GPS
     * --------------------------------------------------------
     *
     * El mock original utiliza:
     *
     * {
     *     V1: {...},
     *     V2: {...},
     *     V3: {...}
     * }
     *
     * El mapa trabaja mejor con un array.
     *
     * Lo convertimos aquí.
     */

    var posicionesOrigen =
        datos.posiciones &&
        typeof datos.posiciones === "object"
            ? datos.posiciones
            : {};


    var posiciones =
        Object.keys(
            posicionesOrigen
        ).map(
            function(idVehiculo) {

                var posicion =
                    posicionesOrigen[
                        idVehiculo
                    ];


                return {

                    id_vehiculo:
                        String(
                            posicion.vehiculo ||
                            posicion.id_vehiculo ||
                            idVehiculo
                        ),

                    vehiculo_id:
                        String(
                            posicion.vehiculo ||
                            posicion.id_vehiculo ||
                            idVehiculo
                        ),

                    tablet:
                        posicion.tablet ||
                        "",

                    latitud:
                        Number(
                            posicion.latitud !== undefined
                                ? posicion.latitud
                                : posicion.lat
                        ),

                    longitud:
                        Number(
                            posicion.longitud !== undefined
                                ? posicion.longitud
                                : posicion.longitud !== undefined
                                    ? posicion.longitud
                                    : posicion.lng !== undefined
                                        ? posicion.lng
                                        : posicion.lon
                        ),

                    precision:
                        Number(
                            posicion.precision !== undefined
                                ? posicion.precision
                                : 0
                        ),

                    ultimaActualizacion:
                        posicion.ultimaActualizacion ||
                        null

                };

            }
        );


    /*
     * --------------------------------------------------------
     * RUTAS
     * --------------------------------------------------------
     */

    var rutasOrigen =
        Array.isArray(datos.rutas)
            ? datos.rutas
            : [];


    var rutas =
        rutasOrigen.map(
            function(ruta) {

                var id =
                    ruta.ruta_id ||
                    ruta.id ||
                    "";


                return {

                    ruta_id:
                        String(id).toUpperCase(),

                    id:
                        String(id).toUpperCase(),

                    nombre:
                        ruta.nombre ||
                        ruta.nombre_ruta ||
                        "",

                    color:
                        ruta.color ||
                        ""

                };

            }
        );


    /*
     * --------------------------------------------------------
     * PLANIFICACIÓN
     * --------------------------------------------------------
     */

    var planificacionOrigen =
        Array.isArray(datos.planificacion)
            ? datos.planificacion
            : [];


    var planificacion =
        planificacionOrigen.map(
            function(item, indice) {

                return {

                    vehiculo_id:
                        item.vehiculo_id ||
                        item.vehiculo ||
                        "V" +
                        (indice + 1),

                    ruta_id:
                        item.ruta_id ||
                        item.rutaActiva ||
                        item.ruta ||
                        "R" +
                        (indice + 1),

                    descripcion:
                        item.descripcion ||
                        (
                            item.rutaNombre
                                ? "Ruta " +
                                  item.rutaNombre
                                : "Ruta planificada para la jornada"
                        ),

                    horaSalida:
                        item.horaSalida ||
                        "",

                    horaEstimadaRegreso:
                        item.horaEstimadaRegreso ||
                        "",

                    paradas:
                        Array.isArray(item.paradas)
                            ? item.paradas
                            : []

                };

            }
        );


    /*
     * --------------------------------------------------------
     * RESULTADO NORMALIZADO
     * --------------------------------------------------------
     *
     * Estos son exactamente los nombres que utilizarán
     * mapa.js, vehiculos.js, avisos.js y rutas.js.
     */

    return {

        VEHICULOS:
            vehiculos,

        PUNTOS_RECOGIDA:
            puntos,

        AVISOS:
            avisos,

        POSICIONES:
            posiciones,

        RUTAS:
            rutas,

        PLANIFICACION:
            planificacion,

        TABLETS:
            Array.isArray(datos.tablets)
                ? datos.tablets
                : [],

        ASIGNACIONES_RUTA:
            Array.isArray(datos.asignacionesRuta)
                ? datos.asignacionesRuta
                : []

    };

}


/* ============================================================
   NAVEGACIÓN
============================================================ */

function configurarNavegacion() {

    var elementos =
        document.querySelectorAll(
            ".nav-item"
        );


    elementos.forEach(
        function(item) {

            item.addEventListener(
                "click",
                function() {

                    elementos.forEach(
                        function(elemento) {

                            elemento.classList.remove(
                                "active"
                            );

                        }
                    );


                    item.classList.add(
                        "active"
                    );


                    manejarCambioSeccion(
                        item.dataset.section
                    );

                }
            );

        }
    );
}


function manejarCambioSeccion(
    seccion
) {

    var mensajes = {

        inicio:
            "Vista general de la operación.",

        planificacion:
            "Planificación diaria de vehículos y avisos.",

        avisos:
            "Gestión de avisos de recogida.",

        vehiculos:
            "Estado y seguimiento de vehículos.",

        puntos:
            "Gestión de puntos colaboradores.",

        rutas:
            "Configuración de rutas y zonas.",

        historial:
            "Historial de recogidas.",

        estadisticas:
            "Estadísticas operativas.",

        ajustes:
            "Configuración del sistema."

    };


    actualizarEstadoMapa(
        mensajes[seccion] ||
        "Sección seleccionada."
    );
}


/* ============================================================
   ESTADO MAPA
============================================================ */

function actualizarEstadoMapa(
    texto
) {

    var elemento =
        document.getElementById(
            "map-status-text"
        );


    if (!elemento) return;


    elemento.textContent =
        texto;


    window.clearTimeout(
        window._estadoMapaTimeout
    );


    window._estadoMapaTimeout =
        window.setTimeout(
            function() {

                elemento.textContent =
                    "GPS operativo · posiciones simuladas";

            },
            2500
        );
}


/* ============================================================
   RELOJ
============================================================ */

function iniciarReloj() {

    actualizarReloj();


    window.setInterval(
        actualizarReloj,
        1000
    );
}


function actualizarReloj() {

    var reloj =
        document.getElementById(
            "reloj"
        );


    if (!reloj) return;


    var ahora =
        new Date();


    reloj.textContent =
        ahora.toLocaleTimeString(
            "es-ES",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );
}


/* ============================================================
   ACTUALIZACIÓN
============================================================ */

function actualizarHoraActualizacion() {

    var elemento =
        document.getElementById(
            "ultima-actualizacion"
        );


    if (!elemento) return;


    elemento.textContent =
        "Datos actualizados · modo demostración";
}


/* ============================================================
   SIMULACIÓN GPS
============================================================ */

function iniciarSimulacionGPS() {

    if (
        typeof actualizarPosicionVehiculo !==
        "function"
    ) {

        console.warn(
            "No se puede iniciar la simulación GPS."
        );

        return;
    }


    var velocidades = {

        V1: {
            lat: 0.00020,
            lng: 0.00030
        },

        V2: {
            lat: 0.00014,
            lng: -0.00024
        },

        V3: {
            lat: -0.00017,
            lng: 0.00022
        }

    };


    var sentido = {

        V1: 1,

        V2: 1,

        V3: 1

    };


    window.setInterval(
        function() {

            if (
                typeof window.POSICIONES_VEHICULOS !==
                "object"
            ) {
                return;
            }


            Object.keys(
                window.POSICIONES_VEHICULOS
            ).forEach(
                function(id) {

                    var posicion =
                        window.POSICIONES_VEHICULOS[
                            id
                        ];


                    if (!posicion) {
                        return;
                    }


                    var velocidad =
                        velocidades[id] ||
                        {
                            lat: 0.00012,
                            lng: 0.00012
                        };


                    posicion.lat +=
                        velocidad.lat *
                        sentido[id];


                    posicion.lng +=
                        velocidad.lng *
                        sentido[id];


                    /*
                     * Límites aproximados de la provincia
                     * para mantener la simulación visible.
                     */

                    if (
                        posicion.lat > 39.80 ||
                        posicion.lat < 39.10
                    ) {

                        sentido[id] *= -1;

                    }


                    if (
                        posicion.lng > -0.15 ||
                        posicion.lng < -0.75
                    ) {

                        sentido[id] *= -1;

                    }


                    actualizarPosicionVehiculo(
                        id,
                        posicion.lat,
                        posicion.lng
                    );

                }
            );

        },
        5000
    );
}


/* ============================================================
   ACCIONES
============================================================ */

function configurarBotonesAcciones() {

    var confirmar =
        document.getElementById(
            "accion-confirmar"
        );


    if (confirmar) {

        confirmar.addEventListener(
            "click",
            function() {

                alert(
                    "La confirmación de rutas se implementará cuando conectemos la planificación real."
                );

            }
        );

    }


    var aviso =
        document.getElementById(
            "accion-aviso"
        );


    if (aviso) {

        aviso.addEventListener(
            "click",
            function() {

                alert(
                    "El formulario de nuevo aviso se implementará en la siguiente fase."
                );

            }
        );

    }


    var recalcular =
        document.getElementById(
            "accion-recalcular"
        );


    if (recalcular) {

        recalcular.addEventListener(
            "click",
            function() {

                if (
                    typeof dibujarRutas ===
                    "function"
                ) {

                    dibujarRutas();

                }


                actualizarEstadoMapa(
                    "Planificación recalculada · modo demostración"
                );

            }
        );

    }


    var exportar =
        document.getElementById(
            "accion-exportar"
        );


    if (exportar) {

        exportar.addEventListener(
            "click",
            function() {

                window.print();

            }
        );

    }


    var refresh =
        document.getElementById(
            "btn-refresh"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            function() {

                refrescarVehiculos();

                renderizarAvisos();

                renderizarPlanificacion();

                actualizarHoraActualizacion();

            }
        );

    }
}


/* ============================================================
   ERROR
============================================================ */

function mostrarErrorAplicacion(
    error
) {

    console.error(
        "Detalle del error:",
        error
    );


    var mensaje =
        document.createElement(
            "div"
        );


    mensaje.style.position =
        "fixed";

    mensaje.style.left =
        "20px";

    mensaje.style.right =
        "20px";

    mensaje.style.bottom =
        "20px";

    mensaje.style.zIndex =
        "99999";

    mensaje.style.padding =
        "15px";

    mensaje.style.background =
        "#b71c1c";

    mensaje.style.color =
        "white";

    mensaje.style.borderRadius =
        "8px";

    mensaje.style.fontFamily =
        "system-ui";


    mensaje.innerHTML =
        "<strong>" +
        "Error iniciando el dashboard." +
        "</strong><br>" +
        "<small>" +
        "Revisa la consola del navegador (F12)." +
        "</small>";


    document.body.appendChild(
        mensaje
    );
}
```

### Qué debería ocurrir ahora

Al sustituir **solo esos dos archivos**, no hay que tocar todavía `mapa.js`, `vehiculos.js`, `avisos.js`, `rutas.js` ni `index.html`.

Al recargar deberías ver:

* 🚐 **3 vehículos** en el mapa.
* 📍 **8 puntos colaboradores**.
* ⚠️ **6 avisos**.
* Los KPI: **3 pendientes, 2 asignados y 1 recogido**.
* KPI de vehículos: **3**.
* Los 3 vehículos aparecerán inicialmente aproximadamente en las posiciones GPS del mock.
* Cada 5 segundos se moverán.
* La lista lateral de vehículos debería mostrar V1, V2 y V3.
* La planificación debería aparecer en el panel derecho.
* Las rutas seguirán funcionando como hasta ahora.

**Importante:** he mantenido deliberadamente los datos simulados y no hemos conectado todavía Google Sheets. Primero quiero que consigamos que esta maqueta funcione completamente con el mock; después hacemos la transición a los datos reales.

Cuando los pongas, **recarga la página y dime exactamente qué aparece** (especialmente si salen los 3 vehículos y los puntos). Si aparece algo raro, no cambies más archivos: seguimos desde ese estado.
