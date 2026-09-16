/* ============================================================
   CRF LA GRANJA DE EL SALER
   RUTAS.JS · PLANIFICACIÓN Y GESTIÓN DE PARADAS
============================================================ */

/* ============================================================
   ESTADO GLOBAL
============================================================ */

let planificacionDia = {};
let vehiculoPlanSeleccionado = null;

/* Filtros de avisos */
let filtroAvisosTexto = "";
let filtroAvisosEstado = "PENDIENTE";


/* ============================================================
   ACCESO A DATOS DE LA APLICACIÓN
   ------------------------------------------------------------
   La aplicación carga y normaliza los datos en app.js dentro
   de window.DATOS_MOCK.
============================================================ */

function obtenerDatosAplicacion() {
    return (
        window.DATOS_MOCK &&
        typeof window.DATOS_MOCK === "object"
            ? window.DATOS_MOCK
            : {}
    );
}


/* ============================================================
   INICIALIZACIÓN
============================================================ */

async function inicializarPlanificacion() {
    try {

        /*
         * IMPORTANTE:
         * Los datos ya han sido cargados por app.js mediante
         * API.obtenerDatos() y almacenados en window.DATOS_MOCK.
         *
         * No llamar a cargarDatos(), porque esa función no
         * existe en la arquitectura actual.
         */

        const datos =
            obtenerDatosAplicacion();

        if (
            !datos ||
            typeof datos !== "object"
        ) {
            throw new Error(
                "No están disponibles los datos de la aplicación."
            );
        }

        renderizarLeyendaRutas();

        cargarPlanificacionDesdeDatos();

        seleccionarVehiculoPlanInicial();

        renderizarAvisosPendientes();

        renderizarPlanificacion();

    } catch (error) {

        console.error(
            "Error inicializando planificación:",
            error
        );

        const avisos =
            document.getElementById(
                "avisos-pendientes-planificacion"
            );

        if (avisos) {
            avisos.innerHTML = `
                <div class="sin-avisos-pendientes">
                    No se han podido cargar los avisos.
                </div>
            `;
        }

        const planificacion =
            document.getElementById(
                "planificacion-dia"
            );

        if (planificacion) {
            planificacion.innerHTML = `
                <div class="sin-planificacion">
                    No se ha podido cargar la planificación.
                </div>
            `;
        }
    }
}


/* ============================================================
   AVISOS
============================================================ */

/**
 * Devuelve todos los avisos disponibles.
 */
function obtenerTodosAvisos() {

    const datos =
        obtenerDatosAplicacion();

    return Array.isArray(
        datos.AVISOS
    )
        ? datos.AVISOS
        : [];
}


/**
 * Devuelve únicamente los avisos pendientes.
 */
function obtenerAvisosPendientes() {

    return obtenerTodosAvisos()
        .filter(
            aviso =>
                normalizarEstado(
                    aviso.estado
                ) === "PENDIENTE"
        );
}


/**
 * Obtiene el colaborador/punto asociado al aviso.
 */
function obtenerColaboradorAviso(aviso) {

    if (!aviso) {
        return "Sin colaborador";
    }

    return (
        aviso.colaborador ||
        aviso.nombre_colaborador ||
        aviso.punto ||
        aviso.nombre_punto ||
        aviso.punto_recogida ||
        aviso.COLABORADOR ||
        aviso.NOMBRE_COLABORADOR ||
        aviso.NOMBRE_PUNTO ||
        "Sin colaborador"
    );
}


/**
 * Obtiene el municipio del aviso.
 *
 * Los avisos normalizados actualmente pueden no llevar
 * municipio directamente. En ese caso se busca el municipio
 * del punto permanente asociado.
 */
function obtenerMunicipioAviso(aviso) {

    if (!aviso) {
        return "—";
    }

    const municipioDirecto =
        aviso.municipio ||
        aviso.localidad ||
        aviso.MUNICIPIO ||
        aviso.LOCALIDAD;

    if (municipioDirecto) {
        return municipioDirecto;
    }


    /*
     * Si el aviso tiene puntoId, buscamos el punto en
     * PUNTOS_RECOGIDA.
     */

    const puntoId =
        aviso.puntoId ||
        aviso.id_punto ||
        aviso.punto_id ||
        aviso.PUNTO_ID ||
        null;

    if (puntoId) {

        const datos =
            obtenerDatosAplicacion();

        const puntos =
            Array.isArray(
                datos.PUNTOS_RECOGIDA
            )
                ? datos.PUNTOS_RECOGIDA
                : [];

        const punto =
            puntos.find(
                elemento => {

                    const id =
                        elemento.id_punto ||
                        elemento.id ||
                        elemento.ID_PUNTO;

                    return (
                        String(id) ===
                        String(puntoId)
                    );
                }
            );

        if (
            punto &&
            punto.municipio
        ) {
            return punto.municipio;
        }
    }


    /*
     * También se contempla un punto recibido como objeto.
     */

    if (
        aviso.punto_recogida &&
        typeof aviso.punto_recogida === "object"
    ) {

        return (
            aviso.punto_recogida.municipio ||
            "—"
        );
    }

    return "—";
}


/**
 * Obtiene el teléfono del aviso.
 */
function obtenerTelefonoAviso(aviso) {

    if (!aviso) {
        return "—";
    }

    return (
        aviso.telefono ||
        aviso.telefono_contacto ||
        aviso.telefono_aviso ||
        aviso.phone ||
        aviso.TELEFONO ||
        aviso.TELEFONO_CONTACTO ||
        "—"
    );
}


/**
 * Obtiene la especie indicada en el aviso.
 */
function obtenerEspecieAviso(aviso) {

    if (!aviso) {
        return "Especie no indicada";
    }

    return (
        aviso.especie ||
        aviso.especie_reportada ||
        aviso.ESPECIE ||
        aviso.ESPECIE_REPORTADA ||
        "Especie no indicada"
    );
}


/**
 * Obtiene la cantidad de animales.
 */
function obtenerCantidadAviso(aviso) {

    if (!aviso) {
        return 1;
    }

    const cantidad =
        aviso.cantidad ??
        aviso.numero_animales ??
        aviso.animales ??
        aviso.CANTIDAD ??
        aviso.NUMERO_ANIMALES ??
        1;

    const numero =
        Number(cantidad);

    return (
        Number.isFinite(numero) &&
        numero > 0
    )
        ? numero
        : 1;
}


/**
 * Obtiene el punto/dirección principal del aviso.
 */
function obtenerPuntoAviso(aviso) {

    if (!aviso) {
        return "Punto no indicado";
    }

    return (
        aviso.punto ||
        aviso.nombre_punto ||
        aviso.punto_recogida ||
        aviso.direccion ||
        aviso.PUNTO ||
        aviso.NOMBRE_PUNTO ||
        aviso.DIRECCION ||
        "Punto no indicado"
    );
}


/**
 * Obtiene la ruta geográfica asociada al aviso.
 */
function obtenerRutaAviso(aviso) {

    if (!aviso) {
        return "";
    }

    return (
        aviso.ruta_id ||
        aviso.ruta ||
        aviso.ruta_geografica ||
        aviso.RUTA_ID ||
        aviso.RUTA ||
        aviso.RUTA_GEOGRAFICA ||
        ""
    );
}


/**
 * Devuelve todos los avisos aplicando búsqueda y estado.
 */
function obtenerAvisosFiltrados() {

    const avisos =
        obtenerTodosAvisos();

    const textoBusqueda =
        normalizarTexto(
            filtroAvisosTexto
        );

    return avisos.filter(
        aviso => {

            /* --------------------------------------------
               Filtro por estado
            --------------------------------------------- */

            if (
                filtroAvisosEstado &&
                filtroAvisosEstado !== "TODOS"
            ) {

                const estado =
                    normalizarEstado(
                        aviso.estado
                    );

                if (
                    estado !==
                    normalizarEstado(
                        filtroAvisosEstado
                    )
                ) {
                    return false;
                }
            }


            /* --------------------------------------------
               Filtro de texto
            --------------------------------------------- */

            if (!textoBusqueda) {
                return true;
            }


            const camposBusqueda = [

                obtenerIdAviso(
                    aviso
                ),

                obtenerEspecieAviso(
                    aviso
                ),

                obtenerColaboradorAviso(
                    aviso
                ),

                obtenerMunicipioAviso(
                    aviso
                ),

                obtenerPuntoAviso(
                    aviso
                ),

                obtenerTelefonoAviso(
                    aviso
                ),

                obtenerNombreRuta(
                    obtenerRutaAviso(
                        aviso
                    )
                )
            ];


            const textoCompleto =
                normalizarTexto(
                    camposBusqueda
                        .filter(
                            valor =>
                                valor !== null &&
                                valor !== undefined
                        )
                        .join(" ")
                );


            return textoCompleto.includes(
                textoBusqueda
            );
        }
    );
}


/**
 * Renderiza el bloque completo de avisos pendientes.
 */
function renderizarAvisosPendientes() {

    const contenedor =
        document.getElementById(
            "avisos-pendientes-planificacion"
        );

    const contador =
        document.getElementById(
            "contador-avisos-pendientes"
        );

    if (!contenedor) {
        return;
    }


    const avisosPendientes =
        obtenerAvisosPendientes();

    const avisos =
        obtenerAvisosFiltrados();


    /* --------------------------------------------
       Contador principal
    --------------------------------------------- */

    if (contador) {

        contador.textContent =
            avisosPendientes.length;
    }


    /* --------------------------------------------
       Estado actual
    --------------------------------------------- */

    const estadoActual =
        filtroAvisosEstado ||
        "PENDIENTE";

    const textoBusqueda =
        filtroAvisosTexto ||
        "";


    /* --------------------------------------------
       Construcción
    --------------------------------------------- */

    contenedor.innerHTML = `

        <div class="cabecera-avisos-pendientes">

            <div class="controles-avisos-pendientes">

                <div class="buscador-avisos-pendientes">

                    <label
                        for="buscador-avisos-pendientes"
                        class="sr-only"
                    >
                        Buscar avisos
                    </label>

                    <span
                        class="icono-buscador-avisos"
                        aria-hidden="true"
                    >
                        🔎
                    </span>

                    <input
                        id="buscador-avisos-pendientes"
                        name="buscador-avisos-pendientes"
                        type="search"
                        placeholder="Buscar por municipio, colaborador, ID o especie..."
                        value="${escaparHTML(
                            textoBusqueda
                        )}"
                        oninput="filtrarAvisosPendientes(this.value)"
                    />

                </div>


                <div class="filtro-avisos-pendientes">

                    <label
                        for="filtro-estado-avisos"
                        class="sr-only"
                    >
                        Filtrar avisos por estado
                    </label>

                    <select
                        id="filtro-estado-avisos"
                        name="filtro-estado-avisos"
                        onchange="cambiarFiltroAvisosPendientes(this.value)"
                    >

                        <option
                            value="PENDIENTE"
                            ${
                                estadoActual === "PENDIENTE"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Pendientes
                        </option>

                        <option
                            value="ASIGNADO"
                            ${
                                estadoActual === "ASIGNADO"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Asignados
                        </option>

                        <option
                            value="RECOGIDO"
                            ${
                                estadoActual === "RECOGIDO"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Recogidos
                        </option>

                        <option
                            value="TODOS"
                            ${
                                estadoActual === "TODOS"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Todos
                        </option>

                    </select>

                </div>


                ${
                    estadoActual !== "TODOS"
                        ? `
                            <button
                                type="button"
                                class="boton-ver-todos-avisos"
                                onclick="mostrarTodosAvisos()"
                            >
                                Ver todos
                            </button>
                        `
                        : ""
                }

            </div>

        </div>


        ${
            avisos.length
                ? `

                    <div class="tabla-avisos-wrapper">

                        <table
                            class="tabla-avisos-pendientes"
                        >

                            <thead>

                                <tr>

                                    <th scope="col">
                                        ID
                                    </th>

                                    <th scope="col">
                                        COLABORADOR
                                    </th>

                                    <th scope="col">
                                        MUNICIPIO
                                    </th>

                                    <th scope="col">
                                        ANIMALES
                                    </th>

                                    <th scope="col">
                                        ESTADO
                                    </th>

                                    <th scope="col">
                                        TELÉFONO
                                    </th>

                                    <th scope="col">
                                        VEHÍCULO
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                ${
                                    avisos
                                        .map(
                                            aviso =>
                                                crearFilaAvisoPendiente(
                                                    aviso
                                                )
                                        )
                                        .join("")
                                }

                            </tbody>

                        </table>

                    </div>

                `
                : `

                    <div class="sin-avisos-pendientes">

                        ${
                            textoBusqueda
                                ? "No se han encontrado avisos que coincidan con la búsqueda."
                                : estadoActual === "PENDIENTE"
                                    ? "No hay avisos pendientes de asignar."
                                    : "No hay avisos para mostrar con este filtro."
                        }

                    </div>

                `
        }

    `;
}


/**
 * Crea una fila de la tabla de avisos.
 */
function crearFilaAvisoPendiente(
    aviso
) {

    const idAviso =
        obtenerIdAviso(
            aviso
        );

    const idTexto =
        idAviso !== null &&
        idAviso !== undefined
            ? String(idAviso)
            : "—";

    const colaborador =
        obtenerColaboradorAviso(
            aviso
        );

    const municipio =
        obtenerMunicipioAviso(
            aviso
        );

    const especie =
        obtenerEspecieAviso(
            aviso
        );

    const cantidad =
        obtenerCantidadAviso(
            aviso
        );

    const telefono =
        obtenerTelefonoAviso(
            aviso
        );

    const estado =
        normalizarEstado(
            aviso.estado
        ) ||
        "PENDIENTE";

    const ruta =
        obtenerRutaAviso(
            aviso
        );

    const vehiculoAsignado =
        aviso.vehiculo_id ||
        aviso.vehiculo ||
        aviso.id_vehiculo ||
        "";


    const vehiculoRecomendado =
        obtenerVehiculoRecomendado(
            aviso
        );


    const vehiculoSeleccionado =
        vehiculoAsignado ||
        vehiculoRecomendado ||
        "";


    /* --------------------------------------------
       Estado visual
    --------------------------------------------- */

    let claseEstado =
        "estado-aviso-tabla";


    if (
        estado === "PENDIENTE"
    ) {
        claseEstado +=
            " estado-aviso-pendiente";
    }


    if (
        estado === "ASIGNADO"
    ) {
        claseEstado +=
            " estado-aviso-asignado";
    }


    if (
        estado === "RECOGIDO"
    ) {
        claseEstado +=
            " estado-aviso-recogido";
    }


    const textoEstado =
        textoEstadoParada(
            estado
        );


    /* --------------------------------------------
       Selector de vehículo
    --------------------------------------------- */

    let controlVehiculo = "";


    if (
        estado === "RECOGIDO"
    ) {

        controlVehiculo = `

            <span
                class="vehiculo-aviso-tabla vehiculo-sin-accion"
            >
                ${
                    vehiculoAsignado
                        ? escaparHTML(
                            obtenerNombreVehiculo(
                                vehiculoAsignado
                            )
                        )
                        : "—"
                }
            </span>

        `;

    } else {

        const botonTexto =
            estado === "ASIGNADO"
                ? "Cambiar"
                : "Asignar";


        const idSeguro =
            String(
                idAviso
            );


        controlVehiculo = `

            <div
                class="asignacion-aviso-tabla"
            >

                <label
                    for="vehiculo-aviso-${escaparHTML(
                        idSeguro
                    )}"
                    class="sr-only"
                >
                    Vehículo para aviso
                    ${escaparHTML(idSeguro)}
                </label>


                <select
                    id="vehiculo-aviso-${escaparHTML(
                        idSeguro
                    )}"
                    name="vehiculo-aviso-${escaparHTML(
                        idSeguro
                    )}"
                    class="selector-vehiculo-aviso"
                    data-aviso-id="${escaparHTML(
                        idSeguro
                    )}"
                    aria-label="Vehículo para aviso ${escaparHTML(
                        idSeguro
                    )}"
                >

                    ${crearOpcionesVehiculosAsignacion(
                        vehiculoSeleccionado
                    )}

                </select>


                <button
                    type="button"
                    class="boton-asignar-aviso"
                    onclick="asignarAvisoAVehiculo('${escaparHTML(
                        idSeguro
                    )}')"
                >
                    ${botonTexto}
                </button>

            </div>

        `;
    }


    return `

        <tr
            class="fila-aviso-pendiente"
            data-aviso-id="${escaparHTML(
                String(idAviso)
            )}"
            data-ruta="${escaparHTML(
                String(ruta)
            )}"
        >

            <td class="celda-id-aviso">

                <strong>
                    #${escaparHTML(idTexto)}
                </strong>

            </td>


            <td class="celda-colaborador-aviso">

                <strong>
                    ${escaparHTML(
                        String(colaborador)
                    )}
                </strong>

                <span
                    class="especie-secundaria-aviso"
                >
                    ${escaparHTML(
                        String(especie)
                    )}
                </span>

            </td>


            <td class="celda-municipio-aviso">

                <strong>
                    ${escaparHTML(
                        String(municipio)
                    )}
                </strong>

            </td>


            <td class="celda-animales-aviso">

                <span
                    class="cantidad-animales-aviso"
                >
                    ${escaparHTML(
                        String(cantidad)
                    )}
                </span>

            </td>


            <td class="celda-estado-aviso">

                <span
                    class="${claseEstado}"
                >

                    <span
                        class="punto-estado-aviso"
                        aria-hidden="true"
                    ></span>

                    ${escaparHTML(
                        textoEstado
                    )}

                </span>

            </td>


            <td class="celda-telefono-aviso">

                ${
                    telefono !== "—"
                        ? `
                            <span>
                                ${escaparHTML(
                                    String(
                                        telefono
                                    )
                                )}
                            </span>
                        `
                        : `
                            <span
                                class="telefono-no-disponible"
                            >
                                —
                            </span>
                        `
                }

            </td>


            <td class="celda-vehiculo-aviso">

                ${controlVehiculo}

            </td>

        </tr>

    `;
}


/**
 * Cambia el texto de búsqueda de avisos.
 */
function filtrarAvisosPendientes(
    valor
) {

    filtroAvisosTexto =
        String(
            valor || ""
        );

    renderizarAvisosPendientes();
}


/**
 * Cambia el filtro de estado.
 */
function cambiarFiltroAvisosPendientes(
    valor
) {

    filtroAvisosEstado =
        String(
            valor ||
            "PENDIENTE"
        );

    renderizarAvisosPendientes();
}


/**
 * Muestra todos los avisos.
 */
function mostrarTodosAvisos() {

    filtroAvisosEstado =
        "TODOS";

    renderizarAvisosPendientes();
}


/* ============================================================
   ASIGNACIÓN INTELIGENTE
============================================================ */

function obtenerVehiculoRecomendado(
    aviso
) {

    const planes =
        Object.values(
            planificacionDia
        );


    if (!planes.length) {
        return null;
    }


    let mejorVehiculo =
        null;

    let mejorPuntuacion =
        -Infinity;


    planes.forEach(
        plan => {

            const puntuacion =
                evaluarVehiculoParaAviso(
                    plan,
                    aviso
                );


            if (
                puntuacion >
                mejorPuntuacion
            ) {

                mejorPuntuacion =
                    puntuacion;

                mejorVehiculo =
                    plan.vehiculoId;
            }
        }
    );


    return mejorVehiculo;
}


function evaluarVehiculoParaAviso(
    plan,
    aviso
) {

    let puntuacion =
        0;


    const rutaAviso =
        normalizarTexto(
            obtenerRutaAviso(
                aviso
            )
        );


    const rutaHabitual =
        normalizarTexto(
            plan.rutaHabitual ||
            ""
        );


    const rutaActiva =
        normalizarTexto(
            plan.rutaActiva ||
            ""
        );


    /* --------------------------------------------
       Coincidencia de ruta
    --------------------------------------------- */

    if (
        rutaAviso &&
        rutaActiva &&
        rutaAviso ===
            rutaActiva
    ) {

        puntuacion +=
            100;
    }


    if (
        rutaAviso &&
        rutaHabitual &&
        rutaAviso ===
            rutaHabitual
    ) {

        puntuacion +=
            50;
    }


    /* --------------------------------------------
       Coordenadas
    --------------------------------------------- */

    const latAviso =
        obtenerLat(
            aviso
        );

    const lngAviso =
        obtenerLng(
            aviso
        );


    if (
        coordenadasValidas(
            latAviso,
            lngAviso
        )
    ) {

        /* ----------------------------------------
           Proximidad a paradas
        ----------------------------------------- */

        let distanciaMinima =
            Infinity;


        (
            plan.paradas ||
            []
        ).forEach(
            parada => {

                const lat =
                    obtenerLat(
                        parada
                    );

                const lng =
                    obtenerLng(
                        parada
                    );


                if (
                    !coordenadasValidas(
                        lat,
                        lng
                    )
                ) {
                    return;
                }


                const distancia =
                    calcularDistanciaKm(
                        latAviso,
                        lngAviso,
                        lat,
                        lng
                    );


                if (
                    distancia <
                    distanciaMinima
                ) {

                    distanciaMinima =
                        distancia;
                }
            }
        );


        if (
            distanciaMinima <= 5
        ) {

            puntuacion +=
                40;

        } else if (
            distanciaMinima <= 15
        ) {

            puntuacion +=
                25;

        } else if (
            distanciaMinima <= 30
        ) {

            puntuacion +=
                10;
        }


        /* ----------------------------------------
           Proximidad al vehículo
        ----------------------------------------- */

        const posicionVehiculo =
            obtenerPosicionVehiculo(
                plan.vehiculoId
            );


        if (
            posicionVehiculo
        ) {

            const latVehiculo =
                Number(
                    posicionVehiculo.lat
                );


            const lngVehiculo =
                Number(
                    posicionVehiculo.lng
                );


            if (
                coordenadasValidas(
                    latVehiculo,
                    lngVehiculo
                )
            ) {

                const distanciaVehiculo =
                    calcularDistanciaKm(
                        latAviso,
                        lngAviso,
                        latVehiculo,
                        lngVehiculo
                    );


                if (
                    distanciaVehiculo <= 5
                ) {

                    puntuacion +=
                        20;

                } else if (
                    distanciaVehiculo <= 15
                ) {

                    puntuacion +=
                        10;
                }
            }
        }
    }


    return puntuacion;
}


/**
 * Obtiene la posición actual de un vehículo.
 *
 * Se contempla:
 * 1. window.POSICIONES_VEHICULOS
 * 2. window.posicionesVehiculos
 * 3. DATOS_MOCK.POSICIONES
 */
function obtenerPosicionVehiculo(
    vehiculoId
) {

    if (
        window.POSICIONES_VEHICULOS &&
        typeof window.POSICIONES_VEHICULOS ===
            "object"
    ) {

        const posicion =
            window.POSICIONES_VEHICULOS[
                vehiculoId
            ];

        if (posicion) {
            return posicion;
        }
    }


    if (
        window.posicionesVehiculos &&
        typeof window.posicionesVehiculos ===
            "object"
    ) {

        const posicion =
            window.posicionesVehiculos[
                vehiculoId
            ];

        if (posicion) {
            return posicion;
        }
    }


    const datos =
        obtenerDatosAplicacion();


    const posiciones =
        Array.isArray(
            datos.POSICIONES
        )
            ? datos.POSICIONES
            : [];


    return (
        posiciones.find(
            posicion => {

                const id =
                    posicion.id_vehiculo ||
                    posicion.vehiculo_id ||
                    posicion.vehiculo ||
                    posicion.id;


                return (
                    String(id) ===
                    String(vehiculoId)
                );
            }
        ) ||
        null
    );
}


/* ============================================================
   ASIGNAR AVISO A VEHÍCULO
============================================================ */

function asignarAvisoAVehiculo(
    avisoId
) {

    let selector =
        null;


    /*
     * CSS.escape puede no estar disponible en algunos
     * navegadores antiguos. Primero intentamos el selector
     * seguro y, si falla, buscamos por data-aviso-id.
     */

    try {

        if (
            typeof CSS !== "undefined" &&
            typeof CSS.escape ===
                "function"
        ) {

            selector =
                document.querySelector(
                    `.selector-vehiculo-aviso[data-aviso-id="${CSS.escape(
                        String(avisoId)
                    )}"]`
                );
        }

    } catch (error) {

        selector =
            null;
    }


    if (!selector) {

        selector =
            Array.from(
                document.querySelectorAll(
                    ".selector-vehiculo-aviso"
                )
            ).find(
                elemento =>
                    String(
                        elemento.dataset.avisoId
                    ) ===
                    String(avisoId)
            );
    }


    if (!selector) {
        return;
    }


    const vehiculoId =
        selector.value;


    if (!vehiculoId) {

        alert(
            "Selecciona un vehículo."
        );

        return;
    }


    const aviso =
        encontrarAvisoPorId(
            avisoId
        );


    if (!aviso) {

        alert(
            "No se ha encontrado el aviso."
        );

        return;
    }


    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {

        alert(
            "No se ha encontrado la planificación del vehículo."
        );

        return;
    }


    const vehiculoAnterior =
        encontrarVehiculoConAviso(
            avisoId
        );


    if (
        vehiculoAnterior &&
        vehiculoAnterior !==
            vehiculoId
    ) {

        const nombreAnterior =
            obtenerNombreVehiculo(
                vehiculoAnterior
            );


        const nombreNuevo =
            obtenerNombreVehiculo(
                vehiculoId
            );


        const confirmar =
            confirm(
                `El aviso ya está asignado a ${nombreAnterior}.\n\n` +
                `¿Quieres moverlo a ${nombreNuevo}?`
            );


        if (!confirmar) {
            return;
        }


        quitarAvisoDePlanSinPerderAviso(
            avisoId,
            vehiculoAnterior
        );
    }


    const yaExiste =
        (
            plan.paradas ||
            []
        ).some(
            parada => {

                return (
                    String(
                        parada.tipo
                    ).toUpperCase() ===
                        "AVISO" &&
                    String(
                        parada.avisoId ||
                        parada.id_aviso ||
                        parada.id
                    ) ===
                        String(avisoId)
                );
            }
        );


    if (!yaExiste) {

        plan.paradas.push({

            id:
                `AVISO-${avisoId}`,

            avisoId:
                avisoId,

            tipo:
                "AVISO",

            nombre:
                obtenerPuntoAviso(
                    aviso
                ),

            especie:
                obtenerEspecieAviso(
                    aviso
                ),

            cantidad:
                obtenerCantidadAviso(
                    aviso
                ),

            lat:
                obtenerLat(
                    aviso
                ),

            lng:
                obtenerLng(
                    aviso
                ),

            municipio:
                obtenerMunicipioAviso(
                    aviso
                ),

            estado:
                "ASIGNADO",

            origen:
                "AVISO"
        });
    }


    aviso.estado =
        "ASIGNADO";


    aviso.vehiculo_id =
        vehiculoId;


    aviso.vehiculo =
        vehiculoId;


    actualizarOrdenes(
        plan
    );


    marcarPlanificacionModificada(
        plan
    );


    renderizarAvisosPendientes();

    renderizarPlanificacion();


    if (
        typeof renderizarAvisos ===
        "function"
    ) {

        renderizarAvisos();
    }


    if (
        typeof renderizarMapa ===
        "function"
    ) {

        renderizarMapa();
    }


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }
}


function encontrarAvisoPorId(
    avisoId
) {

    const avisos =
        obtenerTodosAvisos();


    return (
        avisos.find(
            aviso => {

                return (
                    String(
                        obtenerIdAviso(
                            aviso
                        )
                    ) ===
                    String(avisoId)
                );
            }
        ) ||
        null
    );
}


function encontrarVehiculoConAviso(
    avisoId
) {

    for (
        const vehiculoId
        in planificacionDia
    ) {

        const plan =
            planificacionDia[
                vehiculoId
            ];


        if (
            plan.paradas &&
            plan.paradas.some(
                parada => {

                    return (
                        String(
                            parada.tipo
                        ).toUpperCase() ===
                            "AVISO" &&
                        String(
                            parada.avisoId ||
                            parada.id_aviso ||
                            parada.id
                        ) ===
                            String(avisoId)
                    );
                }
            )
        ) {

            return vehiculoId;
        }
    }


    return null;
}


function quitarAvisoDePlanSinPerderAviso(
    avisoId,
    vehiculoId
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    plan.paradas =
        (
            plan.paradas ||
            []
        ).filter(
            parada => {

                return !(
                    String(
                        parada.tipo
                    ).toUpperCase() ===
                        "AVISO" &&
                    String(
                        parada.avisoId ||
                        parada.id_aviso ||
                        parada.id
                    ) ===
                        String(avisoId)
                );
            }
        );


    actualizarOrdenes(
        plan
    );
}


/* ============================================================
   CARGA DE PLANIFICACIÓN
============================================================ */

function cargarPlanificacionDesdeDatos() {

    planificacionDia =
        {};


    const vehiculos =
        obtenerVehiculosDisponibles();


    vehiculos.forEach(
        vehiculo => {

            const vehiculoId =
                obtenerIdVehiculo(
                    vehiculo
                );


            if (!vehiculoId) {
                return;
            }


            const tabletId =
                vehiculo.tablet_id ||
                vehiculo.tablet ||
                vehiculo.TABLET_ID ||
                "";


            const rutaHabitual =
                vehiculo.ruta_id ||
                vehiculo.ruta ||
                vehiculo.RUTA_ID ||
                "";


            planificacionDia[
                vehiculoId
            ] = {

                vehiculoId:
                    vehiculoId,

                vehiculo:
                    vehiculo,

                tabletId:
                    tabletId,

                rutaHabitual:
                    rutaHabitual,

                rutaActiva:
                    rutaHabitual,

                horaSalida:
                    vehiculo.hora_salida ||
                    "08:00",

                horaRegreso:
                    vehiculo.hora_regreso ||
                    "14:00",

                paradas:
                    [],

                modificado:
                    false
            };
        }
    );


    /* --------------------------------------------------------
       Incorporar avisos ya asignados
    -------------------------------------------------------- */

    const avisos =
        obtenerTodosAvisos();


    avisos.forEach(
        aviso => {

            const estado =
                normalizarEstado(
                    aviso.estado
                );


            if (
                estado !== "ASIGNADO" &&
                estado !== "RECOGIDO"
            ) {
                return;
            }


            const vehiculoId =
                aviso.vehiculo_id ||
                aviso.vehiculo ||
                aviso.id_vehiculo;


            if (!vehiculoId) {
                return;
            }


            const plan =
                planificacionDia[
                    vehiculoId
                ];


            if (!plan) {
                return;
            }


            const avisoId =
                obtenerIdAviso(
                    aviso
                );


            const existe =
                plan.paradas.some(
                    parada => {

                        return (
                            String(
                                parada.tipo
                            ).toUpperCase() ===
                                "AVISO" &&
                            String(
                                parada.avisoId
                            ) ===
                                String(avisoId)
                        );
                    }
                );


            if (existe) {
                return;
            }


            plan.paradas.push({

                id:
                    `AVISO-${avisoId}`,

                avisoId:
                    avisoId,

                tipo:
                    "AVISO",

                nombre:
                    obtenerPuntoAviso(
                        aviso
                    ),

                especie:
                    obtenerEspecieAviso(
                        aviso
                    ),

                cantidad:
                    obtenerCantidadAviso(
                        aviso
                    ),

                lat:
                    obtenerLat(
                        aviso
                    ),

                lng:
                    obtenerLng(
                        aviso
                    ),

                municipio:
                    obtenerMunicipioAviso(
                        aviso
                    ),

                estado:
                    estado,

                origen:
                    "AVISO"
            });
        }
    );


    /* --------------------------------------------------------
       Incorporar planificación almacenada
    -------------------------------------------------------- */

    const datos =
        obtenerDatosAplicacion();


    const planificacionGuardada =
        window.planificacionGuardada ||
        datos.PLANIFICACION ||
        null;


    if (
        planificacionGuardada &&
        typeof planificacionGuardada ===
            "object"
    ) {

        /*
         * Puede llegar como objeto indexado por vehículo.
         */

        Object.keys(
            planificacionGuardada
        ).forEach(
            vehiculoId => {

                const guardada =
                    planificacionGuardada[
                        vehiculoId
                    ];


                const plan =
                    planificacionDia[
                        vehiculoId
                    ];


                if (
                    !plan ||
                    !guardada
                ) {
                    return;
                }


                if (
                    Array.isArray(
                        guardada.paradas
                    )
                ) {

                    plan.paradas =
                        guardada.paradas;
                }


                if (
                    guardada.rutaActiva
                ) {

                    plan.rutaActiva =
                        guardada.rutaActiva;
                }


                if (
                    guardada.horaSalida
                ) {

                    plan.horaSalida =
                        guardada.horaSalida;
                }


                if (
                    guardada.horaRegreso
                ) {

                    plan.horaRegreso =
                        guardada.horaRegreso;
                }
            }
        );
    }


    Object.values(
        planificacionDia
    ).forEach(
        plan => {

            actualizarOrdenes(
                plan
            );
        }
    );
}


/* ============================================================
   VEHÍCULOS
============================================================ */

function obtenerVehiculosDisponibles() {

    const datos =
        obtenerDatosAplicacion();


    const vehiculos =
        Array.isArray(
            datos.VEHICULOS
        )
            ? datos.VEHICULOS
            : [];


    return vehiculos.filter(
        vehiculo => {

            const activo =
                vehiculo.activo ??
                vehiculo.ACTIVO ??
                true;


            return (
                activo === true ||
                String(
                    activo
                ).toUpperCase() ===
                    "TRUE" ||
                String(
                    activo
                ) === "1"
            );
        }
    );
}


function obtenerIdVehiculo(
    vehiculo
) {

    if (!vehiculo) {
        return null;
    }


    return (
        vehiculo.id_vehiculo ||
        vehiculo.vehiculo_id ||
        vehiculo.id ||
        vehiculo.ID_VEHICULO ||
        vehiculo.VEHICULO_ID ||
        vehiculo.VEHICULO ||
        null
    );
}


function obtenerNombreVehiculo(
    vehiculoId
) {

    const vehiculo =
        planificacionDia[
            vehiculoId
        ]?.vehiculo ||
        obtenerVehiculosDisponibles()
            .find(
                v =>
                    String(
                        obtenerIdVehiculo(
                            v
                        )
                    ) ===
                    String(
                        vehiculoId
                    )
            );


    if (!vehiculo) {
        return String(
            vehiculoId
        );
    }


    return (
        vehiculo.nombre ||
        vehiculo.nombre_vehiculo ||
        vehiculo.vehiculo ||
        vehiculoId
    );
}


function crearOpcionesVehiculosAsignacion(
    seleccionado
) {

    const vehiculos =
        obtenerVehiculosDisponibles();


    return `

        <option value="">
            Seleccionar...
        </option>

        ${
            vehiculos
                .map(
                    vehiculo => {

                        const id =
                            obtenerIdVehiculo(
                                vehiculo
                            );


                        const nombre =
                            vehiculo.nombre ||
                            vehiculo.nombre_vehiculo ||
                            vehiculo.vehiculo ||
                            id;


                        const selected =
                            String(id) ===
                            String(seleccionado)
                                ? " selected"
                                : "";


                        return `

                            <option
                                value="${escaparHTML(
                                    String(id)
                                )}"
                                ${selected}
                            >
                                ${escaparHTML(
                                    String(nombre)
                                )}
                            </option>

                        `;
                    }
                )
                .join("")
        }

    `;
}


/* ============================================================
   RUTAS
============================================================ */

function obtenerRutasDisponibles() {

    const datos =
        obtenerDatosAplicacion();


    return Array.isArray(
        datos.RUTAS
    )
        ? datos.RUTAS
        : [];
}


function obtenerNombreRuta(
    rutaId
) {

    if (!rutaId) {
        return "Sin ruta";
    }


    const ruta =
        obtenerRutasDisponibles()
            .find(
                r => {

                    const id =
                        r.id_ruta ||
                        r.ruta_id ||
                        r.id ||
                        r.RUTA_ID;


                    return (
                        String(id) ===
                        String(rutaId)
                    );
                }
            );


    if (!ruta) {

        const texto =
            String(
                rutaId
            ).toUpperCase();


        const nombres = {

            R1:
                "Norte",

            R2:
                "Interior",

            R3:
                "Sur"
        };


        return (
            nombres[
                texto
            ] ||
            String(
                rutaId
            )
        );
    }


    return (
        ruta.nombre ||
        ruta.nombre_ruta ||
        ruta.descripcion ||
        rutaId
    );
}


function obtenerColorRuta(
    rutaId
) {

    const id =
        String(
            rutaId ||
            ""
        ).toUpperCase();


    if (
        id === "R1"
    ) {
        return "#1976D2";
    }


    if (
        id === "R2"
    ) {
        return "#388E3C";
    }


    if (
        id === "R3"
    ) {
        return "#F57C00";
    }


    return "#467886";
}


function renderizarLeyendaRutas() {

    const contenedor =
        document.getElementById(
            "leyenda-rutas"
        );


    if (!contenedor) {
        return;
    }


    const rutas =
        obtenerRutasDisponibles();


    if (!rutas.length) {

        contenedor.innerHTML = `

            <div class="sin-rutas">
                No hay rutas configuradas.
            </div>

        `;

        return;
    }


    contenedor.innerHTML =
        rutas
            .map(
                ruta => {

                    const id =
                        ruta.id_ruta ||
                        ruta.ruta_id ||
                        ruta.id ||
                        ruta.RUTA_ID;


                    const nombre =
                        ruta.nombre ||
                        ruta.nombre_ruta ||
                        ruta.descripcion ||
                        obtenerNombreRuta(
                            id
                        );


                    const color =
                        obtenerColorRuta(
                            id
                        );


                    return `

                        <div
                            class="item-leyenda-ruta"
                        >

                            <span
                                class="color-leyenda-ruta"
                                style="background:${color}"
                            ></span>

                            <span>
                                ${escaparHTML(
                                    String(
                                        nombre
                                    )
                                )}
                            </span>

                        </div>

                    `;
                }
            )
            .join("");
}


/* ============================================================
   SELECCIÓN DE VEHÍCULO
============================================================ */

function seleccionarVehiculoPlanInicial() {

    const ids =
        Object.keys(
            planificacionDia
        );


    if (!ids.length) {

        vehiculoPlanSeleccionado =
            null;

        return;
    }


    if (
        vehiculoPlanSeleccionado &&
        planificacionDia[
            vehiculoPlanSeleccionado
        ]
    ) {
        return;
    }


    vehiculoPlanSeleccionado =
        ids[0];
}


function seleccionarVehiculoPlan(
    vehiculoId
) {

    if (
        !planificacionDia[
            vehiculoId
        ]
    ) {
        return;
    }


    vehiculoPlanSeleccionado =
        vehiculoId;


    renderizarPlanificacion();
}


function obtenerPlanSeleccionado() {

    if (
        !vehiculoPlanSeleccionado
    ) {
        return null;
    }


    return (
        planificacionDia[
            vehiculoPlanSeleccionado
        ] ||
        null
    );
}


/* ============================================================
   RESUMEN
============================================================ */

function actualizarResumenPlanificacion() {

    const contenedor =
        document.getElementById(
            "resumen-planificacion"
        );


    if (!contenedor) {
        return;
    }


    const planes =
        Object.values(
            planificacionDia
        );


    let totalAnimales =
        0;


    planes.forEach(
        plan => {

            (
                plan.paradas ||
                []
            ).forEach(
                parada => {

                    if (
                        String(
                            parada.tipo
                        ).toUpperCase() ===
                        "AVISO"
                    ) {

                        totalAnimales +=
                            Number(
                                parada.cantidad ||
                                1
                            );
                    }
                }
            );
        }
    );


    contenedor.innerHTML = `

        <span>
            ${planes.length}
            ${
                planes.length === 1
                    ? "ruta"
                    : "rutas"
            }
        </span>

        <span>
            ·
        </span>

        <span>
            ${totalAnimales}
            ${
                totalAnimales === 1
                    ? "animal"
                    : "animales"
            }
        </span>

        <a
            href="#"
            class="link-action"
            onclick="mostrarDetallePlanificacion(event)"
        >
            Ver detalle
        </a>

    `;
}


/* ============================================================
   RENDERIZADO PRINCIPAL
============================================================ */

function renderizarPlanificacion() {

    const contenedor =
        document.getElementById(
            "planificacion-dia"
        );


    if (!contenedor) {
        return;
    }


    actualizarResumenPlanificacion();


    const planes =
        Object.values(
            planificacionDia
        );


    if (!planes.length) {

        contenedor.innerHTML = `

            <div class="sin-planificacion">
                No hay vehículos disponibles para planificar.
            </div>

        `;

        return;
    }


    seleccionarVehiculoPlanInicial();


    const planSeleccionado =
        obtenerPlanSeleccionado();


    contenedor.innerHTML = `

        ${crearSelectorVehiculosPlan(
            planes
        )}

        ${
            planSeleccionado
                ? crearDetalleVehiculoPlan(
                    planSeleccionado
                )
                : ""
        }

    `;
}


/* ============================================================
   SELECTOR DE VEHÍCULOS
============================================================ */

function crearSelectorVehiculosPlan(
    planes
) {

    return `

        <div
            class="selector-vehiculos-plan"
        >

            ${
                planes
                    .map(
                        plan => {

                            const activo =
                                plan.vehiculoId ===
                                vehiculoPlanSeleccionado;


                            const nombreVehiculo =
                                obtenerNombreVehiculo(
                                    plan.vehiculoId
                                );


                            const ruta =
                                obtenerNombreRuta(
                                    plan.rutaHabitual
                                );


                            return `

                                <button
                                    type="button"
                                    class="
                                        boton-vehiculo-plan
                                        boton-selector-vehiculo-plan
                                        ${
                                            activo
                                                ? "active activo"
                                                : ""
                                        }
                                    "
                                    onclick="
                                        seleccionarVehiculoPlan(
                                            '${escaparHTML(
                                                String(
                                                    plan.vehiculoId
                                                )
                                            )}'
                                        )
                                    "
                                >

                                    <strong>
                                        ${escaparHTML(
                                            String(
                                                nombreVehiculo
                                            )
                                        )}
                                    </strong>

                                    <span>
                                        ${
                                            plan.tabletId
                                                ? `Tablet ${escaparHTML(
                                                    String(
                                                        plan.tabletId
                                                    ).replace(
                                                        /^T/i,
                                                        ""
                                                    )
                                                )}`
                                                : "Sin tablet"
                                        }

                                        · Ruta habitual:
                                        ${escaparHTML(
                                            String(
                                                ruta
                                            )
                                        )}
                                    </span>

                                </button>

                            `;
                        }
                    )
                    .join("")
            }

        </div>

    `;
}


/* ============================================================
   DETALLE DEL VEHÍCULO SELECCIONADO
============================================================ */

function crearDetalleVehiculoPlan(
    plan
) {

    const vehiculoId =
        plan.vehiculoId;


    const nombreVehiculo =
        obtenerNombreVehiculo(
            vehiculoId
        );


    const rutaHabitual =
        obtenerNombreRuta(
            plan.rutaHabitual
        );


    const rutaActiva =
        obtenerNombreRuta(
            plan.rutaActiva
        );


    const colorRuta =
        obtenerColorRuta(
            plan.rutaActiva
        );


    const totalParadas =
        (
            plan.paradas ||
            []
        ).length;


    const totalAnimales =
        (
            plan.paradas ||
            []
        ).reduce(
            (
                total,
                parada
            ) => {

                if (
                    String(
                        parada.tipo
                    ).toUpperCase() ===
                    "AVISO"
                ) {

                    return (
                        total +
                        Number(
                            parada.cantidad ||
                            1
                        )
                    );
                }


                return total;
            },
            0
        );


    const modificada =
        plan.modificado ===
        true;


    return `

        <div
            class="
                plan-vehiculo-seleccionado
                detalle-plan-vehiculo
            "
            data-vehiculo-id="${escaparHTML(
                String(
                    vehiculoId
                )
            )}"
        >

            <div
                class="plan-vehiculo-columnas"
            >

                <!-- ==========================================
                     COLUMNA INFORMACIÓN
                =========================================== -->

                <div
                    class="
                        plan-columna
                        columna-info-plan
                    "
                >

                    <div
                        class="
                            plan-bloque
                            bloque-cabecera-vehiculo
                        "
                    >

                        <div
                            class="cabecera-plan-vehiculo"
                        >

                            <div>

                                <span
                                    class="etiqueta-plan"
                                >
                                    VEHÍCULO
                                </span>

                                <h3>
                                    ${escaparHTML(
                                        String(
                                            nombreVehiculo
                                        )
                                    )}
                                </h3>

                            </div>


                            <button
                                type="button"
                                class="boton-centro-plan"
                                onclick="
                                    centrarVehiculoDesdePlan(
                                        '${escaparHTML(
                                            String(
                                                vehiculoId
                                            )
                                        )}'
                                    )
                                "
                                title="Centrar vehículo en el mapa"
                            >
                                📍
                            </button>

                        </div>


                        <div
                            class="datos-vehiculo-plan"
                        >

                            <div>

                                <span>
                                    Tablet
                                </span>

                                <strong>
                                    ${
                                        plan.tabletId
                                            ? escaparHTML(
                                                String(
                                                    plan.tabletId
                                                )
                                            )
                                            : "—"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Ruta habitual
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        String(
                                            rutaHabitual
                                        )
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>


                    <!-- RUTA ACTIVA -->

                    <div
                        class="plan-bloque"
                    >

                        <div
                            class="titulo-bloque-plan"
                        >
                            <span>
                                RUTA ACTIVA
                            </span>
                        </div>


                        <label
                            for="ruta-plan-${escaparHTML(
                                String(
                                    vehiculoId
                                )
                            )}"
                            class="etiqueta-campo-plan"
                        >
                            Ruta de trabajo
                        </label>


                        <select
                            id="ruta-plan-${escaparHTML(
                                String(
                                    vehiculoId
                                )
                            )}"
                            name="ruta-plan-${escaparHTML(
                                String(
                                    vehiculoId
                                )
                            )}"
                            class="selector-ruta-plan"
                            onchange="
                                cambiarRutaPlanificada(
                                    '${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}',
                                    this.value
                                )
                            "
                        >
                            ${crearOpcionesRutas(
                                plan.rutaActiva
                            )}
                        </select>


                        <div
                            class="ruta-activa-indicador"
                            style="border-left-color:${colorRuta}"
                        >

                            <span>
                                Habitual:
                            </span>

                            <strong>
                                ${escaparHTML(
                                    String(
                                        rutaHabitual
                                    )
                                )}
                            </strong>

                            <span>
                                →
                            </span>

                            <strong>
                                ${escaparHTML(
                                    String(
                                        rutaActiva
                                    )
                                )}
                            </strong>

                        </div>

                    </div>


                    <!-- HORARIOS -->

                    <div
                        class="plan-bloque"
                    >

                        <div
                            class="titulo-bloque-plan"
                        >

                            <span>
                                HORARIO PREVISTO
                            </span>

                        </div>


                        <div
                            class="horarios-plan"
                        >

                            <div
                                class="campo-hora-plan"
                            >

                                <label
                                    for="salida-plan-${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}"
                                >
                                    Salida
                                </label>


                                <input
                                    id="salida-plan-${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}"
                                    name="salida-plan-${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}"
                                    type="time"
                                    value="${escaparHTML(
                                        String(
                                            plan.horaSalida ||
                                            "08:00"
                                        )
                                    )}"
                                    onchange="
                                        cambiarHoraPlanificacion(
                                            '${escaparHTML(
                                                String(
                                                    vehiculoId
                                                )
                                            )}',
                                            'salida',
                                            this.value
                                        )
                                    "
                                />

                            </div>


                            <div
                                class="campo-hora-plan"
                            >

                                <label
                                    for="regreso-plan-${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}"
                                >
                                    Regreso
                                </label>


                                <input
                                    id="regreso-plan-${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}"
                                    name="regreso-plan-${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}"
                                    type="time"
                                    value="${escaparHTML(
                                        String(
                                            plan.horaRegreso ||
                                            "14:00"
                                        )
                                    )}"
                                    onchange="
                                        cambiarHoraPlanificacion(
                                            '${escaparHTML(
                                                String(
                                                    vehiculoId
                                                )
                                            )}',
                                            'regreso',
                                            this.value
                                        )
                                    "
                                />

                            </div>

                        </div>

                    </div>


                    <!-- RESUMEN -->

                    <div
                        class="
                            plan-bloque
                            resumen-plan-vehiculo
                        "
                    >

                        <div
                            class="titulo-bloque-plan"
                        >

                            <span>
                                RESUMEN
                            </span>

                        </div>


                        <div
                            class="resumen-plan-datos"
                        >

                            <div>

                                <strong>
                                    ${totalParadas}
                                </strong>

                                <span>
                                    ${
                                        totalParadas === 1
                                            ? "parada"
                                            : "paradas"
                                    }
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${totalAnimales}
                                </strong>

                                <span>
                                    ${
                                        totalAnimales === 1
                                            ? "animal"
                                            : "animales"
                                    }
                                </span>

                            </div>

                        </div>


                        ${
                            modificada
                                ? `
                                    <div
                                        id="indicador-planificacion-modificada"
                                        class="plan-modificado"
                                    >
                                        ● Planificación modificada
                                    </div>
                                `
                                : `
                                    <div
                                        id="indicador-planificacion-modificada"
                                        class="
                                            plan-modificado
                                            oculto
                                        "
                                    >
                                        ● Planificación modificada
                                    </div>
                                `
                        }

                    </div>

                </div>


                <!-- ==========================================
                     COLUMNA RUTA PROPUESTA
                =========================================== -->

                <div
                    class="
                        plan-columna
                        columna-ruta-plan
                    "
                >

                    <div
                        class="
                            ruta-propuesta-header
                            cabecera-ruta-propuesta
                        "
                    >

                        <div>

                            <h3>
                                RUTA PROPUESTA
                            </h3>

                            <div
                                class="
                                    ruta-propuesta-info
                                    contador-paradas-ruta
                                "
                            >
                                ${totalParadas}
                                ${
                                    totalParadas === 1
                                        ? "parada"
                                        : "paradas"
                                }
                            </div>

                        </div>


                        <span
                            class="indicador-color-ruta"
                            style="background:${colorRuta}"
                            title="${escaparHTML(
                                String(
                                    rutaActiva
                                )
                            )}"
                        ></span>

                    </div>


                    <div
                        class="
                            ruta-propuesta
                            lista-paradas
                        "
                    >

                        ${
                            totalParadas
                                ? plan.paradas
                                    .map(
                                        (
                                            parada,
                                            index
                                        ) =>
                                            crearParadaHTML(
                                                plan,
                                                parada,
                                                index
                                            )
                                    )
                                    .join("")
                                : `
                                    <div
                                        class="sin-paradas"
                                    >
                                        No hay paradas planificadas.
                                    </div>
                                `
                        }

                    </div>


                    <!-- AÑADIR PARADA -->

                    <button
                        type="button"
                        class="boton-anadir-parada-principal"
                        onclick="
                            mostrarMenuAnadirParada(
                                '${escaparHTML(
                                    String(
                                        vehiculoId
                                    )
                                )}'
                            )
                        "
                    >
                        + Añadir parada
                    </button>


                    <div
                        id="menu-anadir-parada-${escaparHTML(
                            String(
                                vehiculoId
                            )
                        )}"
                        class="
                            menu-anadir-parada
                            opciones-anadir-parada
                            oculto
                        "
                    >

                        <button
                            type="button"
                            class="opcion-anadir-parada"
                            onclick="
                                mostrarOpcionesAvisosParada(
                                    '${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}'
                                )
                            "
                        >
                            <span>
                                🔔
                            </span>

                            <strong>
                                Aviso pendiente
                            </strong>

                        </button>


                        <button
                            type="button"
                            class="opcion-anadir-parada"
                            onclick="
                                mostrarOpcionesPuntosParada(
                                    '${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}'
                                )
                            "
                        >
                            <span>
                                📍
                            </span>

                            <strong>
                                Punto habitual
                            </strong>

                        </button>


                        <button
                            type="button"
                            class="opcion-anadir-parada"
                            onclick="
                                prepararNuevoPuntoEnMapa(
                                    '${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}'
                                )
                            "
                        >
                            <span>
                                📌
                            </span>

                            <strong>
                                Nuevo punto en mapa
                            </strong>

                        </button>


                        <button
                            type="button"
                            class="opcion-anadir-parada"
                            onclick="
                                buscarDireccionParaParada(
                                    '${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}'
                                )
                            "
                        >
                            <span>
                                🔎
                            </span>

                            <strong>
                                Buscar dirección
                            </strong>

                        </button>

                    </div>


                    <!-- OPTIMIZACIÓN -->

                    <div
                        class="acciones-plan"
                    >

                        <button
                            type="button"
                            class="boton-secundario"
                            onclick="
                                reordenarParadas(
                                    '${escaparHTML(
                                        String(
                                            vehiculoId
                                        )
                                    )}'
                                )
                            "
                        >
                            ↕ Optimizar / recalcular
                        </button>

                    </div>

                </div>

            </div>

        </div>

    `;
}


/* ============================================================
   OPCIONES DE RUTAS
============================================================ */

function crearOpcionesRutas(
    rutaSeleccionada
) {

    const rutas =
        obtenerRutasDisponibles();


    if (!rutas.length) {

        return `

            <option value="">
                Sin rutas disponibles
            </option>

        `;
    }


    return rutas
        .map(
            ruta => {

                const id =
                    ruta.id_ruta ||
                    ruta.ruta_id ||
                    ruta.id ||
                    ruta.RUTA_ID;


                const nombre =
                    ruta.nombre ||
                    ruta.nombre_ruta ||
                    ruta.descripcion ||
                    obtenerNombreRuta(
                        id
                    );


                const selected =
                    String(id) ===
                    String(rutaSeleccionada)
                        ? " selected"
                        : "";


                return `

                    <option
                        value="${escaparHTML(
                            String(id)
                        )}"
                        ${selected}
                    >
                        ${escaparHTML(
                            String(
                                nombre
                            )
                        )}
                    </option>

                `;
            }
        )
        .join("");
}


/* ============================================================
   MENÚ AÑADIR PARADA
============================================================ */

function mostrarMenuAnadirParada(
    vehiculoId
) {

    cerrarMenusAnadirParada();


    const menu =
        document.getElementById(
            `menu-anadir-parada-${vehiculoId}`
        );


    if (!menu) {
        return;
    }


    menu.classList.remove(
        "oculto"
    );
}


function cerrarMenusAnadirParada() {

    document
        .querySelectorAll(
            ".menu-anadir-parada"
        )
        .forEach(
            menu => {

                menu.classList.add(
                    "oculto"
                );
            }
        );


    document
        .querySelectorAll(
            ".subopciones-anadir-parada"
        )
        .forEach(
            elemento => {

                elemento.remove();
            }
        );
}


/* ============================================================
   AÑADIR AVISO
============================================================ */

function mostrarOpcionesAvisosParada(
    vehiculoId
) {

    const menu =
        document.getElementById(
            `menu-anadir-parada-${vehiculoId}`
        );


    if (!menu) {
        return;
    }


    const avisos =
        obtenerAvisosPendientes();


    const existente =
        menu.querySelector(
            ".subopciones-anadir-parada"
        );


    if (existente) {
        existente.remove();
    }


    if (!avisos.length) {

        const mensaje =
            document.createElement(
                "div"
            );


        mensaje.className =
            "subopciones-anadir-parada";


        mensaje.innerHTML = `

            <div
                class="sin-opciones-parada"
            >
                No hay avisos pendientes disponibles.
            </div>

        `;


        menu.appendChild(
            mensaje
        );


        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "subopciones-anadir-parada selector-secundario-parada";


    const select =
        document.createElement(
            "select"
        );


    select.id =
        `selector-aviso-${vehiculoId}`;


    select.name =
        `selector-aviso-${vehiculoId}`;


    select.innerHTML = `

        <option value="">
            Seleccionar aviso...
        </option>

        ${
            avisos
                .map(
                    aviso => {

                        const id =
                            obtenerIdAviso(
                                aviso
                            );


                        const especie =
                            obtenerEspecieAviso(
                                aviso
                            );


                        const punto =
                            obtenerPuntoAviso(
                                aviso
                            );


                        return `

                            <option
                                value="${escaparHTML(
                                    String(id)
                                )}"
                            >
                                ${escaparHTML(
                                    String(
                                        especie
                                    )
                                )}
                                ·
                                ${escaparHTML(
                                    String(
                                        punto
                                    )
                                )}
                            </option>

                        `;
                    }
                )
                .join("")
        }

    `;


    const boton =
        document.createElement(
            "button"
        );


    boton.type =
        "button";


    boton.textContent =
        "Añadir";


    boton.onclick =
        function () {

            anadirParadaSeleccionada(
                vehiculoId,
                "AVISO",
                select.value
            );
        };


    wrapper.appendChild(
        select
    );


    wrapper.appendChild(
        boton
    );


    menu.appendChild(
        wrapper
    );
}


/* ============================================================
   AÑADIR PUNTO HABITUAL
============================================================ */

function mostrarOpcionesPuntosParada(
    vehiculoId
) {

    const menu =
        document.getElementById(
            `menu-anadir-parada-${vehiculoId}`
        );


    if (!menu) {
        return;
    }


    const existente =
        menu.querySelector(
            ".subopciones-anadir-parada"
        );


    if (existente) {
        existente.remove();
    }


    const datos =
        obtenerDatosAplicacion();


    const puntos =
        Array.isArray(
            datos.PUNTOS_RECOGIDA
        )
            ? datos.PUNTOS_RECOGIDA
            : [];


    const activos =
        puntos.filter(
            punto => {

                const activo =
                    punto.activo ??
                    punto.ACTIVO ??
                    true;


                return (
                    activo === true ||
                    String(
                        activo
                    ).toUpperCase() ===
                        "TRUE" ||
                    String(
                        activo
                    ) === "1"
                );
            }
        );


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "subopciones-anadir-parada selector-secundario-parada";


    if (!activos.length) {

        wrapper.innerHTML = `

            <div
                class="sin-opciones-parada"
            >
                No hay puntos habituales disponibles.
            </div>

        `;


        menu.appendChild(
            wrapper
        );


        return;
    }


    const select =
        document.createElement(
            "select"
        );


    select.id =
        `selector-punto-${vehiculoId}`;


    select.name =
        `selector-punto-${vehiculoId}`;


    select.innerHTML = `

        <option value="">
            Seleccionar punto...
        </option>

        ${
            activos
                .map(
                    punto => {

                        const id =
                            punto.id_punto ||
                            punto.id ||
                            punto.ID_PUNTO;


                        const nombre =
                            punto.nombre ||
                            punto.nombre_punto ||
                            punto.descripcion ||
                            "Punto de recogida";


                        const municipio =
                            punto.municipio ||
                            "";


                        return `

                            <option
                                value="${escaparHTML(
                                    String(id)
                                )}"
                            >
                                ${escaparHTML(
                                    String(
                                        nombre
                                    )
                                )}

                                ${
                                    municipio
                                        ? ` · ${escaparHTML(
                                            String(
                                                municipio
                                            )
                                        )}`
                                        : ""
                                }

                            </option>

                        `;
                    }
                )
                .join("")
        }

    `;


    const boton =
        document.createElement(
            "button"
        );


    boton.type =
        "button";


    boton.textContent =
        "Añadir";


    boton.onclick =
        function () {

            anadirParadaSeleccionada(
                vehiculoId,
                "PUNTO",
                select.value
            );
        };


    wrapper.appendChild(
        select
    );


    wrapper.appendChild(
        boton
    );


    menu.appendChild(
        wrapper
    );
}


/* ============================================================
   NUEVO PUNTO EN MAPA
============================================================ */

function prepararNuevoPuntoEnMapa(
    vehiculoId
) {

    cerrarMenusAnadirParada();


    alert(
        "Selecciona el nuevo punto directamente en el mapa."
    );


    if (
        typeof window.activarSeleccionPuntoMapa ===
        "function"
    ) {

        window.activarSeleccionPuntoMapa(
            vehiculoId
        );
    }
}


/* ============================================================
   BUSCAR DIRECCIÓN
============================================================ */

function buscarDireccionParaParada(
    vehiculoId
) {

    cerrarMenusAnadirParada();


    alert(
        "La búsqueda de dirección se integrará con el buscador del mapa."
    );


    if (
        typeof window.abrirBuscadorDireccion ===
        "function"
    ) {

        window.abrirBuscadorDireccion(
            vehiculoId
        );
    }
}


/* ============================================================
   AÑADIR PARADA SELECCIONADA
============================================================ */

function anadirParadaSeleccionada(
    vehiculoId,
    tipo,
    elementoId
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    if (!elementoId) {

        alert(
            "Selecciona un elemento."
        );

        return;
    }


    /* --------------------------------------------------------
       AVISO
    -------------------------------------------------------- */

    if (
        String(
            tipo
        ).toUpperCase() ===
        "AVISO"
    ) {

        const aviso =
            encontrarAvisoPorId(
                elementoId
            );


        if (!aviso) {

            alert(
                "No se ha encontrado el aviso."
            );

            return;
        }


        const avisoId =
            obtenerIdAviso(
                aviso
            );


        const existe =
            plan.paradas.some(
                parada => {

                    return (
                        String(
                            parada.tipo
                        ).toUpperCase() ===
                            "AVISO" &&
                        String(
                            parada.avisoId
                        ) ===
                            String(
                                avisoId
                            )
                    );
                }
            );


        if (existe) {

            alert(
                "Este aviso ya está incluido en la ruta."
            );

            return;
        }


        plan.paradas.push({

            id:
                `AVISO-${avisoId}`,

            avisoId:
                avisoId,

            tipo:
                "AVISO",

            nombre:
                obtenerPuntoAviso(
                    aviso
                ),

            especie:
                obtenerEspecieAviso(
                    aviso
                ),

            cantidad:
                obtenerCantidadAviso(
                    aviso
                ),

            lat:
                obtenerLat(
                    aviso
                ),

            lng:
                obtenerLng(
                    aviso
                ),

            municipio:
                obtenerMunicipioAviso(
                    aviso
                ),

            estado:
                "ASIGNADO",

            origen:
                "AVISO"
        });


        aviso.estado =
            "ASIGNADO";


        aviso.vehiculo_id =
            vehiculoId;


        aviso.vehiculo =
            vehiculoId;
    }


    /* --------------------------------------------------------
       PUNTO HABITUAL
    -------------------------------------------------------- */

    if (
        String(
            tipo
        ).toUpperCase() ===
        "PUNTO"
    ) {

        const datos =
            obtenerDatosAplicacion();


        const puntos =
            Array.isArray(
                datos.PUNTOS_RECOGIDA
            )
                ? datos.PUNTOS_RECOGIDA
                : [];


        const punto =
            puntos.find(
                p => {

                    const id =
                        p.id_punto ||
                        p.id ||
                        p.ID_PUNTO;


                    return (
                        String(id) ===
                        String(
                            elementoId
                        )
                    );
                }
            );


        if (!punto) {

            alert(
                "No se ha encontrado el punto."
            );

            return;
        }


        const puntoId =
            punto.id_punto ||
            punto.id ||
            punto.ID_PUNTO;


        const existe =
            plan.paradas.some(
                parada => {

                    return (
                        String(
                            parada.tipo
                        ).toUpperCase() ===
                            "PUNTO" &&
                        String(
                            parada.puntoId
                        ) ===
                            String(
                                puntoId
                            )
                    );
                }
            );


        if (existe) {

            alert(
                "Este punto ya está incluido en la ruta."
            );

            return;
        }


        plan.paradas.push({

            id:
                `PUNTO-${puntoId}`,

            puntoId:
                puntoId,

            tipo:
                "PUNTO",

            nombre:
                punto.nombre ||
                punto.nombre_punto ||
                punto.descripcion ||
                "Punto de recogida",

            municipio:
                punto.municipio ||
                "",

            lat:
                obtenerLat(
                    punto
                ),

            lng:
                obtenerLng(
                    punto
                ),

            estado:
                "PLANIFICADO",

            origen:
                "PUNTO"
        });
    }


    actualizarOrdenes(
        plan
    );


    marcarPlanificacionModificada(
        plan
    );


    cerrarMenusAnadirParada();


    renderizarPlanificacion();


    if (
        typeof actualizarRutaEnMapa ===
        "function"
    ) {

        actualizarRutaEnMapa(
            plan
        );
    }


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }
}


/* ============================================================
   CREAR HTML DE PARADA
============================================================ */

function crearParadaHTML(
    plan,
    parada,
    index
) {

    const tipo =
        String(
            parada.tipo ||
            ""
        ).toUpperCase();


    const esAviso =
        tipo === "AVISO";


    const numero =
        index + 1;


    const nombre =
        parada.nombre ||
        "Parada sin nombre";


    const especie =
        parada.especie ||
        "";


    const municipio =
        parada.municipio ||
        "";


    const estado =
        normalizarEstado(
            parada.estado
        );


    let claseEstado =
        "estado-parada";


    if (
        estado ===
        "ASIGNADO"
    ) {

        claseEstado +=
            " estado-asignado";
    }


    if (
        estado ===
        "RECOGIDO"
    ) {

        claseEstado +=
            " estado-recogido";
    }


    if (
        estado ===
        "PENDIENTE"
    ) {

        claseEstado +=
            " estado-pendiente";
    }


    return `

        <div
            class="parada-plan"
            data-parada-index="${index}"
            data-vehiculo-id="${escaparHTML(
                String(
                    plan.vehiculoId
                )
            )}"
            onclick="
                seleccionarParadaEnMapa(
                    '${escaparHTML(
                        String(
                            plan.vehiculoId
                        )
                    )}',
                    ${index}
                )
            "
        >

            <div
                class="numero-parada"
            >
                ${numero}
            </div>


            <div
                class="icono-parada"
            >
                ${
                    esAviso
                        ? "🔔"
                        : "📍"
                }
            </div>


            <div
                class="informacion-parada"
            >

                <strong>
                    ${escaparHTML(
                        String(
                            nombre
                        )
                    )}
                </strong>


                ${
                    especie
                        ? `
                            <span
                                class="especie-parada"
                            >
                                ${escaparHTML(
                                    String(
                                        especie
                                    )
                                )}
                            </span>
                        `
                        : ""
                }


                ${
                    municipio
                        ? `
                            <span
                                class="detalles-parada"
                            >
                                ${escaparHTML(
                                    String(
                                        municipio
                                    )
                                )}
                            </span>
                        `
                        : ""
                }


                <span
                    class="${claseEstado}"
                >
                    ${textoEstadoParada(
                        estado
                    )}
                </span>

            </div>


            <div
                class="acciones-parada"
                onclick="event.stopPropagation()"
            >

                <button
                    type="button"
                    title="Subir parada"
                    onclick="
                        subirParada(
                            '${escaparHTML(
                                String(
                                    plan.vehiculoId
                                )
                            )}',
                            ${index}
                        )
                    "
                    ${
                        index === 0
                            ? "disabled"
                            : ""
                    }
                >
                    ↑
                </button>


                <button
                    type="button"
                    title="Bajar parada"
                    onclick="
                        bajarParada(
                            '${escaparHTML(
                                String(
                                    plan.vehiculoId
                                )
                            )}',
                            ${index}
                        )
                    "
                    ${
                        index ===
                        (
                            plan.paradas.length -
                            1
                        )
                            ? "disabled"
                            : ""
                    }
                >
                    ↓
                </button>


                <button
                    type="button"
                    title="Eliminar parada"
                    onclick="
                        eliminarParada(
                            '${escaparHTML(
                                String(
                                    plan.vehiculoId
                                )
                            )}',
                            ${index}
                        )
                    "
                >
                    ×
                </button>

            </div>

        </div>

    `;
}


/* ============================================================
   SELECCIÓN / CENTRADO EN MAPA
============================================================ */

function seleccionarParadaEnMapa(
    vehiculoId,
    index
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    const parada =
        plan.paradas[
            index
        ];


    if (!parada) {
        return;
    }


    if (
        typeof window.centrarParadaEnMapa ===
        "function"
    ) {

        window.centrarParadaEnMapa(
            parada
        );

        return;
    }


    if (
        typeof window.map !==
            "undefined" &&
        window.map &&
        coordenadasValidas(
            obtenerLat(
                parada
            ),
            obtenerLng(
                parada
            )
        )
    ) {

        window.map.setView(
            [
                obtenerLat(
                    parada
                ),
                obtenerLng(
                    parada
                )
            ],
            14
        );
    }
}


function centrarVehiculoDesdePlan(
    vehiculoId
) {

    if (
        typeof window.centrarVehiculoEnMapa ===
        "function"
    ) {

        window.centrarVehiculoEnMapa(
            vehiculoId
        );

        return;
    }


    if (
        typeof window.centrarVehiculo ===
        "function"
    ) {

        window.centrarVehiculo(
            vehiculoId
        );
    }
}


/* ============================================================
   ELIMINAR PARADA
============================================================ */

function eliminarParada(
    vehiculoId,
    index
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    const parada =
        plan.paradas[
            index
        ];


    if (!parada) {
        return;
    }


    const confirmar =
        confirm(
            `¿Eliminar la parada "${parada.nombre}" de la planificación?`
        );


    if (!confirmar) {
        return;
    }


    if (
        String(
            parada.tipo
        ).toUpperCase() ===
        "AVISO"
    ) {

        const aviso =
            encontrarAvisoPorId(
                parada.avisoId
            );


        if (
            aviso &&
            normalizarEstado(
                aviso.estado
            ) !==
                "RECOGIDO"
        ) {

            aviso.estado =
                "PENDIENTE";


            delete aviso.vehiculo_id;

            delete aviso.vehiculo;
        }
    }


    plan.paradas.splice(
        index,
        1
    );


    actualizarOrdenes(
        plan
    );


    marcarPlanificacionModificada(
        plan
    );


    renderizarAvisosPendientes();

    renderizarPlanificacion();


    if (
        typeof renderizarAvisos ===
        "function"
    ) {

        renderizarAvisos();
    }


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }
}


/* ============================================================
   SUBIR / BAJAR PARADA
============================================================ */

function subirParada(
    vehiculoId,
    index
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (
        !plan ||
        index <= 0 ||
        index >=
            plan.paradas.length
    ) {
        return;
    }


    const temporal =
        plan.paradas[
            index - 1
        ];


    plan.paradas[
        index - 1
    ] =
        plan.paradas[
            index
        ];


    plan.paradas[
        index
    ] =
        temporal;


    actualizarOrdenes(
        plan
    );


    marcarPlanificacionModificada(
        plan
    );


    renderizarPlanificacion();


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }
}


function bajarParada(
    vehiculoId,
    index
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (
        !plan ||
        index < 0 ||
        index >=
            plan.paradas.length - 1
    ) {
        return;
    }


    const temporal =
        plan.paradas[
            index + 1
        ];


    plan.paradas[
        index + 1
    ] =
        plan.paradas[
            index
        ];


    plan.paradas[
        index
    ] =
        temporal;


    actualizarOrdenes(
        plan
    );


    marcarPlanificacionModificada(
        plan
    );


    renderizarPlanificacion();


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }
}


/* ============================================================
   ORDENES
============================================================ */

function actualizarOrdenes(
    plan
) {

    if (
        !plan ||
        !Array.isArray(
            plan.paradas
        )
    ) {
        return;
    }


    plan.paradas.forEach(
        (
            parada,
            index
        ) => {

            parada.orden =
                index + 1;
        }
    );
}


function reordenarParadas(
    vehiculoId
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    if (
        typeof window.optimizarRutaVehiculo ===
        "function"
    ) {

        window.optimizarRutaVehiculo(
            vehiculoId,
            plan.paradas
        );


        actualizarOrdenes(
            plan
        );


        marcarPlanificacionModificada(
            plan
        );


        renderizarPlanificacion();


        if (
            typeof dibujarRutas ===
            "function"
        ) {

            dibujarRutas();
        }


        return;
    }


    alert(
        "La recalculación automática de la ruta se ejecutará cuando esté conectado el motor de rutas."
    );
}


/* ============================================================
   CAMBIO DE RUTA
============================================================ */

function cambiarRutaPlanificada(
    vehiculoId,
    rutaId
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    plan.rutaActiva =
        rutaId;


    marcarPlanificacionModificada(
        plan
    );


    renderizarPlanificacion();


    if (
        typeof window.actualizarRutaVehiculoEnMapa ===
        "function"
    ) {

        window.actualizarRutaVehiculoEnMapa(
            vehiculoId,
            rutaId
        );
    }


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }
}


/* ============================================================
   CAMBIO DE HORAS
============================================================ */

function cambiarHoraPlanificacion(
    vehiculoId,
    tipo,
    valor
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {
        return;
    }


    if (
        tipo === "salida"
    ) {

        plan.horaSalida =
            valor;
    }


    if (
        tipo === "regreso"
    ) {

        plan.horaRegreso =
            valor;
    }


    marcarPlanificacionModificada(
        plan
    );
}


/* ============================================================
   MARCAR MODIFICACIÓN
============================================================ */

function marcarPlanificacionModificada(
    plan
) {

    if (!plan) {
        return;
    }


    plan.modificado =
        true;


    const indicador =
        document.getElementById(
            "indicador-planificacion-modificada"
        );


    if (indicador) {

        indicador.classList.remove(
            "oculto"
        );
    }
}


/* ============================================================
   DETALLE COMPLETO
============================================================ */

function mostrarDetallePlanificacion(
    event
) {

    if (event) {
        event.preventDefault();
    }


    if (
        typeof window.mostrarVistaPlanificacionCompleta ===
        "function"
    ) {

        window.mostrarVistaPlanificacionCompleta();

        return;
    }


    const plan =
        obtenerPlanSeleccionado();


    if (!plan) {
        return;
    }


    alert(
        `Planificación de ${obtenerNombreVehiculo(
            plan.vehiculoId
        )}\n\n` +
        `${plan.paradas.length} paradas`
    );
}


/* ============================================================
   COORDENADAS
============================================================ */

function obtenerLat(
    elemento
) {

    if (!elemento) {
        return null;
    }


    const valor =
        elemento.lat ??
        elemento.latitud ??
        elemento.latitude ??
        elemento.LATITUD ??
        elemento.LAT ??
        null;


    const numero =
        Number(
            String(
                valor
            )
                .replace(
                    ",",
                    "."
                )
                .trim()
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : null;
}


function obtenerLng(
    elemento
) {

    if (!elemento) {
        return null;
    }


    const valor =
        elemento.lng ??
        elemento.lon ??
        elemento.longitud ??
        elemento.longitude ??
        elemento.LONGITUD ??
        elemento.LNG ??
        null;


    const numero =
        Number(
            String(
                valor
            )
                .replace(
                    ",",
                    "."
                )
                .trim()
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : null;
}


function coordenadasValidas(
    lat,
    lng
) {

    return (
        Number.isFinite(
            Number(lat)
        ) &&
        Number.isFinite(
            Number(lng)
        ) &&
        Number(lat) >= -90 &&
        Number(lat) <= 90 &&
        Number(lng) >= -180 &&
        Number(lng) <= 180
    );
}


function formatearCoordenadasAviso(
    aviso
) {

    const lat =
        obtenerLat(
            aviso
        );


    const lng =
        obtenerLng(
            aviso
        );


    if (
        !coordenadasValidas(
            lat,
            lng
        )
    ) {

        return "Sin coordenadas";
    }


    return (
        `${lat.toFixed(5)}, ` +
        `${lng.toFixed(5)}`
    );
}


/* ============================================================
   DISTANCIA
============================================================ */

function calcularDistanciaKm(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R =
        6371;


    const dLat =
        gradosARadianes(
            lat2 -
            lat1
        );


    const dLng =
        gradosARadianes(
            lng2 -
            lng1
        );


    const a =
        Math.sin(
            dLat / 2
        ) *
            Math.sin(
                dLat / 2
            ) +

        Math.cos(
            gradosARadianes(
                lat1
            )
        ) *

        Math.cos(
            gradosARadianes(
                lat2
            )
        ) *

        Math.sin(
            dLng / 2
        ) *

        Math.sin(
            dLng / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(
                1 - a
            )
        );


    return R * c;
}


function gradosARadianes(
    grados
) {

    return (
        grados *
        Math.PI /
        180
    );
}


/* ============================================================
   UTILIDADES DE AVISOS
============================================================ */

function obtenerIdAviso(
    aviso
) {

    if (!aviso) {
        return null;
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


/* ============================================================
   ESTADOS
============================================================ */

function normalizarEstado(
    estado
) {

    return String(
        estado || ""
    )
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}


function textoEstadoParada(
    estado
) {

    const normalizado =
        normalizarEstado(
            estado
        );


    switch (
        normalizado
    ) {

        case "PENDIENTE":
            return "Pendiente";

        case "ASIGNADO":
            return "Asignado";

        case "RECOGIDO":
            return "Recogido";

        case "PLANIFICADO":
            return "Planificado";

        default:
            return (
                estado ||
                "Planificado"
            );
    }
}


/* ============================================================
   NORMALIZACIÓN DE TEXTO
============================================================ */

function normalizarTexto(
    texto
) {

    return String(
        texto || ""
    )
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}


/* ============================================================
   ESCAPAR HTML
============================================================ */

function escaparHTML(
    texto
) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* ============================================================
   EXPORTAR FUNCIONES
============================================================ */

window.inicializarPlanificacion =
    inicializarPlanificacion;

window.renderizarPlanificacion =
    renderizarPlanificacion;

window.renderizarAvisosPendientes =
    renderizarAvisosPendientes;

window.obtenerAvisosPendientes =
    obtenerAvisosPendientes;

window.obtenerTodosAvisos =
    obtenerTodosAvisos;

window.obtenerAvisosFiltrados =
    obtenerAvisosFiltrados;

window.filtrarAvisosPendientes =
    filtrarAvisosPendientes;

window.cambiarFiltroAvisosPendientes =
    cambiarFiltroAvisosPendientes;

window.mostrarTodosAvisos =
    mostrarTodosAvisos;

window.asignarAvisoAVehiculo =
    asignarAvisoAVehiculo;

window.seleccionarVehiculoPlan =
    seleccionarVehiculoPlan;

window.mostrarMenuAnadirParada =
    mostrarMenuAnadirParada;

window.cerrarMenusAnadirParada =
    cerrarMenusAnadirParada;

window.mostrarOpcionesAvisosParada =
    mostrarOpcionesAvisosParada;

window.mostrarOpcionesPuntosParada =
    mostrarOpcionesPuntosParada;

window.prepararNuevoPuntoEnMapa =
    prepararNuevoPuntoEnMapa;

window.buscarDireccionParaParada =
    buscarDireccionParaParada;

window.anadirParadaSeleccionada =
    anadirParadaSeleccionada;

window.eliminarParada =
    eliminarParada;

window.subirParada =
    subirParada;

window.bajarParada =
    bajarParada;

window.reordenarParadas =
    reordenarParadas;

window.actualizarOrdenes =
    actualizarOrdenes;

window.cambiarRutaPlanificada =
    cambiarRutaPlanificada;

window.cambiarHoraPlanificacion =
    cambiarHoraPlanificacion;

window.seleccionarParadaEnMapa =
    seleccionarParadaEnMapa;

window.centrarVehiculoDesdePlan =
    centrarVehiculoDesdePlan;

window.mostrarDetallePlanificacion =
    mostrarDetallePlanificacion;

window.obtenerVehiculoRecomendado =
    obtenerVehiculoRecomendado;

window.evaluarVehiculoParaAviso =
    evaluarVehiculoParaAviso;

window.obtenerMunicipioAviso =
    obtenerMunicipioAviso;

window.obtenerColaboradorAviso =
    obtenerColaboradorAviso;

window.obtenerTelefonoAviso =
    obtenerTelefonoAviso;

window.obtenerEspecieAviso =
    obtenerEspecieAviso;

window.obtenerCantidadAviso =
    obtenerCantidadAviso;

window.obtenerPuntoAviso =
    obtenerPuntoAviso;

window.obtenerRutaAviso =
    obtenerRutaAviso;

