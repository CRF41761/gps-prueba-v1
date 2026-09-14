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


