/* ============================================================
   CRF LA GRANJA DE EL SALER
   RUTAS.JS · PLANIFICACIÓN Y GESTIÓN DE PARADAS
============================================================ */

/* ============================================================
   ESTADO GLOBAL
============================================================ */

let planificacionDia = {};
let vehiculoPlanSeleccionado = null;
let versionesRecalculoPlanificacion = {};


/*
 * FASE B · Comprueba si una versión de recálculo sigue siendo
 * la vigente para un vehículo. Solo la versión actualmente
 * vigente puede escribir resultados en planificacionDia.
 * Una versionLocal undefined (llamadas directas sin versionar)
 * conserva el comportamiento anterior sin comprobación.
 */
function versionVigente(
    vehiculoId,
    versionLocal
) {

    if (versionLocal === undefined) {
        return true;
    }


    return versionesRecalculoPlanificacion[
        vehiculoId
    ] === versionLocal;
}

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


        /*
         * FASE 3F.6.7-C4-B · recuperar marcas de borrado
         * ANTES de que cualquier gesto pueda emitir: los
         * bloqueos reconstruidos frenan de inmediato todas
         * las vías de guardado. Nunca interrumpe el arranque.
         */
        try {

            if (
                typeof recuperarMarcasBorradoAlIniciar ===
                    "function"
            ) {

                recuperarMarcasBorradoAlIniciar();
            }

        } catch (error) {

            console.error(
                "No se pudo recuperar el registro de borrados:",
                error
            );
        }

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
 * FASE AVISOS · F3: un plan pertenece a la fecha seleccionada
 * (fecha de pertenencia cargada en esta sesión). Los planes de
 * otras fechas no deben bloquear traslados ni ocultar avisos.
 */
function planPerteneceAFechaSeleccionada(plan) {

    if (!plan) {
        return false;
    }

    const fechaPlan =
        fechaServidorValidaRutas(plan.fecha);

    const fechaActual =
        fechaServidorValidaRutas(fechaServidor);

    /*
     * Sin fecha (servidor desconocido o plan sin fecha) no se
     * puede distinguir el día: se mantiene la protección para
     * no duplicar avisos dentro de la sesión.
     */
    if (!fechaPlan || !fechaActual) {
        return true;
    }

    return fechaPlan === fechaActual;
}


function encontrarVehiculoConAvisoEnFechaSeleccionada(avisoId) {

    for (
        const vehiculoId
        in planificacionDia
    ) {

        const plan =
            planificacionDia[vehiculoId];

        if (!planPerteneceAFechaSeleccionada(plan)) {
            continue;
        }

        if (
            plan.paradas &&
            plan.paradas.some(
                parada => {
                    return (
                        String(parada.tipo).toUpperCase() === "AVISO" &&
                        String(
                            parada.avisoId ||
                            parada.id_aviso ||
                            parada.id
                        ) === String(avisoId)
                    );
                }
            )
        ) {
            return vehiculoId;
        }
    }

    return null;
}


function avisoEstaPlanificadoEnFechaSeleccionada(avisoId) {

    return (
        encontrarVehiculoConAvisoEnFechaSeleccionada(avisoId) !== null
    );
}


/**
 * Devuelve únicamente los avisos pendientes.
 *
 * FASE AVISOS · F3: además excluye los avisos que ya están
 * incorporados a una parada de la planificación de la fecha
 * seleccionada, aunque su estado en la hoja AVISOS siga siendo
 * PENDIENTE. Los avisos planificados solo en otras fechas no
 * se excluyen.
 */
function obtenerAvisosPendientes() {

    return obtenerTodosAvisos()
        .filter(
            aviso =>
                normalizarEstado(
                    aviso.estado
                ) === "PENDIENTE"
        )
        .filter(
            aviso =>
                !avisoEstaPlanificadoEnFechaSeleccionada(
                    obtenerIdAviso(aviso)
                )
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

            /*
             * FASE AVISOS · F3: con el filtro PENDIENTE no se
             * muestran avisos ya incorporados a la planificación
             * de la fecha seleccionada. El filtro no cambia.
             */
            if (
                normalizarEstado(filtroAvisosEstado) === "PENDIENTE" &&
                avisoEstaPlanificadoEnFechaSeleccionada(
                    obtenerIdAviso(aviso)
                )
            ) {
                return false;
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

                                    <th scope="col">
                                        ACCIONES
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


            <td class="celda-acciones-aviso">

                ${
                    idAviso !== null &&
                    idAviso !== undefined
                        ? `
                            <div
                                class="acciones-aviso-tabla"
                            >

                                <button
                                    type="button"
                                    class="boton-asignar-aviso boton-accion-aviso"
                                    title="Ver aviso en el mapa"
                                    aria-label="Ver aviso ${escaparHTML(
                                        String(idAviso)
                                    )} en el mapa"
                                    data-aviso-id="${escaparHTML(
                                        String(idAviso)
                                    )}"
                                    onclick="event.stopPropagation(); verAvisoEnMapa(this.dataset.avisoId)"
                                >
                                    📍
                                </button>


                                <button
                                    type="button"
                                    class="boton-editar-aviso boton-accion-aviso"
                                    title="Editar aviso"
                                    aria-label="Editar aviso ${escaparHTML(
                                        String(idAviso)
                                    )}"
                                    data-aviso-id="${escaparHTML(
                                        String(idAviso)
                                    )}"
                                    onclick="event.stopPropagation(); abrirFormularioEdicionAviso(this.dataset.avisoId)"
                                >
                                    ✏️
                                </button>


                                <button
                                    type="button"
                                    class="boton-eliminar-aviso boton-accion-aviso"
                                    title="Eliminar aviso"
                                    aria-label="Eliminar aviso ${escaparHTML(
                                        String(idAviso)
                                    )}"
                                    data-aviso-id="${escaparHTML(
                                        String(idAviso)
                                    )}"
                                    onclick="event.stopPropagation(); eliminarAvisoAplicacion(this.dataset.avisoId)"
                                >
                                    🗑️
                                </button>

                            </div>
                        `
                        : ""
                }

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


    /*
     * FASE AVISOS · F1: una única vía de alta/traslado,
     * compartida con el menú «+ Añadir parada → Aviso
     * pendiente». La validación, el traslado y los efectos
     * posteriores viven en incorporarAvisoAPlan().
     */
    incorporarAvisoAPlan(
        vehiculoId,
        avisoId
    );
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


    /*
     * FASE 3F.1 · P3: el plan de ORIGEN también cambia
     * (se le retira una parada), por lo que debe quedar
     * marcado como pendiente de guardar mediante la
     * llamada central única.
     */

    marcarPlanificacionModificada(
        plan
    );
}


/* ============================================================
   FASE AVISOS · INCORPORACIÓN ÚNICA DE UN AVISO
============================================================ */

/**
 * Busca un punto de recogida por identificador.
 * No modifica datos; devuelve null si no existe.
 */
function buscarPuntoRecogidaPorId(puntoId) {

    if (
        puntoId === null ||
        puntoId === undefined ||
        String(puntoId).trim() === ""
    ) {
        return null;
    }

    const datos =
        obtenerDatosAplicacion();

    const puntos =
        Array.isArray(datos.PUNTOS_RECOGIDA)
            ? datos.PUNTOS_RECOGIDA
            : [];

    return (
        puntos.find(
            function(punto) {

                const id =
                    punto.id_punto ||
                    punto.id ||
                    punto.ID_PUNTO;

                return String(id) === String(puntoId);
            }
        ) ||
        null
    );
}


/**
 * FASE AVISOS · F4: coordenadas de un aviso.
 *
 * 1. Usa las del propio aviso si son válidas.
 * 2. Si faltan, usa las del punto de recogida asociado.
 * 3. Si tampoco hay, devuelve null (el alta se bloquea).
 *
 * Nunca inventa coordenadas ni toca otros tipos de parada.
 */
function resolverCoordenadasAvisoRutas(aviso) {

    if (!aviso) {
        return null;
    }

    const latAviso =
        obtenerLat(aviso);

    const lngAviso =
        obtenerLng(aviso);

    if (coordenadasValidas(latAviso, lngAviso)) {
        return {
            lat: Number(latAviso),
            lng: Number(lngAviso),
            origen: "AVISO"
        };
    }

    const puntoId =
        aviso.puntoId ||
        aviso.id_punto ||
        aviso.punto_id ||
        aviso.PUNTO_ID ||
        null;

    if (!puntoId) {
        return null;
    }

    const punto =
        buscarPuntoRecogidaPorId(puntoId);

    if (!punto) {
        return null;
    }

    const latPunto =
        obtenerLat(punto);

    const lngPunto =
        obtenerLng(punto);

    if (!coordenadasValidas(latPunto, lngPunto)) {
        return null;
    }

    return {
        lat: Number(latPunto),
        lng: Number(lngPunto),
        origen: "PUNTO"
    };
}


/**
 * FASE AVISOS · F1: única vía de alta/traslado de un aviso,
 * compartida por el menú «+ Añadir parada → Aviso pendiente»
 * y por el panel «Avisos pendientes → Asignar/Cambiar».
 *
 * Reglas:
 *  - valida destino, aviso, duplicado y coordenadas ANTES de
 *    modificar ningún plan;
 *  - si el aviso está en otro vehículo de la misma fecha, pide
 *    confirmación y solo entonces lo retira del plan de origen;
 *  - un traslado exige que AMBOS planes puedan guardarse; si
 *    alguno está bloqueado no se toca nada;
 *  - no crea persistencia nueva: usa el autosave existente y
 *    no declara el guardado como confirmado.
 */
function incorporarAvisoAPlan(vehiculoId, avisoId) {

    const planDestino =
        planificacionDia[vehiculoId];

    if (!planDestino) {

        alert(
            "No se ha encontrado la planificación del vehículo."
        );

        return {
            ok: false,
            motivo: "SIN_PLAN"
        };
    }

    if (!avisoId) {

        alert(
            "Selecciona un aviso."
        );

        return {
            ok: false,
            motivo: "SIN_AVISO"
        };
    }

    const aviso =
        encontrarAvisoPorId(avisoId);

    if (!aviso) {

        alert(
            "No se ha encontrado el aviso."
        );

        return {
            ok: false,
            motivo: "AVISO_INEXISTENTE"
        };
    }

    const idAviso =
        obtenerIdAviso(aviso);

    if (
        idAviso === null ||
        idAviso === undefined ||
        String(idAviso).trim() === ""
    ) {

        alert(
            "El aviso no tiene identificador."
        );

        return {
            ok: false,
            motivo: "AVISO_SIN_ID"
        };
    }


    /* --------------------------------------------------------
       Duplicado dentro del plan de destino
    -------------------------------------------------------- */

    const yaEnDestino =
        (planDestino.paradas || []).some(
            function(parada) {

                return (
                    String(parada.tipo).toUpperCase() === "AVISO" &&
                    String(
                        parada.avisoId ||
                        parada.id_aviso ||
                        parada.id
                    ) === String(idAviso)
                );
            }
        );

    if (yaEnDestino) {

        alert(
            "Este aviso ya está incluido en la ruta."
        );

        return {
            ok: false,
            motivo: "DUPLICADO"
        };
    }


    /* --------------------------------------------------------
       F4 · coordenadas obligatorias para una parada AVISO
    -------------------------------------------------------- */

    const coordenadas =
        resolverCoordenadasAvisoRutas(aviso);

    if (!coordenadas) {

        alert(
            "No se puede añadir el aviso: no tiene coordenadas " +
            "válidas y su punto de recogida tampoco.\n\n" +
            "Corrige la ubicación del aviso o añade el punto " +
            "correspondiente."
        );

        return {
            ok: false,
            motivo: "SIN_COORDENADAS"
        };
    }


    /* --------------------------------------------------------
       Traslado desde otro vehículo de la misma fecha
    -------------------------------------------------------- */

    const vehiculoOrigen =
        encontrarVehiculoConAvisoEnFechaSeleccionada(idAviso);

    const esTraslado =
        vehiculoOrigen !== null &&
        String(vehiculoOrigen) !== String(vehiculoId);

    if (esTraslado) {

        const planOrigen =
            planificacionDia[vehiculoOrigen];

        if (!planOrigen) {

            alert(
                "No se ha encontrado la planificación del " +
                "vehículo de origen."
            );

            return {
                ok: false,
                motivo: "SIN_PLAN_ORIGEN"
            };
        }

        const motivoOrigen =
            motivoBloqueoGuardado(planOrigen);

        const motivoDestino =
            motivoBloqueoGuardado(planDestino);

        if (motivoOrigen || motivoDestino) {

            alert(
                "No se ha trasladado el aviso: el cambio no se " +
                "podría guardar.\n\n" +
                (motivoOrigen || motivoDestino)
            );

            return {
                ok: false,
                motivo: "GUARDADO_BLOQUEADO"
            };
        }

        const nombreOrigen =
            obtenerNombreVehiculo(vehiculoOrigen);

        const nombreDestino =
            obtenerNombreVehiculo(vehiculoId);

        const confirmar =
            confirm(
                "El aviso ya está asignado a " + nombreOrigen + ".\n\n" +
                "¿Quieres moverlo a " + nombreDestino + "?"
            );

        if (!confirmar) {
            return {
                ok: false,
                motivo: "CANCELADO"
            };
        }
    }


    /* --------------------------------------------------------
       Alta (y retirada del origen) tras validar todo.
       Ambas mutaciones son síncronas: no hay await entre ellas.
    -------------------------------------------------------- */

    if (esTraslado) {

        quitarAvisoDePlanSinPerderAviso(
            idAviso,
            vehiculoOrigen
        );

        invalidarCalculosPlanificacion(
            planificacionDia[vehiculoOrigen]
        );
    }

    planDestino.paradas.push({
        id:
            `AVISO-${idAviso}`,
        avisoId:
            idAviso,
        tipo:
            "AVISO",
        nombre:
            obtenerPuntoAviso(aviso),
        especie:
            obtenerEspecieAviso(aviso),
        cantidad:
            obtenerCantidadAviso(aviso),
        lat:
            coordenadas.lat,
        lng:
            coordenadas.lng,
        municipio:
            obtenerMunicipioAviso(aviso),
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

    actualizarOrdenes(
        planDestino
    );

    marcarPlanificacionModificada(
        planDestino
    );

    invalidarCalculosPlanificacion(
        planDestino
    );


    /* --------------------------------------------------------
       F2 · efectos homogéneos en las dos vías
    -------------------------------------------------------- */

    cerrarMenusAnadirParada();

    renderizarAvisosPendientes();

    if (
        typeof renderizarAvisos ===
        "function"
    ) {
        renderizarAvisos();
    }

    if (
        typeof dibujarAvisos ===
        "function"
    ) {
        dibujarAvisos();
    }

    if (
        typeof actualizarRutaEnMapa ===
        "function"
    ) {
        actualizarRutaEnMapa(
            planDestino
        );
    }

    if (
        typeof dibujarRutas ===
        "function"
    ) {
        dibujarRutas();
    }

    recalcularYActualizarPlanificacionVehiculo(
        vehiculoId
    );

    if (esTraslado) {
        recalcularYActualizarPlanificacionVehiculo(
            vehiculoOrigen
        );
    }


    /* --------------------------------------------------------
       Honestidad de guardado: el autosave existente enviará
       cada plan. Si el destino está bloqueado se informa; el
       cambio queda pendiente y visible, nunca "guardado".
    -------------------------------------------------------- */

    const motivoDestinoFinal =
        motivoBloqueoGuardado(planDestino);

    if (motivoDestinoFinal) {

        establecerFeedbackGuardadoPlanificacion(
            vehiculoId,
            "error"
        );

        alert(
            "El aviso se ha incorporado, pero el cambio NO se ha " +
            "guardado:\n\n" +
            motivoDestinoFinal
        );
    }

    return {
        ok: true,
        traslado: esTraslado,
        vehiculoOrigen: esTraslado ? vehiculoOrigen : null
    };
}


/* ============================================================
   CARGA DE PLANIFICACIÓN
============================================================ */

function crearPlanVehiculo(
    vehiculo,
    vehiculoId,
    fecha
) {

    const tabletId =
        vehiculo.tablet_id ||
        vehiculo.tablet ||
        vehiculo.TABLET_ID ||
        "";


    const rutaHabitual =
        vehiculo.ruta_habitual_identificada ||
        vehiculo.rutaHabitual ||
        vehiculo.ruta_habitual ||
        vehiculo.ruta_id ||
        vehiculo.ruta ||
        vehiculo.RUTA_ID ||
        "";


    return {

        vehiculoId:
            vehiculoId,

        vehiculo:
            vehiculo,

        tabletId:
            tabletId,

        rutaHabitual:
            rutaHabitual,

        /*
         * BLOQUE 3 · la ruta diaria arranca ausente. La ruta
         * habitual es solo una referencia y no se copia aquí;
         * se rellena únicamente si el plan guardado la define
         * o si el usuario la selecciona explícitamente.
         */
        rutaActiva:
            "",

        horaSalida:
            vehiculo.hora_salida ||
            "08:00",

        paradas:
            [],

        fecha:
            fecha,

        modificado:
            false,

        /*
         * BLOQUE 6 · distingue una planificación realmente
         * guardada de un plan que solo existe en memoria porque
         * se reconstruyó desde avisos ASIGNADO/RECOGIDO.
         */
        tienePlanGuardado:
            false
    };
}


/**
 * BLOQUE 6 · clave fiable de una parada de tipo AVISO.
 *
 * Solo se usan identificadores explícitos del aviso. No se
 * emplean nombre, coordenadas, orden, posición del array ni el
 * campo genérico `id` (que puede ser sintético): si no hay
 * avisoId/id_aviso, no se puede deduplicar con garantías.
 */
function obtenerClaveAvisoParada(parada) {

    if (
        !parada ||
        String(
            parada.tipo || ""
        ).toUpperCase() !== "AVISO"
    ) {

        return null;
    }


    const candidatos = [
        parada.avisoId,
        parada.id_aviso
    ];


    for (
        let indice = 0;
        indice < candidatos.length;
        indice += 1
    ) {

        const valor =
            candidatos[indice];


        if (
            valor !== null &&
            valor !== undefined &&
            String(valor).trim() !== ""
        ) {

            return String(valor);
        }
    }


    return null;
}


/**
 * BLOQUE 6 · combina las paradas del plan guardado con las
 * paradas reconstruidas desde avisos.
 *
 * - Conserva el orden y el contenido del plan guardado.
 * - Añade al final solo los avisos reconstruidos que no estén
 *   ya representados por la misma clave de aviso.
 * - Nunca deduplica por nombre, coordenadas, orden o posición.
 */
function fusionarParadasGuardadasConReconstruidas(
    plan,
    paradasGuardadas
) {

    const guardadas =
        Array.isArray(paradasGuardadas)
            ? paradasGuardadas
            : [];


    const clavesGuardadas =
        new Set();


    guardadas.forEach(
        parada => {

            const clave =
                obtenerClaveAvisoParada(
                    parada
                );


            if (clave !== null) {

                clavesGuardadas.add(
                    clave
                );
            }
        }
    );


    const reconstruidas =
        (
            Array.isArray(plan && plan.paradas)
                ? plan.paradas
                : []
        ).filter(
            parada =>
                parada &&
                parada.reconstruidaDesdeAviso === true
        );


    const noRepresentadas =
        reconstruidas.filter(
            parada => {

                const clave =
                    obtenerClaveAvisoParada(
                        parada
                    );


                return (
                    clave === null ||
                    !clavesGuardadas.has(
                        clave
                    )
                );
            }
        );


    plan.paradas =
        guardadas.concat(
            noRepresentadas
        );


    return {
        guardadas: guardadas.length,
        reconstruidas: noRepresentadas.length
    };
}


/**
 * BLOQUE 6 · tras un guardado confirmado, las paradas
 * reconstruidas que formaban parte del snapshot ya están
 * persistidas. Se retira su marca solo si su clave de aviso
 * aparece en el payload; así una parada distinta no se
 * declara guardada por error.
 */
function confirmarParadasPersistidasEnPlan(
    plan,
    paradasPayload
) {

    if (!plan) {

        return;
    }


    const clavesPersistidas =
        new Set();


    (
        Array.isArray(paradasPayload)
            ? paradasPayload
            : []
    ).forEach(
        parada => {

            const clave =
                obtenerClaveAvisoParada(
                    parada
                );


            if (clave !== null) {

                clavesPersistidas.add(
                    clave
                );
            }
        }
    );


    (
        Array.isArray(plan.paradas)
            ? plan.paradas
            : []
    ).forEach(
        parada => {

            if (
                !parada ||
                parada.reconstruidaDesdeAviso !== true
            ) {

                return;
            }


            const clave =
                obtenerClaveAvisoParada(
                    parada
                );


            if (
                clave !== null &&
                clavesPersistidas.has(
                    clave
                )
            ) {

                delete parada.reconstruidaDesdeAviso;
            }
        }
    );


    plan.tienePlanGuardado =
        true;
}


function cargarPlanificacionDesdeDatos() {

    /*
     * FASE 3F.2.3 · §21: los temporizadores de retry/backoff y
     * sus contadores NO sobreviven a una reconstrucción de los
     * planes (un timer huérfano podría disparar sobre planes
     * recién creados). Solo se limpia el estado de RECUPERACIÓN
     * nuevo de esta fase: el resto de la recarga (debounces,
     * versiones) queda exactamente como en la auditoría 3F.2.3,
     * que dejó la recarga en caliente documentada como riesgo
     * bajo y fuera de alcance.
     */

    Object.keys(estadoRecuperacionAutosave).forEach(
        function(vehiculoId) {

            cancelarReintentoAutosave(vehiculoId);

            delete estadoRecuperacionAutosave[vehiculoId];
        }
    );


    /*
     * FASE 3F.6.6-B2 · fecha de pertenencia: se fija desde la
     * fecha efectiva del servidor y se reinicia el estado de
     * día y versiones. Esta función solo se invoca en carga
     * inicial o tras decisión explícita / recarga limpia.
     */

    const datosCarga =
        obtenerDatosAplicacion();


    establecerFechaServidor(
        datosCarga.FECHA_SERVIDOR !== undefined
            ? datosCarga.FECHA_SERVIDOR
            : datosCarga.fecha
    );

    pausaCambioDia = null;

    resolucionCambioDia = null;

    falloRecargaDia = null;

    cerrarDialogoCambioDia();

    Object.keys(estadoVersionesAutosave).forEach(
        function(vehiculoId) {

            delete estadoVersionesAutosave[vehiculoId];
        }
    );

    Object.keys(temporizadoresAutosave).forEach(
        function(vehiculoId) {

            cancelarDebounceAutosave(vehiculoId);
        }
    );

    colaAutosave = [];


    planificacionDia =
        {};


    const vehiculos =
        obtenerVehiculosDisponibles();


    /*
     * BLOQUE 2 · mapa de TODOS los vehículos (también inactivos
     * o desconocidos). No crea planes por sí mismo: solo permite
     * reconstruir un plan guardado cuyo vehículo ya no está
     * confirmado como activo.
     */
    const vehiculosPorId =
        {};


    (
        Array.isArray(datosCarga.VEHICULOS)
            ? datosCarga.VEHICULOS
            : []
    ).forEach(
        vehiculo => {

            const id =
                obtenerIdVehiculo(
                    vehiculo
                );


            if (
                id !== null &&
                id !== undefined
            ) {

                vehiculosPorId[
                    String(id)
                ] = vehiculo;
            }
        }
    );


    vehiculos.forEach(
        vehiculo => {

            const vehiculoId =
                obtenerIdVehiculo(
                    vehiculo
                );


            if (!vehiculoId) {
                return;
            }


            planificacionDia[
                vehiculoId
            ] = crearPlanVehiculo(
                vehiculo,
                vehiculoId,
                fechaServidor
            );
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


            let plan =
                planificacionDia[
                    vehiculoId
                ];


            /*
             * BLOQUE 2 · un aviso ya asignado a un vehículo
             * inactivo o desconocido se conserva: se reconstruye
             * su plan solo para no perder la parada existente.
             * No se crean planes vacíos por esta vía.
             */
            if (!plan) {

                const vehiculo =
                    vehiculosPorId[
                        String(
                            vehiculoId
                        )
                    ];


                if (!vehiculo) {
                    return;
                }


                plan =
                    crearPlanVehiculo(
                        vehiculo,
                        vehiculoId,
                        fechaServidor
                    );


                planificacionDia[
                    vehiculoId
                ] = plan;
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
                    "AVISO",

                /*
                 * BLOQUE 6 · esta parada no viene de una
                 * planificación guardada: se reconstruye desde
                 * el estado del aviso. La interfaz debe poder
                 * distinguirla.
                 */
                reconstruidaDesdeAviso:
                    true
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
         * Puede llegar como ARRAY indexado por vehiculo_id
         * (formato actual de los datos) o como objeto indexado
         * directamente por vehiculoId (formato anterior).
         */

        const entradasPlanificacion = [];


        if (Array.isArray(planificacionGuardada)) {

            planificacionGuardada.forEach(
                guardada => {

                    if (!guardada) {
                        return;
                    }

                    const vehiculoId =
                        guardada.vehiculo_id ||
                        guardada.vehiculoId ||
                        null;

                    if (!vehiculoId) {
                        return;
                    }

                    entradasPlanificacion.push([
                        vehiculoId,
                        guardada
                    ]);
                }
            );

        } else {

            Object.keys(
                planificacionGuardada
            ).forEach(
                vehiculoId => {

                    entradasPlanificacion.push([
                        vehiculoId,
                        planificacionGuardada[
                            vehiculoId
                        ]
                    ]);
                }
            );
        }


        entradasPlanificacion.forEach(
            entrada => {

                const vehiculoId = entrada[0];
                const guardada = entrada[1];


                if (!guardada) {
                    return;
                }


                let plan =
                    planificacionDia[
                        vehiculoId
                    ];


                /*
                 * BLOQUE 2 · un plan YA GUARDADO no se descarta
                 * porque su vehículo esté inactivo o tenga
                 * actividad desconocida. Solo en ese caso se
                 * reconstruye la base del plan; nunca se crea un
                 * plan vacío para un vehículo no confirmado.
                 */
                if (!plan) {

                    const vehiculo =
                        vehiculosPorId[
                            String(
                                vehiculoId
                            )
                        ];


                    if (!vehiculo) {
                        return;
                    }


                    plan =
                        crearPlanVehiculo(
                            vehiculo,
                            vehiculoId,
                            fechaServidor
                        );


                    planificacionDia[
                        vehiculoId
                    ] = plan;
                }


                if (
                    Array.isArray(
                        guardada.paradas
                    )
                ) {

                    /*
                     * BLOQUE 6 · el plan guardado y los avisos
                     * reconstruidos son fuentes distintas: el
                     * plan guardado no debe hacer desaparecer
                     * avisos asignados/recogidos que aún no
                     * figuren en él. Se conserva el orden del
                     * plan y se añaden solo los avisos cuya
                     * clave real no esté ya representada.
                     */
                    fusionarParadasGuardadasConReconstruidas(
                        plan,
                        guardada.paradas
                    );


                    plan.tienePlanGuardado =
                        guardada.paradas.length > 0;
                }


                const rutaActiva =
                    guardada.rutaActiva ||
                    guardada.ruta_activa ||
                    guardada.ruta_id;


                if (rutaActiva) {

                    plan.rutaActiva =
                        rutaActiva;
                }


                const horaSalida =
                    guardada.horaSalida ||
                    guardada.hora_salida;


                if (horaSalida) {

                    plan.horaSalida =
                        horaSalida;
                }


                /*
                 * FASE C · Los valores almacenados de regreso
                 * (horaRegreso, hora_regreso, horaEstimadaRegreso)
                 * se ignoran intencionadamente: ya no existe hora
                 * manual de regreso. La hora estimada la calcula
                 * el recálculo en plan.horaRegresoEstimada.
                 */
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


    /*
     * La planificación cargada es la referencia de asignación:
     * se redibujan los marcadores para reflejar avisos que solo
     * constan en el plan y no en el estado de la hoja AVISOS.
     */
    if (
        typeof dibujarAvisos ===
        "function"
    ) {

        dibujarAvisos();
    }
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


    /*
     * BLOQUE 2 · solo activos confirmados. No se interpretan
     * 1/0 ni valores ausentes como activos: un vehículo
     * desconocido queda fuera de la creación de planes nuevos
     * y de los selectores de asignación.
     */
    return vehiculos.filter(
        vehiculo => {

            if (
                typeof clasificarActividadVehiculo !==
                "function"
            ) {

                return false;
            }


            const valorActividad =
                vehiculo.actividad !== undefined
                    ? vehiculo.actividad
                    : vehiculo.activo !== undefined
                        ? vehiculo.activo
                        : vehiculo.ACTIVO;


            return (
                clasificarActividadVehiculo(
                    valorActividad
                ) === "ACTIVO"
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


function obtenerIdRutaCatalogo(
    ruta
) {

    if (
        !ruta ||
        typeof ruta !== "object"
    ) {

        return "";
    }


    const id =
        ruta.id_ruta ||
        ruta.ruta_id ||
        ruta.id ||
        ruta.RUTA_ID;


    return (
        id === null ||
        id === undefined
    )
        ? ""
        : String(id);
}


function buscarRutaEnCatalogo(
    rutaId
) {

    if (
        rutaId === null ||
        rutaId === undefined ||
        String(rutaId) === ""
    ) {

        return null;
    }


    return (
        obtenerRutasDisponibles()
            .find(
                ruta => {

                    return (
                        obtenerIdRutaCatalogo(
                            ruta
                        ) ===
                        String(rutaId)
                    );
                }
            ) ||
        null
    );
}


/*
 * BLOQUE 4 · estado de la ruta del plan.
 *
 * Un catálogo vacío se considera "todavía no disponible":
 * no se concluye que una ruta guardada sea inválida.
 */
function obtenerEstadoRutaPlan(
    rutaId
) {

    if (
        rutaId === null ||
        rutaId === undefined ||
        String(rutaId) === ""
    ) {

        return "SIN_RUTA";
    }


    if (
        !obtenerRutasDisponibles().length
    ) {

        return "CATALOGO_NO_CARGADO";
    }


    return buscarRutaEnCatalogo(
        rutaId
    )
        ? "VALIDA"
        : "NO_DISPONIBLE";
}


function obtenerTextoRutaPlan(
    rutaId
) {

    const estado =
        obtenerEstadoRutaPlan(
            rutaId
        );


    if (
        estado === "SIN_RUTA"
    ) {

        return "Sin ruta";
    }


    if (
        estado === "NO_DISPONIBLE"
    ) {

        return (
            "Ruta no disponible (" +
            String(rutaId) +
            ")"
        );
    }


    if (
        estado === "CATALOGO_NO_CARGADO"
    ) {

        return (
            "Ruta " +
            String(rutaId) +
            " (catálogo no disponible)"
        );
    }


    return obtenerNombreRuta(
        rutaId
    );
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


    /* ============================================================
       FASE 2 · CASILLA INDIVIDUAL POR RUTA

       La fuente de verdad de la visibilidad es el `checked` de
       cada casilla. Si una casilla ya existía desmarcada, se
       respeta al volver a pintar la leyenda (no se vuelve a
       marcar sola). La primera vez arrancan todas marcadas.

       Estado actual (Fase 3): cada casilla genera su listener
       `change`, que llama a `dibujarRutas()`; y `dibujarRutas()`
       filtra las rutas según el `checked` de cada checkbox. Por
       tanto, marcar o desmarcar una casilla ya oculta o muestra
       su ruta en el mapa.
    ============================================================ */

    const casillasPrevias = {};


    rutas.forEach(
        ruta => {

            const idPrevia =
                ruta.id_ruta ||
                ruta.ruta_id ||
                ruta.id ||
                ruta.RUTA_ID;


            const clavePrevia =
                "capa-ruta-" +
                String(
                    idPrevia
                ).toUpperCase();


            const elementoPrevio =
                document.getElementById(
                    clavePrevia
                );


            if (elementoPrevio) {

                casillasPrevias[clavePrevia] =
                    elementoPrevio.checked;
            }
        }
    );


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


                    const idCasilla =
                        "capa-ruta-" +
                        String(
                            id
                        ).toUpperCase();


                    const marcada =
                        casillasPrevias[idCasilla] !==
                        false;


                    return `

                        <label
                            class="item-leyenda-ruta"
                            for="${escaparHTML(
                                idCasilla
                            )}"
                        >

                            <input
                                type="checkbox"
                                id="${escaparHTML(
                                    idCasilla
                                )}"
                                name="${escaparHTML(
                                    idCasilla
                                )}"
                                ${marcada ? "checked" : ""}
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

                        </label>

                    `;
                }
            )
            .join("");
    /* ============================================================
       FASE 3 · VISIBILIDAD INDIVIDUAL DE RUTAS

       Cada casilla controla directamente la visibilidad de su
       ruta. Al cambiar una casilla se redibuja el conjunto de
       rutas respetando los estados checked.
    ============================================================ */

    rutas.forEach(
        ruta => {

            const id =
                ruta.id_ruta ||
                ruta.ruta_id ||
                ruta.id ||
                ruta.RUTA_ID;


            const idCasilla =
                "capa-ruta-" +
                String(
                    id
                ).toUpperCase();


            const casilla =
                document.getElementById(
                    idCasilla
                );


            if (!casilla) {
                return;
            }


            casilla.addEventListener(
                "change",
                function () {

                    if (
                        typeof dibujarRutas ===
                        "function"
                    ) {
                        dibujarRutas();
                    }

                }
            );
        }
    );
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
   CÁLCULO DE RUTAS REALES CON OSRM
============================================================ */

async function calcularRutasRealesVehiculo(
    vehiculoId,
    versionLocal
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];

    if (!plan) {
        return null;
    }

    const paradas =
        plan.paradas || [];

    const origenCRF = {
        lat: 39.341839,
        lng: -0.320019
    };

    const tramos = [];

    let estadoGeneral = "OK";

    const puntos =
        [
            origenCRF,
            ...paradas.map(
                parada => ({
                    lat: obtenerLat(
                        parada
                    ),
                    lng: obtenerLng(
                        parada
                    )
                })
            ),
            origenCRF
        ];

    for (let i = 0; i < puntos.length - 1; i++) {

        const origen = puntos[i];
        const destino = puntos[i + 1];

        const tramo = {
            origen: {
                lat: origen.lat,
                lng: origen.lng
            },
            destino: {
                lat: destino.lat,
                lng: destino.lng
            },
            estado: "OK",
            distanciaMetros: null,
            duracionSegundos: null
        };

        try {

            const resultado = await obtenerRutaOSRM(
                origen,
                destino
            );

            tramo.distanciaMetros =
                Number(
                    resultado.distanciaMetros
                );

            tramo.duracionSegundos =
                Number(
                    resultado.duracionSegundos
                );

        } catch (error) {

            tramo.estado = "ERROR";
            tramo.error =
                error && error.message
                    ? error.message
                    : "Error calculando tramo OSRM.";

            estadoGeneral = "ERROR_PARCIAL";

            console.warn(
                "OSRM: fallo en tramo",
                i,
                error
            );
        }

        tramos.push(tramo);
    }

    /*
     * FASE B · Si durante los tramos OSRM empezó un recálculo
     * más reciente, esta respuesta es antigua: termina sin
     * escribir en planificacionDia.
     */
    if (
        !versionVigente(
            vehiculoId,
            versionLocal
        )
    ) {
        return {
            estado: "DESCARTADO",
            descartado: true,
            tramos: tramos
        };
    }


    plan.calculosRuta = {
        estado: estadoGeneral,
        origenCRF: {
            lat: origenCRF.lat,
            lng: origenCRF.lng
        },
        tramos: tramos
    };

    return plan.calculosRuta;
}

if (typeof window !== "undefined") {
    window.calcularRutasRealesVehiculo = calcularRutasRealesVehiculo;
}

if (typeof globalThis !== "undefined") {
    globalThis.calcularRutasRealesVehiculo = calcularRutasRealesVehiculo;
}


/* ============================================================
   CÁLCULO DE HORARIOS INTERNOS DE PLANIFICACIÓN
============================================================ */

function calcularTiemposPlanificacionVehiculo(
    vehiculoId,
    versionLocal
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];

    if (!plan) {
        return null;
    }

    const tramos =
        plan.calculosRuta &&
        Array.isArray(
            plan.calculosRuta.tramos
        )
            ? plan.calculosRuta.tramos
            : [];

    const paradas =
        Array.isArray(
            plan.paradas
        )
            ? plan.paradas
            : [];

    const duracionRecogidaSegundos = 420;

    function parseHoraHHMM(
        valor
    ) {

        if (
            typeof valor !== "string" ||
            !valor.includes(":")
        ) {
            return 0;
        }

        const partes =
            valor.split(":");

        const horas =
            Number(partes[0]) || 0;

        const minutos =
            Number(partes[1]) || 0;

        return (
            horas * 3600 +
            minutos * 60
        );
    }

    function formatearHoraHHMM(
        segundos
    ) {

        const total =
            Math.max(
                0,
                Math.round(
                    segundos
                )
            );

        const horas =
            String(
                Math.floor(
                    total / 3600
                )
            ).padStart(2, "0");

        const minutos =
            String(
                Math.floor(
                    (total % 3600) / 60
                )
            ).padStart(2, "0");

        return horas + ":" + minutos;
    }

    if (
        !plan.calculosRuta ||
        plan.calculosRuta.estado !== "OK" ||
        tramos.length !== paradas.length + 1
    ) {

        const error =
            "OSRM no disponible para calcular horarios internos de la planificación.";

        console.warn(
            error,
            {
                vehiculoId:
                    vehiculoId,
                tramos:
                    tramos.length,
                paradas:
                    paradas.length
            }
        );

        plan.calculosTemporales = {
            estado: "ERROR",
            error: error,
            paradas: [],
            tiempoTotalConduccionSegundos: 0,
            tiempoTotalRecogidasSegundos: 0,
            tiempoTotalEstimadoSegundos: 0,
            horaRegresoEstimada: null
        };

        return plan.calculosTemporales;
    }

    const hayTramoError =
        tramos.some(
            tramo =>
                !tramo ||
                tramo.estado !== "OK"
        );

    if (hayTramoError) {

        const error =
            "Hay tramos de OSRM con estado no válido para calcular horarios internos.";

        console.warn(
            error,
            {
                vehiculoId:
                    vehiculoId,
                tramos: tramos
            }
        );

        plan.calculosTemporales = {
            estado: "ERROR",
            error: error,
            paradas: [],
            tiempoTotalConduccionSegundos: 0,
            tiempoTotalRecogidasSegundos: 0,
            tiempoTotalEstimadoSegundos: 0,
            horaRegresoEstimada: null
        };

        return plan.calculosTemporales;
    }

    const horaSalidaSegundos =
        parseHoraHHMM(
            plan.horaSalida
        );

    let tiempoConduccionAcumulado = 0;
    let tiempoRecogidasAcumulado = 0;
    let horaActualSegundos =
        horaSalidaSegundos;

    const calculosParadas = [];

    for (let i = 0; i < paradas.length; i++) {

        const tramoActual =
            tramos[i];

        const tramoDuracion =
            Number(
                tramoActual &&
                tramoActual.duracionSegundos
            ) || 0;

        const tramoDistancia =
            Number(
                tramoActual &&
                tramoActual.distanciaMetros
            ) || 0;

        const horaLlegadaSegundos =
            horaActualSegundos +
            tramoDuracion;

        const horaSalidaParadaSegundos =
            horaLlegadaSegundos +
            duracionRecogidaSegundos;

        calculosParadas.push({
            paradaId:
                paradas[i].id ||
                paradas[i].avisoId ||
                paradas[i].puntoId ||
                String(i + 1),
            horaLlegada:
                formatearHoraHHMM(
                    horaLlegadaSegundos
                ),
            horaSalida:
                formatearHoraHHMM(
                    horaSalidaParadaSegundos
                ),
            duracionRecogidaSegundos:
                duracionRecogidaSegundos,
            duracionConduccionHastaParadaSegundos:
                tramoDuracion +
                tiempoConduccionAcumulado,
            distanciaHastaParadaMetros:
                tramoDistancia +
                (i === 0 ? 0 : calculosParadas[i - 1].distanciaHastaParadaMetros)
        });

        tiempoConduccionAcumulado +=
            tramoDuracion;

        tiempoRecogidasAcumulado +=
            duracionRecogidaSegundos;

        horaActualSegundos =
            horaSalidaParadaSegundos;
    }

    const ultimoTramo =
        tramos[paradas.length];

    const duracionRegreso =
        ultimoTramo &&
        Number(
            ultimoTramo.duracionSegundos
        )
            ? Number(
                ultimoTramo.duracionSegundos
            )
            : 0;

    const tiempoTotalConduccionSegundos =
        tramos.reduce(
            (total, tramo) => {
                if (
                    !tramo ||
                    !Number.isFinite(
                        Number(
                            tramo.duracionSegundos
                        )
                    )
                ) {
                    return total;
                }

                return total + Number(tramo.duracionSegundos);
            },
            0
        );

    const tiempoTotalRecogidasSegundos =
        paradas.length *
        duracionRecogidaSegundos;

    const tiempoTotalEstimadoSegundos =
        tiempoTotalConduccionSegundos +
        tiempoTotalRecogidasSegundos;

    const horaRegresoEstimadaSegundos =
        horaSalidaSegundos +
        tiempoTotalEstimadoSegundos;

    /*
     * FASE B · Si empezó un recálculo más reciente mientras se
     * calculaba la ruta, estos tiempos son antiguos: no se
     * escriben en planificacionDia.
     */
    if (
        !versionVigente(
            vehiculoId,
            versionLocal
        )
    ) {
        return {
            estado: "DESCARTADO",
            descartado: true,
            paradas: [],
            tiempoTotalConduccionSegundos: 0,
            tiempoTotalRecogidasSegundos: 0,
            tiempoTotalEstimadoSegundos: 0,
            horaRegresoEstimada: null
        };
    }


    plan.calculosTemporales = {
        estado: "OK",
        paradas: calculosParadas,
        tiempoTotalConduccionSegundos:
            tiempoTotalConduccionSegundos,
        tiempoTotalRecogidasSegundos:
            tiempoTotalRecogidasSegundos,
        tiempoTotalEstimadoSegundos:
            tiempoTotalEstimadoSegundos,
        horaRegresoEstimada:
            formatearHoraHHMM(
                horaRegresoEstimadaSegundos
            )
    };

    plan.horaRegresoEstimada =
        plan.calculosTemporales.horaRegresoEstimada;

    return plan.calculosTemporales;
}

if (typeof window !== "undefined") {
    window.calcularTiemposPlanificacionVehiculo = calcularTiemposPlanificacionVehiculo;
}

if (typeof globalThis !== "undefined") {
    globalThis.calcularTiemposPlanificacionVehiculo = calcularTiemposPlanificacionVehiculo;
}


/* ============================================================
   COORDINACIÓN DE FASES DE CÁLCULO
============================================================ */

async function recalcularPlanificacionVehiculo(
    vehiculoId,
    versionLocal
) {

    try {

        const resultadoRuta =
            await calcularRutasRealesVehiculo(
                vehiculoId,
                versionLocal
            );


        if (
            resultadoRuta &&
            resultadoRuta.descartado === true
        ) {
            return resultadoRuta;
        }


        if (
            !resultadoRuta ||
            resultadoRuta.estado !== "OK"
        ) {
            return {
                estado: "ERROR",
                error:
                    "La fase OSRM no está OK. No se calculan tiempos temporales.",
                osrm: resultadoRuta || null
            };
        }

        const resultadoTemporal =
            calcularTiemposPlanificacionVehiculo(
                vehiculoId,
                versionLocal
            );

        return resultadoTemporal;

    } catch (error) {

        return {
            estado: "ERROR",
            error:
                error && error.message
                    ? error.message
                    : "Error al recalcular la planificación del vehículo."
        };
    }
}

if (typeof window !== "undefined") {
    window.recalcularPlanificacionVehiculo = recalcularPlanificacionVehiculo;
}

if (typeof globalThis !== "undefined") {
    globalThis.recalcularPlanificacionVehiculo = recalcularPlanificacionVehiculo;
}

/* ============================================================
   RECALCULAR Y ACTUALIZAR PLANIFICACIÓN
============================================================ */

async function recalcularYActualizarPlanificacionVehiculo(
    vehiculoId
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];

    if (!plan) {
        return {
            estado: "ERROR",
            error:
                `No existe planificación para el vehículo ${vehiculoId}.`
        };
    }


    /*
     * FASE B · Cada recálculo abre una versión nueva para el
     * vehículo. Solo la versión vigente puede aplicar resultados;
     * las respuestas antiguas se descartan sin escribir.
     */
    versionesRecalculoPlanificacion[
        vehiculoId
    ] =
        (
            versionesRecalculoPlanificacion[
                vehiculoId
            ] || 0
        ) + 1;

    const versionLocal =
        versionesRecalculoPlanificacion[
            vehiculoId
        ];


    try {

        const resultado =
            await recalcularPlanificacionVehiculo(
                vehiculoId,
                versionLocal
            );

        if (
            resultado &&
            resultado.estado === "ERROR"
        ) {
            return resultado;
        }


        if (
            resultado &&
            resultado.descartado === true
        ) {
            return resultado;
        }

        if (
            typeof renderizarPlanificacion ===
            "function"
        ) {
            renderizarPlanificacion();
        }

        if (
            typeof dibujarRutas ===
            "function"
        ) {
            dibujarRutas();
        }

        return resultado;

    } catch (error) {

        return {
            estado: "ERROR",
            error:
                error && error.message
                    ? error.message
                    : "Error al recalcular y actualizar la planificación del vehículo."
        };
    }
}

if (typeof window !== "undefined") {
    window.recalcularYActualizarPlanificacionVehiculo =
        recalcularYActualizarPlanificacionVehiculo;
}

if (typeof globalThis !== "undefined") {
    globalThis.recalcularYActualizarPlanificacionVehiculo =
        recalcularYActualizarPlanificacionVehiculo;
}
/* ============================================================
   RESUMEN
============================================================ */

function actualizarResumenPlanificacion() {

    const contenedor =
        document.getElementById(
            "resumen-planificacion-dia"
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


    /*
     * FASE 3F.6.6-B2 · aviso de pausa o fecha desconocida. Es
     * un hermano del contenedor: sobrevive a los innerHTML.
     */
    actualizarBannerCambioDia(contenedor);


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

        ${crearAvisoErrorGuardadoPlanificacion()}

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


                            /*
                             * FASE 3F.2.4 · I3: "guardando…" representa
                             * EXCLUSIVAMENTE un POST en vuelo de ESTE
                             * vehículo (guardandoPlanificacion + carril
                             * asignado a su id). Durante un backoff /
                             * espera de reintento no hay POST activo →
                             * el vehículo sigue como "cambios pendientes".
                             */

                            const enVuelo =
                                guardandoPlanificacion ===
                                    true &&
                                String(
                                    vehiculoGuardandoPlanificacion
                                ) ===
                                String(
                                    plan.vehiculoId
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

                                    <span
                                        class="
                                            badge-estado-plan
                                            ${
                                                enVuelo
                                                    ? "guardando"
                                                    : plan.modificado ===
                                                        true
                                                        ? "pendiente"
                                                        : "guardado"
                                            }
                                        "
                                    >
                                        ${
                                            enVuelo
                                                ? "guardando…"
                                                : plan.modificado ===
                                                    true
                                                    ? "cambios pendientes"
                                                    : "guardado"
                                        }
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
   FORMATO DE DURACIONES · HORARIO PREVISTO
============================================================ */

/*
 * Convierte segundos en texto legible. Solo presentación:
 * no recalcula nada, solo formatea valores ya calculados.
 * 45 -> "45 s" · 2400 -> "40 min" · 3660 -> "1 h 01 min".
 */
function formatearDuracionLegible(
    segundos
) {

    var total =
        Math.max(
            0,
            Math.round(
                Number(segundos) || 0
            )
        );


    if (total < 60) {
        return total + " s";
    }


    var minutosTotales =
        Math.round(total / 60);


    if (minutosTotales < 60) {
        return minutosTotales + " min";
    }


    var horas =
        Math.floor(minutosTotales / 60);

    var minutos =
        String(minutosTotales % 60).padStart(2, "0");


    return horas + " h " + minutos + " min";
}


/* ============================================================
   DETALLE DEL VEHÍCULO SELECCIONADO
============================================================ */

function contarParadasReconstruidasDesdeAvisos(
    plan
) {

    return (
        Array.isArray(plan && plan.paradas)
            ? plan.paradas
            : []
    ).filter(
        parada =>
            parada &&
            parada.reconstruidaDesdeAviso === true
    ).length;
}


/**
 * BLOQUE 6 · aviso de coherencia del plan.
 *
 * No afirma que un plan eliminado se haya recuperado: si no
 * hay planificación persistida, explica que las paradas
 * proceden de avisos ASIGNADO/RECOGIDO.
 */
function crearAvisoCoherenciaPlan(
    plan
) {

    const total =
        contarParadasReconstruidasDesdeAvisos(
            plan
        );


    if (total === 0) {

        return "";
    }


    const singular =
        total === 1;


    let texto = "";


    if (
        plan &&
        plan.tienePlanGuardado === true
    ) {

        texto =
            singular
                ? "Este plan incluye 1 parada reconstruida desde avisos que no figuraba en el plan guardado."
                : "Este plan incluye " + total +
                  " paradas reconstruidas desde avisos que no figuraban en el plan guardado.";

    } else {

        texto =
            singular
                ? "No hay planificación guardada para este vehículo y fecha. La parada mostrada procede de un aviso asignado o recogido; no es un plan recuperado."
                : "No hay planificación guardada para este vehículo y fecha. Las " + total +
                  " paradas mostradas proceden de avisos asignados o recogidos; no son un plan recuperado.";
    }


    return `

        <div
            style="
                margin:0 0 12px;
                padding:10px 12px;
                border-left:4px solid #b26a00;
                background:#fff4e0;
                color:#5a3a00;
                border-radius:6px;
                font-size:13px;
                line-height:1.45;
            "
        >
            <strong>
                Origen de las paradas
            </strong>

            <br />

            ${escaparHTML(texto)}
        </div>
    `;
}


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


    /*
     * BLOQUE 4 · la ruta diaria se muestra con su estado real:
     * sin ruta, válida, no disponible en el catálogo o catálogo
     * todavía no cargado. No se sustituye por otra ruta.
     */
    const rutaActiva =
        obtenerTextoRutaPlan(
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


    /*
     * FASE C · Texto de "Regreso estimado" (solo lectura).
     * Única fuente: plan.horaRegresoEstimada (calculada).
     * Nunca se muestra una hora manual antigua.
     */

    const horaRegresoEstimadaTexto =
        typeof plan.horaRegresoEstimada ===
            "string" &&
        plan.horaRegresoEstimada.indexOf(":") >=
            0
            ? plan.horaRegresoEstimada
            : null;


    const hayErrorCalculo =
        (
            plan.calculosRuta &&
            plan.calculosRuta.estado !== "OK"
        ) ||
        (
            plan.calculosTemporales &&
            plan.calculosTemporales.estado ===
                "ERROR"
        );


    const textoRegresoEstimado =
        horaRegresoEstimadaTexto ||
        (
            hayErrorCalculo
                ? "No disponible"
                : "Pendiente de cálculo"
        );


    /*
     * Textos de Conducción / Recogidas / Tiempo total.
     * Única fuente: plan.calculosTemporales (calculado).
     * Sin cálculo válido se muestra el mismo estado neutro
     * que en Regreso estimado.
     */

    const tiemposValidos =
        plan.calculosTemporales &&
        plan.calculosTemporales.estado ===
            "OK";


    const textoSinCalculo =
        hayErrorCalculo
            ? "No disponible"
            : "Pendiente de cálculo";


    const textoConduccion =
        tiemposValidos
            ? formatearDuracionLegible(
                plan.calculosTemporales
                    .tiempoTotalConduccionSegundos
            )
            : textoSinCalculo;


    const textoRecogidas =
        tiemposValidos
            ? formatearDuracionLegible(
                plan.calculosTemporales
                    .tiempoTotalRecogidasSegundos
            )
            : textoSinCalculo;


    const textoTotal =
        tiemposValidos
            ? formatearDuracionLegible(
                plan.calculosTemporales
                    .tiempoTotalEstimadoSegundos
            )
            : textoSinCalculo;


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


                    ${crearAvisoCoherenciaPlan(plan)}


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

                                <label>
                                    Conducción
                                </label>


                                <span>
                                    ${escaparHTML(
                                        textoConduccion
                                    )}
                                </span>

                            </div>


                            <div
                                class="campo-hora-plan"
                            >

                                <label>
                                    Recogidas
                                </label>


                                <span>
                                    ${escaparHTML(
                                        textoRecogidas
                                    )}
                                </span>

                            </div>


                            <div
                                class="campo-hora-plan"
                            >

                                <label>
                                    Tiempo total
                                </label>


                                <span>
                                    ${escaparHTML(
                                        textoTotal
                                    )}
                                </span>

                            </div>


                            <div
                                class="campo-hora-plan"
                            >

                                <label>
                                    Regreso estimado
                                </label>


                                <span>
                                    ${escaparHTML(
                                        textoRegresoEstimado
                                    )}
                                </span>

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


                        ${
                            crearBotonGuardarPlanificacion(
                                plan
                            )
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


    const seleccionada =
        rutaSeleccionada === null ||
        rutaSeleccionada === undefined
            ? ""
            : String(
                rutaSeleccionada
            );


    const opciones =
        [];


    /*
     * BLOQUE 4 · opción explícita para un plan sin ruta.
     * No asigna ni modifica nada por sí sola.
     */
    opciones.push(`

        <option
            value=""
            ${seleccionada === "" ? " selected" : ""}
        >
            Sin ruta
        </option>

    `);


    const idsCatalogo =
        {};


    rutas.forEach(
        ruta => {

            const id =
                obtenerIdRutaCatalogo(
                    ruta
                );


            if (id === "") {

                return;
            }


            idsCatalogo[id] =
                true;


            const nombre =
                ruta.nombre ||
                ruta.nombre_ruta ||
                ruta.descripcion ||
                obtenerNombreRuta(
                    id
                );


            const selected =
                id === seleccionada
                    ? " selected"
                    : "";


            opciones.push(`

                <option
                    value="${escaparHTML(
                        id
                    )}"
                    ${selected}
                >
                    ${escaparHTML(
                        String(
                            nombre
                        )
                    )}
                </option>

            `);
        }
    );


    /*
     * Una ruta guardada que no está en el catálogo se conserva
     * como opción de estado, nunca se sustituye por otra.
     *
     * Si el catálogo está vacío no se afirma que sea inválida:
     * puede no haberse cargado todavía.
     */
    if (
        seleccionada !== "" &&
        !Object.prototype.hasOwnProperty.call(
            idsCatalogo,
            seleccionada
        )
    ) {

        const esCatalogoVacio =
            rutas.length === 0;


        const etiqueta =
            esCatalogoVacio
                ? "Ruta " +
                  seleccionada +
                  " (catálogo no disponible)"
                : "Ruta no disponible (" +
                  seleccionada +
                  ")";


        opciones.push(`

            <option
                value="${escaparHTML(
                    seleccionada
                )}"
                selected
            >
                ${escaparHTML(
                    etiqueta
                )}
            </option>

        `);
    }


    return opciones.join("");
}



/* ============================================================
   MENÚ AÑADIR PARADA
============================================================ */

function mostrarMenuAnadirParada(
    vehiculoId
) {

    const menu =
        document.getElementById(
            `menu-anadir-parada-${vehiculoId}`
        );

    if (!menu) {
        return;
    }

    const estaOculto =
        menu.classList.contains(
            "oculto"
        );

    cerrarMenusAnadirParada();

    if (estaOculto) {
        menu.classList.remove(
            "oculto"
        );
    }
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
   PARADA DESDE MAPA
============================================================ */

function crearParadaDesdeMapa(
    vehiculoId,
    lat,
    lng
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (!plan) {

        alert(
            `No existe planificación para el vehículo ${vehiculoId}.`
        );

        return false;
    }


    /* coordenadasValidas() ya rechaza null, undefined, NaN,
       vacíos y valores fuera de rango. */

    if (
        !coordenadasValidas(
            lat,
            lng
        )
    ) {

        alert(
            "Las coordenadas del punto seleccionado no son válidas."
        );

        return false;
    }


    const latitud =
        Number(lat);


    const longitud =
        Number(lng);


    plan.paradas.push({
        id:
            `MAPA-${latitud.toFixed(5)}-${longitud.toFixed(5)}`,
        tipo: "MAPA",
        origen: "MAPA",
        nombre:
            `Punto en mapa · ${latitud.toFixed(5)}, ${longitud.toFixed(5)}`,
        lat: latitud,
        lng: longitud,
        estado: "PLANIFICADO"
    });


    actualizarOrdenes(
        plan
    );

    marcarPlanificacionModificada(
        plan
    );

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


    /* El recálculo puede fallar si OSRM no está disponible;
       la parada ya está creada, ordenada y renderizada. */

    recalcularYActualizarPlanificacionVehiculo(
        vehiculoId
    );


    return true;
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
    AVISO · F1: lógica única compartida con el panel
 -------------------------------------------------------- */
 if (
     String(
         tipo
     ).toUpperCase() ===
     "AVISO"
 ) {
     incorporarAvisoAPlan(
         vehiculoId,
         elementoId
     );
     return;
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
 
 // NUEVA LLAMADA A RECALCULO AUTOMÁTICO
 recalcularYActualizarPlanificacionVehiculo(vehiculoId);
}


/* ============================================================
   INFORMACIÓN DE LA FICHA DE PARADA
============================================================ */

/**
 * Determina el título y la información secundaria que debe
 * mostrar la ficha de una parada en "RUTA PROPUESTA".
 *
 * Función pura: solo consulta la propia parada y los catálogos
 * existentes. Nunca modifica datos ni inventa información
 * ambigua.
 *
 * Reglas:
 *  - MAPA:  secundaria fija "Punto creado en mapa".
 *  - PUNTO: "Punto habitual · municipio", usando el municipio
 *           de la parada o recuperándolo de forma segura por
 *           puntoId (nunca por nombre).
 *  - AVISO: especie/cantidad propias de la parada; si faltan,
 *           se recupera el aviso por avisoId/id_aviso. Solo
 *           cuando la parada NO lleva avisoId se localiza el
 *           aviso por nombre, con coincidencia exacta y única.
 *
 * @param {Object} parada
 * @returns {{titulo: string, secundaria: string}}
 */
function obtenerInfoParada(parada) {

    if (!parada) {
        return {
            titulo: "Parada sin nombre",
            secundaria: ""
        };
    }


    const tipo =
        String(
            parada.tipo ||
            ""
        ).toUpperCase();


    const titulo =
        parada.nombre ||
        "Parada sin nombre";


    // ------------------------------------------------------
    // MAPA
    // ------------------------------------------------------

    if (tipo === "MAPA") {

        return {
            titulo,
            secundaria: "Punto creado en mapa"
        };
    }


    // ------------------------------------------------------
    // PUNTO
    // ------------------------------------------------------

    if (tipo === "PUNTO") {

        let municipio =
            parada.municipio ||
            "";


        if (!municipio) {

            const puntoId =
                parada.puntoId ||
                parada.id_punto ||
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

                municipio =
                    punto
                        ? punto.municipio || ""
                        : "";
            }
        }

        return {
            titulo,
            secundaria: municipio
                ? `Punto habitual · ${municipio}`
                : "Punto habitual"
        };
    }


    // ------------------------------------------------------
    // AVISO
    // ------------------------------------------------------

    if (tipo === "AVISO") {

        let especie =
            parada.especie ||
            parada.especie_reportada ||
            "";

        let cantidad =
            parada.cantidad ??
            parada.numero_animales ??
            null;


        if (!especie) {

            const avisoId =
                parada.avisoId ??
                parada.id_aviso ??
                null;

            let aviso = null;


            if (
                avisoId !== null &&
                avisoId !== undefined &&
                String(avisoId) !== ""
            ) {

                // Recuperación segura por identificador.
                aviso =
                    encontrarAvisoPorId(
                        avisoId
                    );

            } else {

                /*
                 * Planificación antigua sin avisoId:
                 * solo se admite coincidencia EXACTA de nombre
                 * y UNA ÚNICA coincidencia. Con más de una no
                 * se inventa información.
                 */

                const coincidencias =
                    obtenerTodosAvisos()
                        .filter(
                            elemento =>
                                String(
                                    obtenerPuntoAviso(
                                        elemento
                                    )
                                ) ===
                                String(titulo)
                        );

                if (
                    coincidencias.length === 1
                ) {

                    aviso =
                        coincidencias[0];
                }
            }


            if (aviso) {

                especie =
                    obtenerEspecieAviso(
                        aviso
                    );


                const cantidadCruda =
                    aviso.cantidad ??
                    aviso.numero_animales ??
                    aviso.animales ??
                    aviso.CANTIDAD ??
                    aviso.NUMERO_ANIMALES ??
                    null;

                const numeroCrudo =
                    Number(cantidadCruda);


                if (
                    cantidad === null &&
                    cantidadCruda !== null &&
                    String(cantidadCruda).trim() !== "" &&
                    Number.isFinite(numeroCrudo) &&
                    numeroCrudo > 0
                ) {

                    // Solo cantidades explícitas del aviso.
                    cantidad =
                        obtenerCantidadAviso(
                            aviso
                        );
                }
            }
        }


        /*
         * "Especie no indicada" no identifica al animal:
         * se trata como dato no disponible.
         */

        if (
            String(especie)
                .trim()
                .toUpperCase() ===
            "ESPECIE NO INDICADA"
        ) {

            especie = "";
        }


        especie =
            String(especie || "").trim();


        if (!especie) {

            // Sin dato seguro → sin información secundaria.
            return {
                titulo,
                secundaria: ""
            };
        }


        let secundaria =
            especie;

        const numero =
            Number(cantidad);


        if (
            cantidad !== null &&
            cantidad !== undefined &&
            Number.isFinite(numero) &&
            numero > 0
        ) {

            secundaria +=
                ` · ${numero} ${
                    numero === 1
                        ? "ejemplar"
                        : "ejemplares"
                }`;
        }

        return {
            titulo,
            secundaria
        };
    }


    return {
        titulo,
        secundaria: ""
    };
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


    const esMapa =
        tipo === "MAPA";


    const numero =
        index + 1;


    const latParada =
        obtenerLat(parada);


    const lngParada =
        obtenerLng(parada);


    const tieneUbicacion =
        coordenadasValidas(
            latParada,
            lngParada
        );


    /*
     * Título e información secundaria de la ficha:
     * única fuente de información (AVISO / PUNTO / MAPA).
     */

    const info =
        obtenerInfoParada(parada);


    const nombre =
        info.titulo;


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
                    info.secundaria
                        ? `
                            <span
                                class="${
                                    esAviso
                                        ? "especie-parada detalles-parada"
                                        : "detalles-parada"
                                }"
                            >
                                ${escaparHTML(
                                    String(
                                        info.secundaria
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


                ${
                    parada.reconstruidaDesdeAviso === true
                        ? `
                            <span
                                style="
                                    display:inline-block;
                                    margin-top:4px;
                                    margin-left:4px;
                                    padding:1px 6px;
                                    border-radius:999px;
                                    background:#fff4e0;
                                    color:#7a4a00;
                                    font-size:11px;
                                    font-weight:600;
                                "
                            >
                                Reconstruida desde aviso
                            </span>
                        `
                        : ""
                }

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


                <button
                    type="button"
                    title="${
                        tieneUbicacion
                            ? "Localizar parada en el mapa"
                            : "Esta parada no tiene ubicación disponible"
                    }"
                    onclick="
                        event.stopPropagation();
                        seleccionarParadaEnMapa(
                            '${escaparHTML(
                                String(
                                    plan.vehiculoId
                                )
                            )}',
                            ${index}
                        )
                    "
                    ${
                        tieneUbicacion
                            ? ""
                            : "disabled"
                    }
                >
                    ◎
                </button>


                ${
                    esMapa
                        ? `
                            <button
                                type="button"
                                title="Editar nombre del punto"
                                onclick="
                                    editarNombreParada(
                                        '${escaparHTML(
                                            String(
                                                plan.vehiculoId
                                            )
                                        )}',
                                        ${index}
                                    )
                                "
                            >
                                ✎
                            </button>
                        `
                        : ""
                }

            </div>

        </div>

    `;
}


/* ============================================================
   EDITAR NOMBRE DE PUNTOS CREADOS EN MAPA
============================================================ */

/**
 * Permite renombrar una parada de tipo MAPA mediante prompt().
 *
 * Solo se modifica parada.nombre: ni coordenadas, ni orden,
 * ni estado. Si el usuario cancela o deja el campo vacío,
 * no se cambia nada.
 *
 * @param {string} vehiculoId
 * @param {number} index
 * @returns {boolean} true si el nombre cambió
 */
function editarNombreParada(
    vehiculoId,
    index
) {

    const plan =
        planificacionDia[
            vehiculoId
        ];


    if (
        !plan ||
        !Array.isArray(
            plan.paradas
        )
    ) {
        return false;
    }


    const parada =
        plan.paradas[
            index
        ];


    if (!parada) {
        return false;
    }


    // Solo las paradas MAPA tienen nombre editable.
    if (
        String(
            parada.tipo ||
            ""
        ).toUpperCase() !==
        "MAPA"
    ) {
        return false;
    }


    const nombreAnterior =
        parada.nombre || "";


    const respuesta =
        prompt(
            "Nombre del punto",
            nombreAnterior
        );


    // Cancelado → no se modifica nada.
    if (respuesta === null) {
        return false;
    }


    const nombreNuevo =
        String(respuesta).trim();


    if (!nombreNuevo) {

        alert(
            "El nombre no puede estar vacío. Se conserva el nombre anterior."
        );

        return false;
    }


    if (nombreNuevo === nombreAnterior) {
        return false;
    }


    // Único campo modificado.
    parada.nombre =
        nombreNuevo;


    marcarPlanificacionModificada(
        plan
    );


    renderizarPlanificacion();


    return true;
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
        typeof mapa !==
            "undefined" &&
        mapa &&
        typeof mapa.setView ===
            "function" &&
        coordenadasValidas(
            obtenerLat(
                parada
            ),
            obtenerLng(
                parada
            )
        )
    ) {

        mapa.setView(
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


    invalidarCalculosPlanificacion(
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
        typeof dibujarAvisos ===
        "function"
    ) {

        dibujarAvisos();
    }


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }


    recalcularYActualizarPlanificacionVehiculo(
        vehiculoId
    );
}


/* ============================================================
   INVALIDAR CÁLCULOS OBSOLETOS · FASE A
============================================================ */

/*
 * Después de un cambio estructural (subir, bajar, eliminar),
 * los cálculos anteriores dejan de representar la ruta actual.
 * Se limpian antes de lanzar el nuevo cálculo para que nunca
 * se presenten como vigentes. El nuevo cálculo los regenera.
 */
function invalidarCalculosPlanificacion(
    plan
) {

    if (!plan) {
        return;
    }


    plan.calculosRuta =
        null;

    plan.calculosTemporales =
        null;

    plan.horaRegresoEstimada =
        null;
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


    invalidarCalculosPlanificacion(
        plan
    );


    renderizarPlanificacion();


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }


    recalcularYActualizarPlanificacionVehiculo(
        vehiculoId
    );
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


    invalidarCalculosPlanificacion(
        plan
    );


    renderizarPlanificacion();


    if (
        typeof dibujarRutas ===
        "function"
    ) {

        dibujarRutas();
    }


    recalcularYActualizarPlanificacionVehiculo(
        vehiculoId
    );
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


    /*
     * FASE 3F.1 · P5: versión/generación de modificación.
     * Se incrementa en el punto central para cubrir todas
     * las mutaciones que pasan por esta función. Permite
     * saber si hubo cambios DURANTE un POST en curso.
     */

    /*
     * FASE 3F.2.2 · §3/§5: estado de versiones POR VEHÍCULO.
     * Se obtiene (o crea) ANTES del incremento para que
     * versionGuardada arranque en el último estado que el
     * servidor tiene confirmado.
     */
    const estadoVersiones =
        obtenerOCrearEstadoVersiones(plan);


    plan.versionModificacion =
        (
            Number(
                plan.versionModificacion
            ) || 0
        ) + 1;


    /*
     * FASE 3F.2.2 · §2/§5: versionActual (por vehículo) es
     * espejo de plan.versionModificacion, la fuente de verdad
     * de las mutaciones. Toda llamada a esta función queda
     * garantizada como:
     *   versionActual++
     *   plan.versionModificacion++
     *   plan.modificado = true
     * y después, al final, programarAutosave(plan).
     */
    estadoVersiones.versionActual =
        Number(plan.versionModificacion) || 0;


    const indicador =
        document.getElementById(
            "indicador-planificacion-modificada"
        );


    if (indicador) {

        /*
         * FASE 3F.1 · P6/P7: el indicador global pertenece
         * al vehículo SELECCIONADO. Solo se enciende si el
         * plan marcado es ese vehículo; si no, el estado
         * pendiente se comunica con los badges del selector.
         */

        const esPlanSeleccionado =
            !plan.vehiculoId ||
            !vehiculoPlanSeleccionado ||
            String(plan.vehiculoId) ===
            String(vehiculoPlanSeleccionado);


        if (esPlanSeleccionado) {

            indicador.classList.remove(
                "oculto"
            );
        }
    }


    /*
     * FASE 3F.2.4 · I1: render INMEDIATO de la interfaz.
     *
     * El indicador ya se ha actualizado arriba; sin este
     * render el badge y el botón podían quedar unos 3 segundos
     * (hasta el siguiente render de rutina) en "guardado" /
     * "Guardar planificación" mientras el indicador decía
     * "● Planificación modificada".
     *
     * SOLO presentación: el debounce de 3 segundos y el resto
     * del motor no cambian (el POST NO se adelanta).
     */

    renderizarPlanificacion();


    /*
     * FASE 3F.2.1 · PUNTO CENTRAL DE INYECCIÓN DEL AUTOSAVE.
     *
     * Único disparador: toda mutación de usuario que pasa por
     * aquí programa (o reprograma, cancelando el anterior) el
     * debounce de SU vehículo. El render nunca llega hasta
     * aquí, de modo que no puede existir el bucle
     * marcar → autosave → render → marcar.
     */

    programarAutosave(plan);
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


    if (
        valor === null ||
        valor === undefined ||
        (
            typeof valor === "string" &&
            valor.trim() === ""
        )
    ) {

        return null;

    }


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


    if (
        valor === null ||
        valor === undefined ||
        (
            typeof valor === "string" &&
            valor.trim() === ""
        )
    ) {

        return null;

    }


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

    /* null, undefined, booleanos o vacíos nunca son
       coordenadas válidas (Number(null) === 0 y
       Number("") === 0 los harían pasar como 0,0). */

    if (
        lat === null ||
        lat === undefined ||
        lng === null ||
        lng === undefined
    ) {
        return false;
    }


    if (
        typeof lat === "boolean" ||
        typeof lng === "boolean"
    ) {
        return false;
    }


    if (
        String(lat).trim() === "" ||
        String(lng).trim() === ""
    ) {
        return false;
    }


    const latitud =
        Number(lat);


    const longitud =
        Number(lng);


    return (
        Number.isFinite(latitud) &&
        Number.isFinite(longitud) &&
        latitud >= -90 &&
        latitud <= 90 &&
        longitud >= -180 &&
        longitud <= 180
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
   GUARDADO DE PLANIFICACIÓN · FASE 3D
   ------------------------------------------------------------
   - construirPayloadPlanificacion(plan)
       Transformación pura del plan local al contrato
       camelCase del backend. Solo envía los 8 campos de
       parada admitidos; nunca id/especie/cantidad/municipio.

   - guardarPlanificacionVehiculo(vehiculoId)
       Guardado único y controlado: exige cambios pendientes
       y bloquea peticiones simultáneas.

   NINGUNA de ellas está todavía conectada a las mutaciones.
   No hay autosave, debounce, reintentos ni indicadores.
============================================================ */

let guardandoPlanificacion = false;


/*
 * Fecha local "YYYY-MM-DD".
 * Se calcula con getFullYear/getMonth/getDate (zona local) y
 * NUNCA con toISOString(), que usaría UTC y podría desplazar
 * el día en torno a la medianoche.
 */
function fechaLocalYYYYMMDD() {

    const ahora = new Date();

    const año = ahora.getFullYear();

    const mes = String(ahora.getMonth() + 1).padStart(2, "0");

    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
}


/*
 * Coordenada al contrato del backend:
 *   número válido -> número
 *   vacío / inválido -> ""  (nunca 0)
 */
function coordenadaParaPayload(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }


    if (typeof valor === "number") {
        return Number.isFinite(valor)
            ? valor
            : "";
    }


    const texto = String(valor).trim();

    if (texto === "") {
        return "";
    }


    const numero = Number(
        texto.replace(",", ".")
    );

    return Number.isFinite(numero)
        ? numero
        : "";
}


/*
 * Construye el payload exacto que espera
 * guardar_planificacion en el backend.
 */
function construirPayloadPlanificacion(plan) {

    const planOrigen = plan || {};


    const paradas = Array.isArray(planOrigen.paradas)
        ? planOrigen.paradas
        : [];


    const paradasPayload = paradas.map(
        function(parada, indice) {

            const origen = parada || {};


            const tipo =
                origen.tipo === null ||
                origen.tipo === undefined
                    ? ""
                    : String(origen.tipo).toUpperCase();


            const orden = indice + 1;


            const avisoId =
                tipo === "AVISO" &&
                origen.avisoId !== null &&
                origen.avisoId !== undefined
                    ? String(origen.avisoId)
                    : "";


            const puntoId =
                tipo === "PUNTO" &&
                origen.puntoId !== null &&
                origen.puntoId !== undefined
                    ? String(origen.puntoId)
                    : "";


            const nombre =
                origen.nombre === null ||
                origen.nombre === undefined
                    ? ""
                    : String(origen.nombre);


            const estado =
                origen.estado === null ||
                origen.estado === undefined
                    ? ""
                    : String(origen.estado).toUpperCase();


            return {
                orden: orden,
                tipo: tipo,
                avisoId: avisoId,
                puntoId: puntoId,
                nombre: nombre,
                estado: estado,
                lat: coordenadaParaPayload(origen.lat),
                lng: coordenadaParaPayload(origen.lng)
            };
        }
    );


    /*
     * FASE 3F.6.6-B2 · fecha de pertenencia: se copia la fecha
     * fijada al cargar el plan. Nunca se recalcula aquí: un
     * reintento conserva así la fecha original. Sin fecha
     * válida no hay payload (el llamante bloquea antes).
     */
    const fechaPertenencia =
        fechaServidorValidaRutas(planOrigen.fecha);


    if (!fechaPertenencia) {

        throw new Error(
            "Planificación sin fecha de pertenencia válida: guardado bloqueado"
        );
    }


    return {
        accion: "guardar_planificacion",
        fecha: fechaPertenencia,
        vehiculo_id:
            planOrigen.vehiculoId === null ||
            planOrigen.vehiculoId === undefined
                ? ""
                : String(planOrigen.vehiculoId),
        ruta_id:
            planOrigen.rutaActiva === null ||
            planOrigen.rutaActiva === undefined
                ? ""
                : String(planOrigen.rutaActiva),
        horaSalida:
            planOrigen.horaSalida === null ||
            planOrigen.horaSalida === undefined
                ? ""
                : String(planOrigen.horaSalida),
        paradas: paradasPayload
    };
}


async function guardarPlanificacionVehiculo(vehiculoId, opciones) {

    /*
     * FASE 3F.2.3 · §13/§14: distinguir el guardado MANUAL
     * (botón o llamada directa: comportamiento por defecto) del
     * AUTOMÁTICO (debounce, cola o retry del motor). Solo los
     * intentos automáticos generan reintentos; el manual
     * cancela las esperas pendientes y no deja "retries
     * fantasma" posteriores.
     */
    const automatico =
        !!(opciones && opciones.automatico === true);


    const plan = planificacionDia[vehiculoId];


    if (!plan) {

        return {
            ok: false,
            error: "Planificación no encontrada"
        };
    }


    if (plan.modificado !== true) {

        return {
            ok: false,
            omitido: true,
            error: "La planificación no tiene cambios pendientes"
        };
    }


    /*
     * FASE 3F.6.6-B2 · bloqueo temporal: pausa por cambio de
     * día o fecha de pertenencia desconocida. No se toca el
     * carril, no se emite POST, no se alteran versiones: el
     * trabajo sigue pendiente y visible.
     */
    const motivoBloqueo =
        motivoBloqueoGuardado(plan);


    if (motivoBloqueo) {

        establecerFeedbackGuardadoPlanificacion(
            vehiculoId,
            "error"
        );


        return {
            ok: false,
            bloqueado: true,
            error: motivoBloqueo
        };
    }


    if (guardandoPlanificacion) {

        return {
            ok: false,
            omitido: true,
            error: "Ya hay un guardado de planificación en curso"
        };
    }


    /*
     * BLOQUE 5 · un snapshot sin paradas NO se envía. El
     * backend lo acepta como no-op (ok:true, filas:0) y no
     * guarda ni borra nada; presentarlo como éxito dejaría el
     * plan local como "guardado" cuando al recargar volvería
     * el estado anterior. El borrado explícito es la única
     * operación que elimina filas del servidor.
     */
    if (
        !Array.isArray(plan.paradas) ||
        plan.paradas.length === 0
    ) {

        plan.modificado = true;

        establecerFeedbackGuardadoPlanificacion(
            vehiculoId,
            "vacio"
        );

        renderizarPlanificacion();


        return {
            ok: false,
            vacio: true,
            error:
                "Una planificación sin paradas no se puede " +
                "guardar. Use la eliminación explícita si " +
                "desea quitarla del servidor."
        };
    }


    guardandoPlanificacion = true;

    vehiculoGuardandoPlanificacion = vehiculoId;


    /*
     * FASE 3F.2.3 · §13/§14: el guardado MANUAL toma el
     * control → cancela retry/backoff y debounce pendientes
     * (idempotente) antes de emitir SU snapshot. Si además
     * falla, no se programa ningún retry: el usuario está
     * viendo el error y puede volver a pulsar (§13.5).
     */

    if (!automatico) {

        reiniciarRecuperacionVehiculo(vehiculoId);
    }


    /*
     * FASE 3F.1 · P5: versión del plan ANTES de iniciar
     * el POST. El payload construido más abajo es ya el
     * snapshot que se envía.
     */

    const versionInicial =
        Number(
            plan.versionModificacion
        ) || 0;


    /*
     * FASE 3F.2.2 · §6 · INICIO DE POST (bloque síncrono):
     *   1. plan localizado (arriba)
     *   2. sigue modificado (arriba)
     *   3. capturar versionActual
     *   4. guardar esa versión como versionEnviada
     *   5. construir payload (justo más abajo)
     *   6. iniciar POST
     * Captura y payload permanecen en el MISMO bloque
     * síncrono previo al await: el snapshot no se congela
     * durante el debounce, se construye justo antes del POST.
     */
    const estadoVersiones =
        obtenerOCrearEstadoVersiones(plan);

    estadoVersiones.versionActual =
        versionInicial;

    estadoVersiones.versionEnviada =
        versionInicial;


    /*
     * FASE 3F.6.7-C2 · generación del envío: permite reconocer
     * respuestas tardías cuando un borrado se solicitó después
     * de iniciar este POST. Monótona por vehículo.
     */
    generacionEnvioPorVehiculo[vehiculoId] =
        (
            Number(
                generacionEnvioPorVehiculo[vehiculoId]
            ) || 0
        ) + 1;

    const generacionEsteEnvio =
        generacionEnvioPorVehiculo[vehiculoId];


    limpiarFeedbackGuardadoPlanificacion();

    renderizarPlanificacion();


    try {

        const payload =
            construirPayloadPlanificacion(plan);


        const resultado =
            await API.guardarPlanificacion(payload);


        if (
            resultado &&
            typeof resultado === "object" &&
            resultado.ok === true
        ) {

            /*
             * FASE 3F.1 · P5 · comparación de versiones.
             *
             * Caso A · sin cambios durante el POST:
             *   versionFinal === versionInicial → el snapshot
             *   guardado es el estado actual → modificado=false.
             *
             * Caso B · hubo cambios durante el POST:
             *   versionFinal !== versionInicial → ese POST
             *   guardó el snapshot A y el plan contiene el
             *   snapshot B, por lo que sigue pendiente.
             */

            const versionFinal =
                Number(
                    plan.versionModificacion
                ) || 0;


            estadoVersiones.versionActual =
                versionFinal;


            /*
             * BLOQUE 5 · confirmación real del snapshot: el
             * backend devuelve en filas el número de filas
             * escritas para estas paradas. Sin esa coincidencia
             * no hay guardado confirmado (filas:0 incluye el
             * caso de plan vacío, que el backend no persiste).
             */
            const filasConfirmadas =
                typeof resultado.filas === "number"
                    ? resultado.filas
                    : NaN;

            const filasEnviadas =
                payload.paradas.length;


            if (
                !Number.isFinite(filasConfirmadas) ||
                filasConfirmadas !== filasEnviadas ||
                filasEnviadas === 0
            ) {

                plan.modificado = true;

                estadoVersiones.versionActual =
                    versionFinal;

                establecerFeedbackGuardadoPlanificacion(
                    vehiculoId,
                    filasEnviadas === 0
                        ? "vacio"
                        : "error"
                );

                console.error(
                    "Guardado no confirmado para " +
                    vehiculoId + ": enviadas " +
                    filasEnviadas + ", confirmadas " +
                    filasConfirmadas
                );


                return {
                    ok: false,
                    vacio: filasEnviadas === 0,
                    error:
                        "El servidor no ha confirmado las " +
                        "paradas enviadas"
                };
            }


            plan.modificado =
                versionFinal !== versionInicial;


            /*
             * FASE 3F.6.7-C2 · respuesta obsoleta durante un
             * borrado: este POST se inició antes de solicitar
             * el borrado del vehículo. Aunque el servidor lo
             * haya almacenado, NO se declara guardado ni se
             * avanza versionGuardada: el trabajo sigue
             * pendiente y el borrado conserva el control. La
             * comparación usa la generación capturada antes
             * del await (nunca el estado mutable posterior).
             */
            const bloqueoBorrado =
                bloqueoBorradoActivo(vehiculoId);


            if (
                bloqueoBorrado &&
                bloqueoBorrado.generacionEnvioAlSolicitar >=
                    generacionEsteEnvio
            ) {

                plan.modificado = true;

                estadoVersiones.versionActual =
                    versionFinal;

                console.error(
                    "Respuesta de guardado obsoleta durante " +
                    "un borrado de " + vehiculoId + ": se " +
                    "conserva pendiente."
                );


                return {
                    ok: false,
                    error: "Respuesta de guardado obsoleta durante un borrado"
                };
            }


            /*
             * FASE 3F.2.2 · §7/§8 · ÉXITO: el servidor
             * confirma exactamente el snapshot ENVIADO, nunca
             * más, así que versionGuardada avanza hasta
             * versionEnviada y NUNCA hasta versionActual:
             *
             * §7 sin cambios durante el POST:
             *   actual === enviada → guardada = enviada = actual
             *   → modificado = false.
             * §8 con cambios durante el POST:
             *   actual > enviada → guardada = enviada < actual
             *   → modificado permanece true (§8: versionGuardada
             *   NO se actualiza a versionActual).
             */
            estadoVersiones.versionGuardada =
                estadoVersiones.versionEnviada;


            /*
             * FASE 3F.6.6-B2 · coherencia del eco: la respuesta
             * confirma el snapshot ENVIADO. Si el servidor
             * devuelve otra fecha, no se declara guardado: se
             * conserva pendiente y se reintenta (auto) con la
             * fecha original del plan.
             */
            const fechaEco =
                resultado &&
                typeof resultado.fecha === "string"
                    ? resultado.fecha
                    : "";


            if (
                fechaEco !== "" &&
                fechaEco !== payload.fecha
            ) {

                plan.modificado = true;

                estadoVersiones.versionActual =
                    versionFinal;

                establecerFeedbackGuardadoPlanificacion(
                    vehiculoId,
                    "error"
                );

                console.error(
                    "Fecha del servidor incoherente para " +
                    vehiculoId + ": enviada " +
                    payload.fecha + ", confirmada " +
                    fechaEco
                );


                if (
                    automatico &&
                    !pausaCambioDia &&
                    !bloqueoBorradoActivo(vehiculoId)
                ) {

                    programarReintentoAutosave(
                        vehiculoId
                    );
                }


                return {
                    ok: false,
                    error: "La fecha confirmada por el servidor no coincide con la enviada"
                };
            }


            /*
             * BLOQUE 6 · el backend ha confirmado el snapshot y
             * la fecha: las paradas reconstruidas incluidas en
             * él ya forman parte de una planificación persistida.
             */
            confirmarParadasPersistidasEnPlan(
                plan,
                payload.paradas
            );


            if (!plan.modificado) {

                /*
                 * FASE 3F.2.3 · §18: guardado exitoso → NO debe
                 * quedar NINGÚN timer relacionado con este
                 * vehículo (debounce, retry, contadores).
                 */

                reiniciarRecuperacionVehiculo(vehiculoId);


                /*
                 * FASE 3F.1 · P2 · feedback de éxito.
                 */

                establecerFeedbackGuardadoPlanificacion(
                    vehiculoId,
                    "ok"
                );

            } else {

                /*
                 * FASE 3F.2.2 · §8 · ÉXITO CON CAMBIOS
                 * DURANTE EL POST:
                 *   versionActual !== versionEnviada
                 * → versionGuardada quedó en versionEnviada (el
                 * snapshot anterior) y NO llegó a versionActual,
                 * por lo que modificado permanece true. El
                 * autosave se reprograma para enviar el estado
                 * final.
                 *
                 * FASE 3F.2.1 · PARTE 11: se abre una ventana
                 * de debounce nueva de 3 segundos para enviar,
                 * en un único POST posterior, el estado final
                 * (v6, v7 y v8 se coalescen en uno).
                 *
                 * FASE 3F.2.3 · este intento terminó bien: el
                 * ciclo de recuperación se reinicia antes de
                 * rearmar (sin restos de intentos previos).
                 */

                reiniciarRecuperacionVehiculo(vehiculoId);

                programarAutosave(plan);
            }

            return resultado;
        }


        /*
         * Fallo: el plan conserva (o recupera) el estado
         * modificado para que no se pierdan los cambios.
         */

        /*
         * FASE 3F.2.2 · §10/§11 · ERROR (incluye el timeout
         * de 15 s, que se trata como cualquier otro error):
         * modificado permanece true y versionGuardada NO
         * avanza; solo se refresca versionActual. Sin retry
         * automático en esta microfase.
         */
        plan.modificado = true;

        estadoVersiones.versionActual =
            Number(plan.versionModificacion) || 0;


        const fallo =
            resultado &&
            typeof resultado === "object"
                ? resultado
                : {
                    ok: false,
                    error: "Respuesta no válida del servidor"
                };


        /*
         * FASE 3F.1 · P2/P9: feedback visible de error,
         * sin depender exclusivamente de console.error.
         */

        establecerFeedbackGuardadoPlanificacion(
            vehiculoId,
            "error"
        );


        console.error(
            "No se ha guardado la planificación de " +
            vehiculoId + ":",
            fallo
        );


        /*
         * FASE 3F.2.3 · §4/§17: el fallo (incluido el timeout
         * de 15 s, que se trata como cualquier otro error)
         * cuenta como intento fallido y programa el SIGUIENTE
         * intento con el backoff centralizado. El retry
         * re-capturará la versión vigente justo antes de su
         * POST (nunca un snapshot antiguo, §8). Si es un
         * guardado MANUAL o se agotaron los intentos, no se
         * programa nada (§13/§15).
         */

        if (automatico) {
            programarReintentoAutosave(vehiculoId);
        }


        return fallo;

    } catch (error) {

        /*
         * FASE 3F.2.2 · §10 · excepción (incluye el timeout
         * de 15 s): idéntico al error — versionGuardada sin
         * avanzar, carril liberado en el finally, sin retry.
         */
        plan.modificado = true;

        estadoVersiones.versionActual =
            Number(plan.versionModificacion) || 0;

        establecerFeedbackGuardadoPlanificacion(
            vehiculoId,
            "error"
        );

        console.error(
            "Error guardando la planificación de " +
            vehiculoId + ":",
            error
        );


        /*
         * FASE 3F.2.3 · misma recuperación que el camino de
         * error: intento fallido + backoff (solo automático).
         */

        if (automatico) {
            programarReintentoAutosave(vehiculoId);
        }

        return {
            ok: false,
            error: "Error inesperado guardando la planificación"
        };

    } finally {

        guardandoPlanificacion = false;

        vehiculoGuardandoPlanificacion = "";


        /*
         * FASE 3F.2.3 · §7: el indicador "pendiente durante
         * vuelo" es EXCLUSIVO del POST en curso. Al terminar,
         * el trabajo pendiente (si lo hay) queda representado
         * por el retry o el debounce ya programados en el
         * cuerpo del try/catch.
         */
        const estadoRecupFinal =
            estadoRecuperacionAutosave[
                String(vehiculoId)
            ];

        if (estadoRecupFinal) {
            estadoRecupFinal.pendienteDuranteVuelo = false;
        }


        /*
         * FASE 3F.1 · P4: actualización inmediata de la
         * interfaz (indicador + botón) con el estado de
         * guardado ya liberado.
         */

        renderizarPlanificacion();


        /*
         * FASE 3F.2.1 · PARTE 18/19: el carril no puede
         * quedarse bloqueado. Se atiende la cola del motor.
         *
         * Si el guardado lo lanzó el motor, su marca
         * (vehiculoAutosaveEnCurso) sigue activa y esta
         * llamada no arranca nada; el motor libera su marca
         * después, en su propio .finally, y encadena el
         * siguiente vehículo.
         *
         * Si el guardado se lanzó directamente, fuera del
         * motor, esta llamada es la que evita que la cola
         * se quede sin procesamiento.
         */

        procesarColaAutosave();
    }
}


/* ============================================================
   FASE 3F.1 · BOTÓN DE GUARDADO · ESTADOS · FEEDBACK
============================================================ */

/*
 * Vehículo que tiene un POST en curso (null si ninguno).
 */
let vehiculoGuardandoPlanificacion = "";


/*
 * Feedback visible del último guardado de un vehículo.
 * estado: "" | "ok" | "error" | "vacio"
 */
let estadoFeedbackGuardadoPlanificacion = {
    vehiculoId: "",
    estado: ""
};


let feedbackGuardadoPlanificacionTimeout = null;


const DURACION_FEEDBACK_GUARDADO_MS = 4000;


function limpiarFeedbackGuardadoPlanificacion() {

    estadoFeedbackGuardadoPlanificacion = {
        vehiculoId: "",
        estado: ""
    };


    if (
        feedbackGuardadoPlanificacionTimeout !==
        null
    ) {

        try {

            window.clearTimeout(
                feedbackGuardadoPlanificacionTimeout
            );

        } catch (error) {
            /* entorno sin timers: ignorar */
        }

        feedbackGuardadoPlanificacionTimeout =
            null;
    }
}


function establecerFeedbackGuardadoPlanificacion(
    vehiculoId,
    estado
) {

    limpiarFeedbackGuardadoPlanificacion();


    if (!vehiculoId || !estado) {
        return;
    }


    estadoFeedbackGuardadoPlanificacion = {
        vehiculoId: String(vehiculoId),
        estado: String(estado)
    };


    try {

        feedbackGuardadoPlanificacionTimeout =
            window.setTimeout(
                function() {

                    limpiarFeedbackGuardadoPlanificacion();

                    renderizarPlanificacion();
                },
                DURACION_FEEDBACK_GUARDADO_MS
            );

    } catch (error) {

        /*
         * Si el entorno no dispone de timers, el feedback
         * permanece hasta el siguiente renderizado.
         */

        feedbackGuardadoPlanificacionTimeout =
            null;
    }
}


/*
 * FASE 3F.2.4 · I4: aviso de ERROR (o de plan sin paradas)
 * de guardado de un vehículo que NO está seleccionado.
 *
 * El fallo ya queda registrado en el feedback existente
 * (estadoFeedbackGuardadoPlanificacion), pero ese feedback se
 * muestra en el botón del vehículo SELECCIONADO: si falla V2
 * mientras el usuario mira V1, no había ninguna señal visible.
 *
 * Este aviso es ADICIONAL (nunca sustituye al indicador ni al
 * badge):
 *   - solo se muestra si el vehículo fallido NO es el
 *     seleccionado (para él ya está el propio botón);
 *   - el badge del vehículo fallido sigue en "cambios
 *     pendientes" y el plan conserva modificado = true;
 *   - desaparece con el propio feedback (éxito posterior o
 *     caducidad del feedback), igual que el resto de estados.
 */
function crearAvisoErrorGuardadoPlanificacion() {

    const estadoFeedback =
        estadoFeedbackGuardadoPlanificacion.estado;


    if (
        estadoFeedback !== "error" &&
        estadoFeedback !== "vacio"
    ) {
        return "";
    }


    const vehiculoId =
        String(
            estadoFeedbackGuardadoPlanificacion.vehiculoId ||
            ""
        );


    if (!vehiculoId) {
        return "";
    }


    /*
     * Vehículo seleccionado: su propio botón ya muestra el
     * estado (error o plan sin paradas). No se duplica el aviso.
     */

    if (
        String(
            vehiculoPlanSeleccionado || ""
        ) === vehiculoId
    ) {
        return "";
    }


    return `

        <div
            class="aviso-error-guardado-plan"
            role="alert"
            style="
                display: block;
                margin-top: 8px;
                padding: 6px 8px;
                border: 1px solid var(--danger);
                border-radius: 6px;
                background: var(--danger-soft);
                color: var(--danger);
                font-size: 11px;
                font-weight: 700;
            "
        >
            ⚠ ${
                estadoFeedback === "vacio"
                    ? "Planificación sin paradas no guardada"
                    : "No se ha podido guardar"
            } ${escaparHTML(
                vehiculoId
            )}
        </div>

    `;
}


/*
 * Estado del botón de guardado para un plan concreto.
 * Devuelve texto, clase y si debe quedar deshabilitado.
 */
function obtenerEstadoBotonGuardarPlanificacion(
    plan
) {

    const deshabilitado =
        guardandoPlanificacion === true;


    if (
        deshabilitado &&
        vehiculoGuardandoPlanificacion ===
            plan.vehiculoId
    ) {

        return {
            texto: "⏳ Guardando...",
            deshabilitado: true,
            clase: "guardando"
        };
    }


    /*
     * FASE 3F.2.4 · I2: la transmisión global está ocupada por
     * OTRO vehículo (el seleccionado no es el que está en
     * vuelo). El botón sigue deshabilitado —nunca se permiten
     * POST simultáneos— pero ahora explica el motivo.
     */

    if (deshabilitado) {

        return {
            texto: "⏳ Guardando otro vehículo...",
            deshabilitado: true,
            clase: "guardando"
        };
    }


    /*
     * FASE 3F.6.6-B2 · el botón refleja el bloqueo temporal:
     * deshabilitado, sin permitir clics, e indicando el motivo.
     * La guarda real la aplica guardarPlanificacionVehiculo.
     */
    if (pausaCambioDia) {

        return {
            texto: "⏸ Guardado en pausa por cambio de día",
            deshabilitado: true,
            clase: "pausado"
        };
    }


    if (!fechaPertenenciaPlan(plan)) {

        return {
            texto: "🚫 Fecha desconocida — guardado bloqueado",
            deshabilitado: true,
            clase: "bloqueado"
        };
    }


    /*
     * FASE 3F.6.7-C2 · borrado en curso: el botón manual queda
     * deshabilitado con motivo visible. La guarda real la
     * aplica guardarPlanificacionVehiculo.
     *
     * FASE 3F.6.7-C4-B · el bloqueo global también deshabilita,
     * con su propio mensaje.
     */
    if (bloqueoGlobalMarcas) {

        return {
            texto: "🚫 Registro de borrados ilegible — guardado bloqueado",
            deshabilitado: true,
            clase: "bloqueado"
        };
    }


    if (bloqueoBorradoActivo(plan.vehiculoId)) {

        return {
            texto: "🚫 Borrado en curso — guardado bloqueado",
            deshabilitado: true,
            clase: "bloqueado"
        };
    }


    if (
        estadoFeedbackGuardadoPlanificacion.vehiculoId ===
            String(plan.vehiculoId)
    ) {

        if (
            estadoFeedbackGuardadoPlanificacion.estado ===
            "ok"
        ) {

            return {
                texto: "✓ Planificación guardada",
                deshabilitado: deshabilitado,
                clase: "guardado"
            };
        }


        if (
            estadoFeedbackGuardadoPlanificacion.estado ===
            "vacio"
        ) {

            return {
                texto: "⚠ Plan sin paradas — no guardado",
                deshabilitado: deshabilitado,
                clase: "error"
            };
        }


        if (
            estadoFeedbackGuardadoPlanificacion.estado ===
            "error"
        ) {

            return {
                texto: "⚠ No se ha podido guardar",
                deshabilitado: deshabilitado,
                clase: "error"
            };
        }
    }


    if (plan.modificado === true) {

        return {
            texto: "💾 Guardar cambios",
            deshabilitado: deshabilitado,
            clase: "pendiente"
        };
    }


    return {
        texto: "💾 Guardar planificación",
        deshabilitado: deshabilitado,
        clase: "sin-cambios"
    };
}


function crearBotonGuardarPlanificacion(plan) {

    const estado =
        obtenerEstadoBotonGuardarPlanificacion(
            plan
        );


    return `

        <button
            type="button"
            id="boton-guardar-planificacion"
            class="
                boton-guardar-planificacion
                ${estado.clase}
            "
            ${
                estado.deshabilitado
                    ? "disabled"
                    : ""
            }
            onclick="
                guardarPlanificacionVehiculoSeleccionado()
            "
        >
            ${estado.texto}
        </button>

    `;
}


/*
 * Disparador del botón: FASE 3F.2.1 · funciona como FLUSH
 * del mismo motor de autosave. No crea un sistema paralelo:
 *
 * - con debounce pendiente → cancela el temporizador y
 *   guarda inmediatamente (sin esperar 3 segundos);
 * - sin debounce → comportamiento anterior;
 * - con POST en curso → no inicia un segundo envío; si es
 *   el mismo vehículo lo decide la comparación de versiones
 *   del POST en vuelo, y si es otro vehículo queda en cola.
 */
function guardarPlanificacionVehiculoSeleccionado() {

    if (!vehiculoPlanSeleccionado) {

        return Promise.resolve({
            ok: false,
            error: "No hay ningún vehículo seleccionado"
        });
    }


    const vehiculoId =
        String(vehiculoPlanSeleccionado);


    /*
     * FLUSH · se cancela el debounce de este vehículo.
     */

    cancelarDebounceAutosave(vehiculoId);


    /*
     * FASE 3F.2.3 · §13/§14: el guardado manual cancela
     * también la espera de retry/backoff del vehículo → nunca
     * coexisten "manual POST + retry POST". Si el vehículo
     * está EN VUELO no se toca su bookkeeping: ese POST en
     * curso sigue siendo el que decide con las versiones.
     */

    const enVuelo =
        vehiculoAutosaveEnCurso === vehiculoId;


    if (!enVuelo) {

        reiniciarRecuperacionVehiculo(vehiculoId);
    }


    /*
     * Carril libre → guardado inmediato por el motor,
     * con semántica MANUAL (sin reintentos automáticos).
     */

    if (!carrilAutosaveOcupado()) {

        return ejecutarAutosaveVehiculo(
            vehiculoId,
            { automatico: false }
        );
    }


    /*
     * Carril ocupado → nunca un segundo POST.
     * Si es el vehículo en vuelo, el POST actual ya decidirá
     * con las versiones. Si es otro, queda pendiente en la
     * cola y se procesará cuando el carril se libere.
     */

    if (!enVuelo) {

        const plan =
            planificacionDia[vehiculoId];


        if (plan && plan.modificado === true) {

            encolarAutosave(vehiculoId);
        }
    }


    return Promise.resolve({
        ok: false,
        omitido: true,
        error: "Ya hay un guardado de planificación en curso"
    });
}


/* ============================================================
   FASE 3F.1 · PROTECCIÓN ANTES DE SALIR / RECARGAR
============================================================ */

function hayPlanificacionModificadaSinGuardar() {

    return Object.keys(
        planificacionDia || {}
    ).some(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];

            return (
                !!plan &&
                plan.modificado === true
            );
        }
    );
}


window.addEventListener(
    "beforeunload",
    function(evento) {

        if (
            !hayPlanificacionModificadaSinGuardar()
        ) {
            return;
        }


        const mensaje =
            pausaCambioDia
                ? "Hay cambios de planificación sin guardar (guardado en pausa por cambio de día)."
                : "Hay cambios de planificación sin guardar.";


        if (
            typeof evento.preventDefault ===
            "function"
        ) {

            evento.preventDefault();
        }


        evento.returnValue = mensaje;

        return mensaje;
    }
);


/* ============================================================
   FASE 3F.6.6-B2 · FECHA DE PERTENENCIA Y PAUSA POR CAMBIO DE DÍA
   ------------------------------------------------------------
   - Cada plan conserva la fecha con la que se cargó (fecha de
     pertenencia). Los payloads la copian; nunca la recalculan.
   - Sin fecha válida no hay envíos (ni manuales ni automáticos).
   - Al cambiar el día con trabajo pendiente se entra en pausa:
     se cancelan temporizadores (NO se tocan datos ni versiones),
     se bloquean nuevos envíos y se pide decisión explícita.
   - Un POST ya en vuelo termina con su payload y fecha
     originales: aquí nunca se cancela ni se reescribe.
============================================================ */

let fechaServidor = null;

let pausaCambioDia = null;

/*
 * FASE 3F.6.6-B3 · decisión explícita "Guardar en D": mientras
 * la fecha autorizada coincida con la del servidor, el control
 * periódico no vuelve a pausar el trabajo pendiente de ese
 * día. Se limpia al reconstruir (nuevo día u otra decisión).
 */
let resolucionCambioDia = null;

/*
 * FASE 3F.6.6-B3 · recarga limpia fallida: día intentado y
 * motivo visible. Bloquea envíos hasta reintento explícito.
 */
let falloRecargaDia = null;

let recargaLimpiaEnCurso = false;

let ultimoDiaRecargaIntentada = "";


/*
 * Valida YYYY-MM-DD con calendario real (sin objetos Date,
 * sin zonas horarias). Devuelve la cadena o null.
 */
function fechaServidorValidaRutas(valor) {

    if (typeof valor !== "string") {

        return null;
    }


    const coincidencia =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);


    if (!coincidencia) {

        return null;
    }


    const anio = Number(coincidencia[1]);

    const mes = Number(coincidencia[2]);

    const dia = Number(coincidencia[3]);


    if (
        mes < 1 ||
        mes > 12 ||
        dia < 1
    ) {

        return null;
    }


    const bisiesto =
        (anio % 4 === 0 && anio % 100 !== 0) ||
        anio % 400 === 0;

    const diasPorMes = [
        31, bisiesto ? 29 : 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31
    ];


    if (dia > diasPorMes[mes - 1]) {

        return null;
    }


    return valor;
}


function establecerFechaServidor(valor) {

    const nuevo =
        fechaServidorValidaRutas(valor) || null;


    /*
     * FASE 3F.6.6-B3 · una fecha efectiva distinta invalida
     * decisiones y errores anteriores: el estado arranca limpio.
     */
    if (nuevo !== fechaServidor) {

        resolucionCambioDia = null;

        falloRecargaDia = null;
    }


    fechaServidor = nuevo;


    return fechaServidor;
}


function obtenerInfoDiaPlanificacion() {

    return {

        fechaServidor:
            fechaServidor,

        pausa:
            pausaCambioDia
                ? {
                    fechaPlan:
                        pausaCambioDia.fechaPlan,
                    fechaNueva:
                        pausaCambioDia.fechaNueva
                }
                : null
    };
}


function fechaPertenenciaPlan(plan) {

    if (!plan) {

        return null;
    }


    return fechaServidorValidaRutas(plan.fecha);
}


/*
 * Motivo por el que un guardado no puede emitirse, o null si
 * puede intentarse. No altera ningún estado: solo informa.
 */
function motivoBloqueoGuardado(plan) {

    /*
     * FASE 3F.6.7-C4-B · bloqueo global por registro de
     * borrados ilegible: precede a cualquier otro motivo.
     */
    if (bloqueoGlobalMarcas) {

        return (
            bloqueoGlobalMarcas.mensaje ||
            "Guardados bloqueados por registro de borrados ilegible."
        );
    }


    if (pausaCambioDia) {

        return (
            "Guardado en pausa por cambio de día " +
            "(plan del " + pausaCambioDia.fechaPlan +
            ", hoy " + pausaCambioDia.fechaNueva + ")."
        );
    }


    /*
     * FASE 3F.6.7-C2 · borrado en curso para este vehículo:
     * ningún guardado (manual, auto, retry o recuperado)
     * puede emitirse ni rearmarse mientras dure.
     */
    if (bloqueoBorradoActivo(plan.vehiculoId)) {

        return (
            "Borrado en curso: guardado bloqueado para este vehículo."
        );
    }


    if (!fechaPertenenciaPlan(plan)) {

        return (
            "Fecha de la planificación desconocida: " +
            "guardado bloqueado."
        );
    }


    /*
     * FASE 3F.6.6-B3 · recarga del día nuevo fallida: no se
     * permite guardar con la fecha antigua sin que el error
     * sea visible (el banner lo muestra y permite reintentar).
     */
    if (falloRecargaDia) {

        return (
            "No se pudo cargar el día " +
            falloRecargaDia.fechaIntentada +
            ": guardado bloqueado hasta reintentar."
        );
    }


    return null;
}


function recuperacionLimpia() {

    return Object.keys(
        estadoRecuperacionAutosave || {}
    ).every(
        function(vehiculoId) {

            const estado =
                estadoRecuperacionAutosave[vehiculoId];


            return (
                !estado ||
                (
                    estado.timerReintento === null &&
                    estado.esperandoRecuperacion !== true
                )
            );
        }
    );
}


/*
 * Evalúa si el día local sigue coincidiendo con la fecha de
 * pertenencia. Barata e idempotente: pensada para llamarse en
 * cada tick del reloj y en cada vía de envío.
 */
function evaluarCambioDia() {

    let hoy = "";

    try {

        hoy = fechaLocalYYYYMMDD();

    } catch (error) {

        return "error-reloj";
    }


    if (!fechaServidor) {

        return "sin-referencia";
    }


    if (pausaCambioDia) {

        if (pausaCambioDia.fechaNueva !== hoy) {

            pausaCambioDia.fechaNueva = hoy;

            renderizarPlanificacion();

            if (
                typeof actualizarFechaPlanificacion ===
                    "function"
            ) {

                try {

                    actualizarFechaPlanificacion();

                } catch (error) {
                    /* solo presentación: no interrumpe */
                }
            }
        }


        return "en-pausa";
    }


    if (hoy === fechaServidor) {

        return "coherente";
    }


    /*
     * FASE 3F.6.6-B3 · CR-1: si el usuario autorizó guardar en
     * el día original y sigue habiendo trabajo de ese día, el
     * control periódico no vuelve a pausar ni cancela el
     * autosave autorizado. Al drenar, cae al camino limpio.
     */
    if (
        resolucionCambioDia &&
        resolucionCambioDia.fechaPlan === fechaServidor &&
        hayPlanificacionModificadaSinGuardar()
    ) {

        return "resuelto-guardar-D";
    }


    /*
     * FASE 3F.6.6-B3 · AL-1: con petición en curso no se pausa
     * ni se dialoga: el vuelo termina intacto y el siguiente
     * tick decidirá (pausa o recarga) con el estado final.
     */
    if (carrilAutosaveOcupado()) {

        return "en-vuelo";
    }


    const limpio =
        !hayPlanificacionModificadaSinGuardar() &&
        !carrilAutosaveOcupado() &&
        recuperacionLimpia();


    if (limpio) {

        recargarPlanificacionLimpia(hoy);

        return "recargando";
    }


    activarPausaCambioDia(fechaServidor, hoy);


    return "pausado";
}


function activarPausaCambioDia(fechaPlan, fechaNueva) {

    pausaCambioDia = {

        fechaPlan:
            fechaPlan,

        fechaNueva:
            fechaNueva,

        dialogoMostrado:
            false
    };


    /*
     * Solo temporizadores: las modificaciones, versiones y
     * recuperación pendiente se conservan intactas. El POST
     * en vuelo (si lo hay) sigue su curso con su payload.
     */

    Object.keys(planificacionDia || {}).forEach(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];


            if (
                plan &&
                plan.modificado === true
            ) {

                cancelarEsperasAutosave(vehiculoId);
            }
        }
    );


    colaAutosave = [];


    renderizarPlanificacion();


    if (
        typeof actualizarFechaPlanificacion ===
            "function"
    ) {

        try {

            actualizarFechaPlanificacion();

        } catch (error) {
            /* solo presentación: no interrumpe */
        }
    }


    mostrarDialogoCambioDia();
}


function reanudarGuardadoPausado() {

    if (!pausaCambioDia) {

        return;
    }


    const fechaAutorizada =
        pausaCambioDia.fechaPlan;


    pausaCambioDia = null;

    cerrarDialogoCambioDia();

    renderizarPlanificacion();


    /*
     * FASE 3F.6.6-B3 · CR-1: la decisión explícita autoriza
     * drenar el trabajo pendiente del día original. Mientras
     * siga habiendo ese trabajo, evaluarCambioDia no vuelve
     * a pausar ni cancela el autosave autorizado.
     */
    resolucionCambioDia = {

        fechaPlan:
            fechaAutorizada
    };


    if (
        typeof actualizarFechaPlanificacion ===
            "function"
    ) {

        try {

            actualizarFechaPlanificacion();

        } catch (error) {
            /* solo presentación: no interrumpe */
        }
    }


    /*
     * Los planes conservan su fecha de pertenencia: los
     * payloads que se construyan ahora guardarán en el día
     * original, nunca en el nuevo.
     */

    Object.keys(planificacionDia || {}).forEach(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];


            if (
                plan &&
                plan.modificado === true
            ) {

                programarAutosave(plan);
            }
        }
    );
}


/*
 * FASE 3F.6.6-B3 · AL-2: vuelve al diálogo sin descartar nada.
 * El estado pendiente queda íntegro para una nueva decisión.
 */
function volverADialogoPausa() {

    if (pausaCambioDia) {

        pausaCambioDia.dialogoMostrado = false;

        mostrarDialogoCambioDia();
    }
}


async function descartarCambiosYCargarDiaNuevo() {

    cerrarDialogoCambioDia();


    /*
     * FASE 3F.6.6-B3 · AL-2: la confirmación cubre el estado
     * exacto de este instante. Si aparece una edición nueva
     * durante las esperas, no se descarta silenciosamente.
     */
    const versionesConfirmadas = {};

    Object.keys(planificacionDia || {}).forEach(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];


            versionesConfirmadas[vehiculoId] =
                plan
                    ? Number(plan.versionModificacion) || 0
                    : -1;
        }
    );


    function huboEdicionIntermedia() {

        const actuales =
            Object.keys(planificacionDia || {});


        if (
            actuales.length !==
            Object.keys(versionesConfirmadas).length
        ) {

            return true;
        }


        return actuales.some(
            function(vehiculoId) {

                const plan =
                    planificacionDia[vehiculoId];


                return (
                    !plan ||
                    (
                        Number(plan.versionModificacion) ||
                        0
                    ) !== versionesConfirmadas[vehiculoId]
                );
            }
        );
    }


    let datos = null;

    try {

        datos =
            await API.obtenerDatos();

    } catch (error) {

        console.error(
            "No se pudo cargar la planificación del nuevo día:",
            error
        );


        volverADialogoPausa();


        return;
    }


    /*
     * FASE 3F.6.6-B3 · AL-2: edición nueva durante la espera →
     * la confirmación anterior ya no cubre el estado actual:
     * se vuelve al diálogo sin descartar nada.
     */

    if (huboEdicionIntermedia()) {

        console.error(
            "Descarte anulado: hay ediciones posteriores a la confirmación."
        );


        volverADialogoPausa();


        return;
    }


    /*
     * Solo se descarta DESPUÉS de tener datos nuevos válidos:
     * si la normalización falla, el estado pendiente sigue
     * intacto y se vuelve al diálogo.
     */

    let normalizados = null;

    try {

        normalizados =
            normalizarDatosAplicacion(datos);

    } catch (error) {

        console.error(
            "Datos del nuevo día no válidos:",
            error
        );


        volverADialogoPausa();


        return;
    }


    /*
     * FASE 3F.6.6-B3 · AL-2: validar la fecha del servidor
     * antes de descartar y comprobar de nuevo que no haya
     * ediciones intermedias (también durante la
     * normalización, aunque sea síncrona).
     */

    if (huboEdicionIntermedia()) {

        console.error(
            "Descarte anulado: hay ediciones posteriores a la confirmación."
        );


        volverADialogoPausa();


        return;
    }


    if (
        !fechaServidorValidaRutas(
            normalizados.FECHA_SERVIDOR
        )
    ) {

        console.error(
            "Descarte anulado: el nuevo día no trae fecha válida."
        );


        volverADialogoPausa();


        return;
    }


    window.DATOS_MOCK = normalizados;

    cargarPlanificacionDesdeDatos();

    renderizarPlanificacion();


    if (
        typeof actualizarFechaPlanificacion ===
            "function"
    ) {

        try {

            actualizarFechaPlanificacion();

        } catch (error) {
            /* solo presentación: no interrumpe */
        }
    }
}


async function recargarPlanificacionLimpia(nuevoDia) {

    if (
        recargaLimpiaEnCurso ||
        ultimoDiaRecargaIntentada === nuevoDia
    ) {

        return;
    }


    recargaLimpiaEnCurso = true;

    ultimoDiaRecargaIntentada = nuevoDia;


    try {

        const datos =
            await API.obtenerDatos();


        /*
         * Si el usuario modificó algo durante la lectura, no
         * se reconstruye encima: el siguiente tick detectará
         * el día cambiado con trabajo pendiente y pausará.
         */

        if (
            hayPlanificacionModificadaSinGuardar() ||
            carrilAutosaveOcupado() ||
            !recuperacionLimpia()
        ) {

            return;
        }


        window.DATOS_MOCK =
            normalizarDatosAplicacion(datos);

        cargarPlanificacionDesdeDatos();

        renderizarPlanificacion();


        if (
            typeof actualizarFechaPlanificacion ===
                "function"
        ) {

            actualizarFechaPlanificacion();
        }

    } catch (error) {

        console.error(
            "No se pudo recargar la planificación del nuevo día:",
            error
        );


        /*
         * FASE 3F.6.6-B3 · ME-1: el fallo queda visible y
         * bloquea envíos con la fecha antigua hasta un
         * reintento explícito (clic en el aviso). No se
         * descarta nada ni se reintenta en bucle.
         */
        falloRecargaDia = {

            fechaIntentada:
                nuevoDia,

            mensaje:
                "No se pudo cargar la planificación del día " +
                nuevoDia + "."
        };

        renderizarPlanificacion();

    } finally {

        recargaLimpiaEnCurso = false;
    }
}


function cerrarDialogoCambioDia() {

    const existente =
        document.getElementById(
            "dialogo-cambio-dia"
        );


    if (
        existente &&
        existente.parentNode
    ) {

        existente.parentNode.removeChild(existente);
    }


    const confirmacion =
        document.getElementById(
            "dialogo-confirmar-descarte"
        );


    if (
        confirmacion &&
        confirmacion.parentNode
    ) {

        confirmacion.parentNode.removeChild(confirmacion);
    }
}


function mostrarDialogoCambioDia() {

    if (
        !pausaCambioDia ||
        pausaCambioDia.dialogoMostrado
    ) {

        return;
    }


    if (
        typeof document === "undefined" ||
        !document.body
    ) {

        return;
    }


    cerrarDialogoCambioDia();


    const afectados =
        Object.keys(planificacionDia || {})
            .filter(
                function(vehiculoId) {

                    const plan =
                        planificacionDia[vehiculoId];


                    return (
                        !!plan &&
                        plan.modificado === true
                    );
                }
            )
            .map(
                function(vehiculoId) {

                    return (
                        obtenerNombreVehiculo(vehiculoId) +
                        " (" + vehiculoId + ")"
                    );
                }
            );


    const fondo =
        document.createElement("div");

    fondo.id = "dialogo-cambio-dia";

    fondo.setAttribute("role", "dialog");

    fondo.setAttribute("aria-modal", "true");

    fondo.style.cssText =
        "position:fixed;inset:0;z-index:9999;" +
        "background:rgba(0,0,0,0.55);display:flex;" +
        "align-items:center;justify-content:center;padding:16px;";


    const panel =
        document.createElement("div");

    panel.style.cssText =
        "background:#fff;color:#222;max-width:520px;width:100%;" +
        "border-radius:12px;padding:20px 22px;" +
        "font-family:inherit;box-shadow:0 12px 40px rgba(0,0,0,0.35);";


    const titulo =
        document.createElement("h2");

    titulo.textContent = "Ha cambiado el día";

    titulo.style.cssText =
        "margin:0 0 8px;font-size:20px;";


    const cuerpo =
        document.createElement("p");

    cuerpo.textContent =
        "Estás editando la planificación del " +
        pausaCambioDia.fechaPlan + " y hoy ya es " +
        pausaCambioDia.fechaNueva + ". " +
        "El guardado está en pausa: no se ha enviado nada " +
        "al día nuevo ni se ha perdido ningún cambio." +
        (
            afectados.length
                ? " Pendientes: " + afectados.join(", ") + "."
                : ""
        );

    cuerpo.style.cssText =
        "margin:0 0 16px;line-height:1.5;";


    function crearBoton(texto, estilos) {

        const boton =
            document.createElement("button");

        boton.type = "button";

        boton.textContent = texto;

        boton.style.cssText =
            "display:block;width:100%;margin:8px 0 0;" +
            "padding:10px 12px;border-radius:8px;cursor:pointer;" +
            "font-size:15px;" + estilos;


        return boton;
    }


    const botonGuardar =
        crearBoton(
            "Guardar cambios en el " + pausaCambioDia.fechaPlan,
            "background:#1976d2;color:#fff;border:1px solid #1976d2;"
        );

    botonGuardar.addEventListener(
        "click",
        function() {

            reanudarGuardadoPausado();
        }
    );


    const botonDescartar =
        crearBoton(
            "Descartar cambios y cargar el " + pausaCambioDia.fechaNueva,
            "background:#fff;color:#c62828;border:1px solid #c62828;"
        );

    botonDescartar.addEventListener(
        "click",
        function() {

            mostrarConfirmacionDescarte();
        }
    );


    const botonPausa =
        crearBoton(
            "Seguir en pausa (recomendado)",
            "background:#eee;color:#222;border:1px solid #bbb;"
        );

    botonPausa.addEventListener(
        "click",
        function() {

            cerrarDialogoCambioDia();
        }
    );


    fondo.addEventListener(
        "keydown",
        function(evento) {

            if (
                evento &&
                evento.key === "Escape"
            ) {

                cerrarDialogoCambioDia();
            }
        }
    );


    panel.appendChild(titulo);

    panel.appendChild(cuerpo);

    panel.appendChild(botonGuardar);

    panel.appendChild(botonDescartar);

    panel.appendChild(botonPausa);

    fondo.appendChild(panel);

    document.body.appendChild(fondo);


    /*
     * FASE 3F.6.6-B3 · la marca solo se activa cuando el
     * diálogo ya existe en el DOM: si algo anterior fallara,
     * el siguiente tick puede reintentarlo.
     */
    pausaCambioDia.dialogoMostrado = true;


    try {

        botonPausa.focus();

    } catch (error) {
        /* foco opcional: no interrumpe */
    }
}


function mostrarConfirmacionDescarte() {

    if (!pausaCambioDia) {

        return;
    }


    cerrarDialogoCambioDia();


    const pendientes =
        Object.keys(planificacionDia || {}).filter(
            function(vehiculoId) {

                const plan =
                    planificacionDia[vehiculoId];


                return (
                    !!plan &&
                    plan.modificado === true
                );
            }
        );


    const fondo =
        document.createElement("div");

    fondo.id = "dialogo-confirmar-descarte";

    fondo.setAttribute("role", "alertdialog");

    fondo.setAttribute("aria-modal", "true");

    fondo.style.cssText =
        "position:fixed;inset:0;z-index:10000;" +
        "background:rgba(0,0,0,0.65);display:flex;" +
        "align-items:center;justify-content:center;padding:16px;";


    const panel =
        document.createElement("div");

    panel.style.cssText =
        "background:#fff;color:#222;max-width:520px;width:100%;" +
        "border-radius:12px;padding:20px 22px;" +
        "font-family:inherit;box-shadow:0 12px 40px rgba(0,0,0,0.4);";


    const titulo =
        document.createElement("h2");

    titulo.textContent = "Confirmar descarte";

    titulo.style.cssText =
        "margin:0 0 8px;font-size:20px;color:#c62828;";


    const cuerpo =
        document.createElement("p");

    cuerpo.textContent =
        "Esta acción es destructiva: se perderán los cambios " +
        "pendientes (" + pendientes.length + " planificaciones) " +
        "y se cargará la planificación del " +
        pausaCambioDia.fechaNueva + ".";

    cuerpo.style.cssText =
        "margin:0 0 12px;line-height:1.5;";


    const etiqueta =
        document.createElement("label");

    etiqueta.style.cssText =
        "display:flex;gap:8px;align-items:flex-start;" +
        "margin:0 0 12px;line-height:1.4;cursor:pointer;";


    const casilla =
        document.createElement("input");

    casilla.type = "checkbox";


    const textoCasilla =
        document.createElement("span");

    textoCasilla.textContent =
        "Entiendo que los cambios pendientes se perderán.";


    etiqueta.appendChild(casilla);

    etiqueta.appendChild(textoCasilla);


    const botonConfirmar =
        document.createElement("button");

    botonConfirmar.type = "button";

    botonConfirmar.textContent =
        "Descartar definitivamente";

    botonConfirmar.disabled = true;

    botonConfirmar.style.cssText =
        "display:block;width:100%;margin:8px 0 0;" +
        "padding:10px 12px;border-radius:8px;cursor:pointer;" +
        "font-size:15px;background:#c62828;color:#fff;" +
        "border:1px solid #c62828;";


    casilla.addEventListener(
        "change",
        function() {

            botonConfirmar.disabled = !casilla.checked;
        }
    );

    botonConfirmar.addEventListener(
        "click",
        function() {

            if (!casilla.checked) {

                return;
            }


            descartarCambiosYCargarDiaNuevo();
        }
    );


    const botonVolver =
        document.createElement("button");

    botonVolver.type = "button";

    botonVolver.textContent = "Volver (seguir en pausa)";

    botonVolver.style.cssText =
        "display:block;width:100%;margin:8px 0 0;" +
        "padding:10px 12px;border-radius:8px;cursor:pointer;" +
        "font-size:15px;background:#eee;color:#222;" +
        "border:1px solid #bbb;";

    botonVolver.addEventListener(
        "click",
        function() {

            cerrarDialogoCambioDia();

            mostrarDialogoCambioDia();
        }
    );


    fondo.addEventListener(
        "keydown",
        function(evento) {

            if (
                evento &&
                evento.key === "Escape"
            ) {

                cerrarDialogoCambioDia();

                mostrarDialogoCambioDia();
            }
        }
    );


    panel.appendChild(titulo);

    panel.appendChild(cuerpo);

    panel.appendChild(etiqueta);

    panel.appendChild(botonConfirmar);

    panel.appendChild(botonVolver);

    fondo.appendChild(panel);

    document.body.appendChild(fondo);


    /*
     * FASE 3F.6.6-B3 · igual que en el diálogo principal: la
     * marca solo se activa con el diálogo ya en el DOM.
     */
    if (pausaCambioDia) {

        pausaCambioDia.dialogoMostrado = true;
    }


    try {

        botonVolver.focus();

    } catch (error) {
        /* foco opcional: no interrumpe */
    }
}


function actualizarBannerCambioDia(contenedor) {

    let texto = null;

    let estilos = "";


    if (bloqueoGlobalMarcas) {

        texto =
            (
                bloqueoGlobalMarcas.mensaje ||
                "Registro de borrados ilegible."
            ) +
            " Guardados bloqueados: pulsa este aviso " +
            "para descartarlo explícitamente.";

        estilos =
            "background:#ffebee;border:1px solid #c62828;" +
            "color:#7f1d1d;";

    } else if (pausaCambioDia) {

        texto =
            "Cambio de día: estás editando el plan del " +
            pausaCambioDia.fechaPlan + " (hoy es " +
            pausaCambioDia.fechaNueva + "). " +
            "Guardado en pausa hasta tu decisión.";

        estilos =
            "background:#fff4df;border:1px solid #e6a817;" +
            "color:#7a5200;";

    } else if (falloRecargaDia) {

        texto =
            falloRecargaDia.mensaje + " " +
            "Guardado bloqueado hasta reintentar: " +
            "pulsa este aviso.";

        estilos =
            "background:#ffebee;border:1px solid #c62828;" +
            "color:#7f1d1d;";

    } else if (!fechaServidor) {

        texto =
            "Fecha del servidor desconocida: " +
            "el guardado está bloqueado.";

        estilos =
            "background:#ffebee;border:1px solid #c62828;" +
            "color:#7f1d1d;";
    }


    const existente =
        document.getElementById(
            "bloqueo-cambio-dia"
        );


    if (!texto) {

        if (
            existente &&
            existente.parentNode
        ) {

            existente.parentNode.removeChild(existente);
        }


        return;
    }


    const elemento =
        existente ||
        document.createElement("div");


    elemento.id = "bloqueo-cambio-dia";

    elemento.setAttribute("role", "alert");

    elemento.textContent = texto;

    elemento.style.cssText =
        "margin:8px 0;padding:10px 12px;border-radius:8px;" +
        "font-weight:600;" + estilos;


    if (!existente) {

        /*
         * FASE 3F.6.6-B2 · el aviso es la vía para retomar la
         * decisión: al pulsarlo se reabre el diálogo. El
         * elemento persiste entre renders: el listener se
         * registra una sola vez.
         */

        elemento.style.cursor = "pointer";

        elemento.title =
            "Pulsar para retomar la decisión";

        elemento.addEventListener(
            "click",
            function() {

                if (bloqueoGlobalMarcas) {

                    /*
                     * FASE 3F.6.7-C4-B · descarte explícito del
                     * bloqueo global (única vía de salida; no
                     * hay reconstrucción automática posible).
                     */
                    descartarBloqueoGlobalMarcas();

                } else if (pausaCambioDia) {

                    pausaCambioDia.dialogoMostrado =
                        false;

                    mostrarDialogoCambioDia();

                } else if (falloRecargaDia) {

                    /*
                     * FASE 3F.6.6-B3 · ME-1: reintento explícito
                     * del usuario. Se levanta el veto de "ya
                     * intentado hoy" una sola vez por clic: sin
                     * bucles automáticos. Después se rearma lo
                     * pendiente (si la evaluación no pausó) y se
                     * repinta, para no dejar avisos obsoletos.
                     */
                    falloRecargaDia = null;

                    ultimoDiaRecargaIntentada = "";

                    evaluarCambioDia();

                    renderizarPlanificacion();

                    Object.keys(planificacionDia || {}).forEach(
                        function(vehiculoId) {

                            const plan =
                                planificacionDia[vehiculoId];


                            if (
                                plan &&
                                plan.modificado === true
                            ) {

                                programarAutosave(plan);
                            }
                        }
                    );
                }
            }
        );


        if (
            contenedor &&
            contenedor.parentNode
        ) {

            contenedor.parentNode.insertBefore(
                elemento,
                contenedor
            );
        }
    }
}



/* ============================================================
   FASE 3F.6.7-C2 · BORRADO EXPLICITO DE PLANIFICACION
   ------------------------------------------------------------
   - Estado por vehiculo: solicitado / enviado / confirmado /
     error / desconocido. Solo el usuario lo crea y lo cierra.
   - Mientras haya bloqueo activo, NINGUNA via de guardado
     (debounce, cola, retry, recuperacion, manual) emite para
     ese vehiculo: todas las guardas lo comprueban.
   - Las respuestas tardias de guardado se invalidan por
     generacion: un POST iniciado antes del borrado nunca
     declara limpio ni rearma nada.
   - El borrado usa fecha congelada (la de pertenencia del
     plan) y confirmacion explicita del servidor.
============================================================ */

let bloqueosBorrado = {};

let generacionEnvioPorVehiculo = {};


function bloqueoBorradoActivo(vehiculoId) {

    /*
     * FASE 3F.6.7-C4-B · el bloqueo global por marcas
     * ilegibles cubre todos los vehículos: punto único por
     * el que pasan las 11 guardas de envío.
     */
    if (bloqueoGlobalMarcas) {

        return bloqueoGlobalMarcas;
    }


    const bloqueo =
        bloqueosBorrado[String(vehiculoId)];


    if (!bloqueo) {

        return null;
    }


    if (
        bloqueo.fase === "solicitado" ||
        bloqueo.fase === "enviado" ||
        bloqueo.fase === "desconocido" ||
        bloqueo.fase === "error"
    ) {

        return bloqueo;
    }


    return null;
}


function obtenerEstadoBorrado(vehiculoId) {

    const bloqueo =
        bloqueosBorrado[String(vehiculoId)];


    if (!bloqueo) {

        return {
            fase: "ninguno"
        };
    }


    return {
        fase: bloqueo.fase,
        fecha: bloqueo.fecha,
        vehiculoId: bloqueo.vehiculoId,
        eliminadas:
            bloqueo.eliminadas === undefined
                ? null
                : bloqueo.eliminadas,
        mensaje: bloqueo.mensaje || "",
        cambiosPosteriores:
            bloqueo.cambiosPosteriores === true,
        envioIniciado:
            bloqueo.envioIniciado === true
    };
}


function descartarBloqueoBorrado(vehiculoId) {

    /*
     * Descarte EXPLICITO por el usuario (botón de la UI):
     * cierra el estado sin tocar datos. No se usa nunca de
     * forma automática.
     */

    const id = String(vehiculoId);

    if (bloqueosBorrado[id]) {

        delete bloqueosBorrado[id];
    }


    renderizarPlanificacion();


    if (
        typeof actualizarZonaBorrado ===
            "function"
    ) {

        try {

            actualizarZonaBorrado();

        } catch (error) {
            /* solo presentación: no interrumpe */
        }
    }
}


/* ============================================================
   FASE 3F.6.7-C4-C · DESCARTE DIFERENCIADO DEL BLOQUEO
   ------------------------------------------------------------
   - evaluarDescarteBloqueo decide, SIN efectos, si basta el
     descarte ordinario o se exige confirmación reforzada.
   - Solo el descarte ordinario (sin envío posible) usa
     descartarBloqueoBorrado directamente.
   - La confirmación reforzada revalida el estado en el
     momento del clic, limpia la marca persistida ANTES de
     liberar el bloqueo en memoria, y nunca se ejecuta dos
     veces (guardia anti-doble-clic).
============================================================ */

let dialogoDescarteAbiertoPor = null;

let confirmacionDescarteEnCurso = false;


function evaluarDescarteBloqueo(vehiculoId) {

    /*
     * Lectura pura: no crea, modifica ni cierra nada. Devuelve
     * si el descarte necesita la confirmación reforzada y una
     * instantánea para el diálogo.
     */

    const id = String(vehiculoId);

    const bloqueo =
        bloqueosBorrado[id];


    if (!bloqueo) {

        return {
            ok: false,
            error: "Sin bloqueo para este vehículo."
        };
    }


    const contexto = {

        fase: bloqueo.fase,

        fecha: bloqueo.fecha,

        vehiculoId: id,

        mensaje: bloqueo.mensaje || ""
    };


    if (bloqueo.fase === "confirmado") {

        return {
            ok: true,
            requiereConfirmacion: false,
            contexto: contexto
        };
    }


    if (
        bloqueo.fase === "error" &&
        bloqueo.envioIniciado !== true
    ) {

        return {
            ok: true,
            requiereConfirmacion: false,
            contexto: contexto
        };
    }


    if (
        bloqueo.fase === "desconocido" ||
        bloqueo.fase === "error" ||
        bloqueo.fase === "solicitado" ||
        bloqueo.fase === "enviado"
    ) {

        return {
            ok: true,
            requiereConfirmacion: true,
            contexto: contexto
        };
    }


    return {
        ok: false,
        error: "Estado no descartable."
    };
}


function cerrarDialogoDescarteBorrado() {

    const existente =
        document.getElementById(
            "dialogo-descarte-borrado"
        );


    if (
        existente &&
        existente.parentNode
    ) {

        existente.parentNode.removeChild(existente);
    }


    if (
        dialogoDescarteAbiertoPor !== null &&
        !document.getElementById(
            "dialogo-descarte-borrado"
        )
    ) {

        dialogoDescarteAbiertoPor = null;
    }
}


function mostrarDialogoDescarteBorrado(vehiculoId) {

    const evaluacion =
        evaluarDescarteBloqueo(vehiculoId);


    if (
        !evaluacion.ok ||
        evaluacion.requiereConfirmacion !== true
    ) {

        return evaluacion;
    }


    if (
        typeof document === "undefined" ||
        !document.body
    ) {

        return {
            ok: false,
            error: "Sin documento para mostrar el diálogo."
        };
    }


    if (dialogoDescarteAbiertoPor !== null) {

        return {
            ok: false,
            error: "Ya hay un diálogo de descarte abierto."
        };
    }


    const contexto =
        evaluacion.contexto;

    const id =
        contexto.vehiculoId;


    const fondo =
        document.createElement("div");

    fondo.id = "dialogo-descarte-borrado";

    fondo.setAttribute("role", "alertdialog");

    fondo.setAttribute("aria-modal", "true");

    fondo.style.cssText =
        "position:fixed;inset:0;z-index:10003;" +
        "background:rgba(0,0,0,0.65);display:flex;" +
        "align-items:center;justify-content:center;padding:16px;";


    const panel =
        document.createElement("div");

    panel.style.cssText =
        "background:#fff;color:#222;max-width:520px;width:100%;" +
        "border-radius:12px;padding:20px 22px;" +
        "font-family:inherit;box-shadow:0 12px 40px rgba(0,0,0,0.4);";


    const titulo =
        document.createElement("h2");

    titulo.textContent =
        "Liberar el bloqueo con resultado desconocido";

    titulo.style.cssText =
        "margin:0 0 8px;font-size:20px;color:#c62828;";


    const cuerpo =
        document.createElement("p");

    cuerpo.textContent =
        "El resultado del borrado sigue siendo desconocido. " +
        "El servidor podría haberlo ejecutado, y una petición " +
        "anterior podría terminar más tarde. Si liberas el " +
        "bloqueo, los guardados podrían volver a crear o " +
        "sobrescribir la planificación. Esta acción no " +
        "comprueba ni garantiza el estado del servidor.";

    cuerpo.style.cssText =
        "margin:0 0 12px;line-height:1.5;";


    const detalle =
        document.createElement("p");

    detalle.textContent =
        "Vehículo " + id +
        " · fecha " + contexto.fecha + ".";

    detalle.style.cssText =
        "margin:0 0 12px;line-height:1.4;font-weight:600;";


    const etiqueta =
        document.createElement("label");

    etiqueta.style.cssText =
        "display:flex;gap:8px;align-items:flex-start;" +
        "margin:0 0 12px;line-height:1.4;cursor:pointer;";


    const casilla =
        document.createElement("input");

    casilla.type = "checkbox";


    const textoCasilla =
        document.createElement("span");

    textoCasilla.textContent =
        "Entiendo el riesgo y libero el bloqueo bajo mi responsabilidad.";


    etiqueta.appendChild(casilla);

    etiqueta.appendChild(textoCasilla);


    const botonConfirmar =
        document.createElement("button");

    botonConfirmar.type = "button";

    botonConfirmar.textContent =
        "Liberar el bloqueo, acepto el riesgo";

    botonConfirmar.disabled = true;

    botonConfirmar.style.cssText =
        "display:block;width:100%;margin:8px 0 0;" +
        "padding:10px 12px;border-radius:8px;cursor:pointer;" +
        "font-size:15px;background:#c62828;color:#fff;" +
        "border:1px solid #c62828;";


    casilla.addEventListener(
        "change",
        function() {

            botonConfirmar.disabled = !casilla.checked;
        }
    );

    botonConfirmar.addEventListener(
        "click",
        function() {

            if (!casilla.checked) {

                return;
            }


            botonConfirmar.disabled = true;


            confirmarDescarteBorrado(id);
        }
    );


    const botonCancelar =
        document.createElement("button");

    botonCancelar.type = "button";

    botonCancelar.textContent =
        "Cancelar (mantener el bloqueo)";

    botonCancelar.style.cssText =
        "display:block;width:100%;margin:8px 0 0;" +
        "padding:10px 12px;border-radius:8px;cursor:pointer;" +
        "font-size:15px;background:#eee;color:#222;" +
        "border:1px solid #bbb;";

    botonCancelar.addEventListener(
        "click",
        function() {

            cerrarDialogoDescarteBorrado();
        }
    );


    fondo.addEventListener(
        "click",
        function(evento) {

            if (
                evento &&
                evento.target === fondo
            ) {

                cerrarDialogoDescarteBorrado();
            }
        }
    );


    fondo.addEventListener(
        "keydown",
        function(evento) {

            if (
                evento &&
                evento.key === "Escape"
            ) {

                cerrarDialogoDescarteBorrado();
            }
        }
    );


    panel.appendChild(titulo);

    panel.appendChild(cuerpo);

    panel.appendChild(detalle);

    panel.appendChild(etiqueta);

    panel.appendChild(botonConfirmar);

    panel.appendChild(botonCancelar);

    fondo.appendChild(panel);

    document.body.appendChild(fondo);

    dialogoDescarteAbiertoPor = id;


    try {

        botonCancelar.focus();

    } catch (error) {
        /* foco opcional */
    }


    return {
        ok: true,
        abierto: true
    };
}


function confirmarDescarteBorrado(vehiculoId) {

    const id = String(vehiculoId);


    /*
     * Guardia anti-doble-clic y anti-doble-envío: una sola
     * confirmación en curso en toda la sesión.
     */
    if (confirmacionDescarteEnCurso) {

        return {
            ok: false,
            error: "Confirmación ya en curso."
        };
    }


    confirmacionDescarteEnCurso = true;


    try {

        /*
         * Revalidación en el momento del clic: si el estado
         * ya no exige confirmación reforzada (p. ej. una
         * respuesta tardía resolvió mientras el diálogo
         * estaba abierto), no se libera nada ambiguo.
         */
        const evaluacion =
            evaluarDescarteBloqueo(id);


        if (
            !evaluacion.ok ||
            evaluacion.requiereConfirmacion !== true
        ) {

            cerrarDialogoDescarteBorrado();

            renderizarPlanificacion();

            if (
                typeof actualizarZonaBorrado ===
                    "function"
            ) {

                try {

                    actualizarZonaBorrado();

                } catch (error) {
                    /* solo presentación */
                }
            }


            return {
                ok: false,
                error:
                    evaluacion.error ||
                    "El estado cambió: revise antes de liberar."
            };
        }


        /*
         * La marca persistida se elimina ANTES de liberar el
         * bloqueo en memoria: si falla, todo sigue bloqueado
         * (comportamiento seguro).
         */
        if (!limpiarMarcaBorrado(id)) {

            return {
                ok: false,
                error: "No se pudo actualizar el registro: bloqueo conservado."
            };
        }


        descartarBloqueoBorrado(id);

        cerrarDialogoDescarteBorrado();


        return {
            ok: true,
            liberado: true
        };

    } finally {

        confirmacionDescarteEnCurso = false;
    }
}



function buscarBloqueEnDatos(datos, fecha, vehiculoId) {

    /*
     * ¿Existe el bloque fecha+vehículo en una respuesta tipo
     * accion=todo? Los grupos del backend no siempre traen
     * fecha propia: si la traen se exige coincidencia; si no,
     * solo se comprueba el vehículo (la respuesta ya viene
     * filtrada por el día efectivo del servidor).
     */

    if (
        !datos ||
        typeof datos !== "object" ||
        !Array.isArray(datos.planificacion)
    ) {

        return null;
    }


    const id = String(vehiculoId);

    const encontrado =
        datos.planificacion.some(
            function(grupo) {

                if (!grupo || typeof grupo !== "object") {

                    return false;
                }


                const coincideVehiculo =
                    String(
                        grupo.vehiculo_id !== undefined &&
                        grupo.vehiculo_id !== null
                            ? grupo.vehiculo_id
                            : grupo.vehiculo !== undefined &&
                              grupo.vehiculo !== null
                                ? grupo.vehiculo
                                : ""
                    ) === id;


                if (!coincideVehiculo) {

                    return false;
                }


                if (
                    grupo.fecha !== undefined &&
                    grupo.fecha !== null &&
                    grupo.fecha !== ""
                ) {

                    return String(grupo.fecha) === String(fecha);
                }


                return true;
            }
        );


    return encontrado;
}


function carrilLibreParaVehiculo(vehiculoId) {

    const id = String(vehiculoId);


    if (vehiculoAutosaveEnCurso === id) {

        return false;
    }


    if (
        guardandoPlanificacion === true &&
        String(vehiculoGuardandoPlanificacion) === id
    ) {

        return false;
    }


    return true;
}


async function esperarCarrilLibreVehiculo(vehiculoId, maxMs) {

    const limite =
        typeof maxMs === "number" && maxMs > 0
            ? maxMs
            : 20000;

    const inicio = Date.now();


    while (!carrilLibreParaVehiculo(vehiculoId)) {

        if (Date.now() - inicio > limite) {

            return false;
        }


        await new Promise(
            function(resolver) {
                window.setTimeout(resolver, 200);
            }
        );
    }


    return true;
}


function limpiarEstadoLocalTrasBorrado(id, conservarEdiciones) {

    const plan =
        planificacionDia[id];


    if (plan) {

        /*
         * BLOQUE 6 · el servidor ya no tiene este plan. Nunca
         * debe conservarse un estado visual de "guardado",
         * aunque las paradas locales se mantengan por ediciones
         * posteriores.
         */
        plan.tienePlanGuardado =
            false;


        if (conservarEdiciones !== true) {

            plan.paradas = [];

            plan.modificado = false;
        }
    }


    /*
     * BLOQUE 6 · un feedback "Planificación guardada" anterior
     * no puede sobrevivir al borrado confirmado del plan.
     */
    if (
        String(
            estadoFeedbackGuardadoPlanificacion.vehiculoId
        ) === String(id)
    ) {

        limpiarFeedbackGuardadoPlanificacion();
    }


    if (estadoVersionesAutosave[id]) {

        delete estadoVersionesAutosave[id];
    }


    reiniciarRecuperacionVehiculo(id);


    colaAutosave =
        colaAutosave.filter(
            function(entrada) {
                return String(entrada) !== String(id);
            }
        );
}


function refrescarTrasBorrado() {

    renderizarPlanificacion();


    if (
        typeof dibujarAvisos ===
        "function"
    ) {

        dibujarAvisos();
    }


    if (
        typeof actualizarZonaBorrado ===
            "function"
    ) {

        try {

            actualizarZonaBorrado();

        } catch (error) {
            /* solo presentación: no interrumpe */
        }
    }
}


async function solicitarBorradoPlanificacion(vehiculoId) {

    const id = String(vehiculoId);

    const plan =
        planificacionDia[id];


    if (!plan) {

        return {
            ok: false,
            error: "Planificación no encontrada"
        };
    }


    const fecha =
        fechaPertenenciaPlan(plan);


    if (!fecha) {

        return {
            ok: false,
            error: "Fecha de la planificación desconocida: borrado bloqueado."
        };
    }


    if (bloqueoBorradoActivo(id)) {

        return {
            ok: false,
            error: "Ya hay un borrado en curso para este vehículo."
        };
    }


    /*
     * Instantánea para detectar ediciones concurrentes: toda
     * mutación pasa por marcarPlanificacionModificada y sube
     * versionModificacion; la identidad del objeto detecta
     * reconstrucciones (recargas) intermedias.
     */
    const versionBase =
        Number(plan.versionModificacion) || 0;


    bloqueosBorrado[id] = {

        fase: "solicitado",

        fecha:
            fecha,

        vehiculoId:
            id,

        generacionEnvioAlSolicitar:
            Number(generacionEnvioPorVehiculo[id]) || 0,

        versionBase:
            versionBase,

        mensaje: "",

        eliminadas: null,

        cambiosPosteriores: false
    };


    /*
     * FASE 3F.6.7-C4-B · la marca se escribe ANTES de
     * cualquier espera o envío: si el almacenamiento falla,
     * el borrado no se envía y queda un error persistente.
     */
    if (!persistirMarcaBorrado(id)) {

        bloqueosBorrado[id].fase = "error";

        bloqueosBorrado[id].mensaje =
            "No se pudo registrar el borrado de forma " +
            "segura: no enviado. Vuelva a intentarlo.";


        refrescarTrasBorrado();


        return {
            ok: false,
            error: bloqueosBorrado[id].mensaje
        };
    }


    cancelarEsperasAutosave(id);

    colaAutosave =
        colaAutosave.filter(
            function(entrada) {
                return String(entrada) !== String(id);
            }
        );


    refrescarTrasBorrado();


    /*
     * Un temporizador cancelado no cancela una petición ya
     * enviada: si hay un POST de guardado en curso para este
     * vehículo, se espera a que termine (con tope) antes de
     * enviar el borrado.
     */
    const carrilLibre =
        await esperarCarrilLibreVehiculo(id, 20000);


    if (!carrilLibre) {

        bloqueosBorrado[id].fase = "error";

        bloqueosBorrado[id].mensaje =
            "Hay un guardado en curso que no termina; " +
            "vuelva a intentarlo.";


        refrescarTrasBorrado();


        return {
            ok: false,
            error: bloqueosBorrado[id].mensaje
        };
    }


    /*
     * Si el estado cambió durante la espera (el vuelo
     * anterior o el usuario), la confirmación previa ya no
     * cubre la situación: se exige nueva confirmación.
     */
    const planTrasEspera =
        planificacionDia[id];


    if (
        !planTrasEspera ||
        planTrasEspera !== plan ||
        (
            Number(planTrasEspera.versionModificacion) || 0
        ) !== versionBase
    ) {

        refrescarTrasBorrado();


        return {
            ok: false,
            necesitaReconfirmacion: true,
            error: "La planificación ha cambiado durante la espera: confirme de nuevo."
        };
    }


    /*
     * Envío con fecha y vehículo congelados: nunca se
     * recalculan ni se toman del re loj local.
     */
    bloqueosBorrado[id].fase = "enviado";

    refrescarTrasBorrado();


    /*
     * FASE 3F.6.7-C4-B · la marca acompaña cada transición:
     * si no puede persistirse el envío, no se envía.
     */
    if (!persistirMarcaBorrado(id)) {

        bloqueosBorrado[id].fase = "error";

        bloqueosBorrado[id].mensaje =
            "No se pudo registrar el borrado de forma " +
            "segura: no enviado. Vuelva a intentarlo.";


        refrescarTrasBorrado();


        return {
            ok: false,
            error: bloqueosBorrado[id].mensaje
        };
    }


    const payload = {

        accion: "eliminar_planificacion",

        fecha:
            bloqueosBorrado[id].fecha,

        vehiculo_id:
            id,

        confirmar_borrado:
            true
    };


    /*
     * FASE 3F.6.7-C4-C · a partir de aquí la petición puede
     * llegar al servidor aunque la respuesta se pierda: los
     * errores posteriores a este punto se tratan como
     * potencialmente ejecutados.
     */
    bloqueosBorrado[id].envioIniciado = true;


    let resultado = null;

    try {

        resultado =
            await API.eliminarPlanificacion(payload);

    } catch (error) {

        resultado = {
            ok: false,
            error:
                String(
                    (error && error.message) || error
                )
        };
    }


    const bloqueo =
        bloqueosBorrado[id];


    if (!bloqueo) {

        return {
            ok: false,
            error: "Borrado descartado durante el envío."
        };
    }


    if (
        resultado &&
        resultado.ok === true &&
        resultado.accion === "eliminar_planificacion" &&
        typeof resultado.eliminadas === "number"
    ) {

        /*
         * Ediciones durante el vuelo: el servidor ya borró
         * por clave; las ediciones nuevas se CONSERVAN
         * pendientes y se exige decisión explícita. Nunca
         * se limpian silenciosamente.
         */
        const planFinal =
            planificacionDia[id];

        const versionFinal =
            planFinal
                ? Number(planFinal.versionModificacion) || 0
                : -1;


        if (
            !planFinal ||
            planFinal !== plan ||
            versionFinal !== versionBase
        ) {

            /*
             * BLOQUE 6 · el servidor borró el plan; las
             * ediciones locales se conservan, pero ya no son
             * una planificación persistida.
             */
            if (planFinal) {

                planFinal.tienePlanGuardado =
                    false;
            }


            if (
                String(
                    estadoFeedbackGuardadoPlanificacion.vehiculoId
                ) === String(id)
            ) {

                limpiarFeedbackGuardadoPlanificacion();
            }


            bloqueo.fase = "confirmado";

            bloqueo.eliminadas = resultado.eliminadas;

            bloqueo.cambiosPosteriores = true;

            bloqueo.mensaje =
                "Borrado confirmado en el servidor, pero hay " +
                "cambios posteriores sin guardar: consérvelos " +
                "o descártelos explícitamente.";


            limpiarMarcaBorrado(id);


            refrescarTrasBorrado();


            return {
                ok: true,
                confirmado: true,
                cambiosPosteriores: true,
                eliminadas: resultado.eliminadas
            };
        }


        limpiarEstadoLocalTrasBorrado(id, false);

        bloqueo.fase = "confirmado";

        bloqueo.eliminadas = resultado.eliminadas;

        bloqueo.mensaje =
            resultado.eliminadas > 0
                ? "Planificación eliminada correctamente."
                : "No había planificación para esa fecha y vehículo (sin cambios).";


        limpiarMarcaBorrado(id);


        refrescarTrasBorrado();


        return {
            ok: true,
            confirmado: true,
            cambiosPosteriores: false,
            eliminadas: resultado.eliminadas
        };
    }


    if (
        resultado &&
        resultado.timeout === true
    ) {

        bloqueo.fase = "desconocido";

        bloqueo.mensaje =
            "El borrado puede haberse ejecutado (sin respuesta " +
            "del servidor). Reconciliando con el servidor…";


        refrescarTrasBorrado();


        const reconciliado =
            await reconciliarBorrado(id);


        return {
            ok: Boolean(
                reconciliado &&
                reconciliado.resuelto === true
            ),
            desconocido: true,
            reconciliacion: reconciliado
        };
    }


    bloqueo.fase = "error";

    bloqueo.mensaje =
        (
            resultado &&
            resultado.error
        ) ||
        "Error eliminando la planificación.";


    refrescarTrasBorrado();


    return {
        ok: false,
        error: bloqueo.mensaje
    };
}


async function reconciliarBorrado(vehiculoId) {

    const id = String(vehiculoId);

    const bloqueo =
        bloqueosBorrado[id];


    if (
        !bloqueo ||
        bloqueo.fase !== "desconocido"
    ) {

        return {
            ok: false,
            error: "No hay reconciliación pendiente."
        };
    }


    /*
     * Sin carril libre para este vehículo no se puede
     * afirmar nada: una petición antigua aún podría estar
     * en vuelo y recrear el plan después de leer.
     */
    if (!carrilLibreParaVehiculo(id)) {

        return {
            ok: false,
            resuelto: false,
            error: "Hay operaciones en curso; reintente la reconciliación."
        };
    }


    cancelarEsperasAutosave(id);


    const generacionAntes =
        Number(generacionEnvioPorVehiculo[id]) || 0;

    const planAntes =
        planificacionDia[id];

    const versionAntes =
        planAntes
            ? Number(planAntes.versionModificacion) || 0
            : -1;


    /*
     * La respuesta de todo viene filtrada por el día
     * efectivo del servidor: solo es concluyente si la
     * fecha del borrado coincide con la fecha efectiva.
     */
    const fechaHoy =
        fechaServidor;


    if (
        !fechaHoy ||
        fechaHoy !== bloqueo.fecha
    ) {

        bloqueo.mensaje =
            "No se puede reconciliar: la fecha del borrado " +
            "(" + bloqueo.fecha + ") no es el día efectivo " +
            "del servidor. Se requiere intervención explícita.";


        refrescarTrasBorrado();


        return {
            ok: false,
            resuelto: false,
            error: bloqueo.mensaje
        };
    }


    let datosPrimera = null;

    try {

        datosPrimera =
            await API.obtenerDatos();

    } catch (error) {

        return {
            ok: false,
            resuelto: false,
            error: "No se pudo leer el servidor para reconciliar."
        };
    }


    const ausentePrimera =
        !buscarBloqueEnDatos(
            datosPrimera,
            bloqueo.fecha,
            id
        );


    await new Promise(
        function(resolver) {
            window.setTimeout(resolver, 3000);
        }
    );


    /*
     * Si durante la espera se envió algo para este vehículo
     * o cambió el plan, la lectura anterior ya no vale.
     */
    const planDespues =
        planificacionDia[id];

    const versionDespues =
        planDespues
            ? Number(planDespues.versionModificacion) || 0
            : -2;


    if (
        (
            Number(generacionEnvioPorVehiculo[id]) || 0
        ) !== generacionAntes ||
        planDespues !== planAntes ||
        versionDespues !== versionAntes
    ) {

        return {
            ok: false,
            resuelto: false,
            error: "Hubo actividad durante la reconciliación; se mantiene desconocido."
        };
    }


    let datosSegunda = null;

    try {

        datosSegunda =
            await API.obtenerDatos();

    } catch (error) {

        return {
            ok: false,
            resuelto: false,
            error: "No se pudo leer el servidor para reconciliar."
        };
    }


    const ausenteSegunda =
        !buscarBloqueEnDatos(
            datosSegunda,
            bloqueo.fecha,
            id
        );


    if (ausentePrimera && ausenteSegunda) {

        limpiarEstadoLocalTrasBorrado(id, false);

        bloqueo.fase = "confirmado";

        bloqueo.eliminadas = null;

        bloqueo.mensaje =
            "Reconciliación: la planificación ya no existe " +
            "en el servidor.";


        limpiarMarcaBorrado(id);


        refrescarTrasBorrado();


        return {
            ok: true,
            resuelto: true
        };
    }


    bloqueo.fase = "error";

    bloqueo.mensaje =
        "La planificación sigue existiendo en el servidor. " +
        "Puede reintentar el borrado o descartar el bloqueo.";


    refrescarTrasBorrado();


    return {
        ok: false,
        resuelto: false,
        error: bloqueo.mensaje
    };
}



/* ============================================================
   FASE 3F.6.7-C4-B · PERSISTENCIA DEL BLOQUEO DE BORRADO
   ------------------------------------------------------------
   - La marca vive en localStorage (clave versionada) y solo
     guarda fecha, vehiculo, fase y marca temporal: nunca
     payloads ni datos personales.
   - Se escribe ANTES de enviar; si no puede escribirse, el
     borrado no se envia.
   - Solo se elimina tras resolucion segura (confirmado) o
     nunca en automatico: el descarte explicito del usuario
     la deja (fail-closed documentado).
   - Al arrancar se recuperan los bloqueos ANTES de que
     cualquier via de guardado pueda emitir.
============================================================ */

const CLAVE_MARCAS_BORRADO = "crf-borrado-v1";

const ANTIGUEDAD_MAX_MARCA_MS =
    24 * 60 * 60 * 1000;

let bloqueoGlobalMarcas = null;

let recuperacionInicialBorradoHecha = false;


function leerRegistroMarcasBorrado() {

    let texto = null;

    try {

        texto =
            window.localStorage.getItem(
                CLAVE_MARCAS_BORRADO
            );

    } catch (error) {

        return {
            ok: false,
            error:
                String(
                    (error && error.message) || error
                )
        };
    }


    if (!texto) {

        return {
            ok: true,
            registro: null
        };
    }


    let registro = null;

    try {

        registro = JSON.parse(texto);

    } catch (error) {

        return {
            ok: false,
            error: "Registro ilegible."
        };
    }


    return {
        ok: true,
        registro: registro
    };
}


function validarMarcaBorrado(marca) {

    if (
        !marca ||
        typeof marca !== "object"
    ) {

        return {
            valida: false,
            motivo: "forma"
        };
    }


    if (marca.version !== 1) {

        return {
            valida: false,
            motivo: "version"
        };
    }


    if (
        typeof marca.fecha !== "string" ||
        !fechaServidorValidaRutas(marca.fecha)
    ) {

        return {
            valida: false,
            motivo: "fecha"
        };
    }


    if (
        typeof marca.vehiculoId !== "string" ||
        marca.vehiculoId.trim() === ""
    ) {

        return {
            valida: false,
            motivo: "vehiculo"
        };
    }


    if (
        marca.fase !== "solicitado" &&
        marca.fase !== "enviado" &&
        marca.fase !== "desconocido"
    ) {

        return {
            valida: false,
            motivo: "fase"
        };
    }


    if (
        typeof marca.ts !== "number" ||
        !(marca.ts > 0)
    ) {

        return {
            valida: false,
            motivo: "ts"
        };
    }


    return {
        valida: true,
        antigua:
            (Date.now() - marca.ts) >
            ANTIGUEDAD_MAX_MARCA_MS
    };
}


function persistirMarcaBorrado(vehiculoId) {

    const id = String(vehiculoId);

    const bloqueo =
        bloqueosBorrado[id];


    if (!bloqueo) {

        return true;
    }


    try {

        let registro = null;

        try {

            const texto =
                window.localStorage.getItem(
                    CLAVE_MARCAS_BORRADO
                );


            registro =
                texto
                    ? JSON.parse(texto)
                    : null;

        } catch (error) {

            registro = null;
        }


        if (
            !registro ||
            typeof registro !== "object" ||
            registro.version !== 1 ||
            !registro.marcas ||
            typeof registro.marcas !== "object"
        ) {

            registro = {
                version: 1,
                marcas: {}
            };
        }


        registro.marcas[id] = {

            version: 1,

            fase:
                bloqueo.fase === "desconocido" ||
                bloqueo.fase === "enviado"
                    ? bloqueo.fase
                    : "solicitado",

            fecha:
                bloqueo.fecha,

            vehiculoId:
                id,

            ts:
                Date.now()
        };


        window.localStorage.setItem(
            CLAVE_MARCAS_BORRADO,
            JSON.stringify(registro)
        );


        return true;

    } catch (error) {

        return false;
    }
}


function limpiarMarcaBorrado(vehiculoId) {

    const id = String(vehiculoId);


    try {

        const texto =
            window.localStorage.getItem(
                CLAVE_MARCAS_BORRADO
            );


        if (!texto) {

            return true;
        }


        const registro =
            JSON.parse(texto);


        if (
            registro &&
            registro.marcas &&
            registro.marcas[id]
        ) {

            delete registro.marcas[id];

            window.localStorage.setItem(
                CLAVE_MARCAS_BORRADO,
                JSON.stringify(registro)
            );
        }


        return true;

    } catch (error) {

        return false;
    }
}


function descartarBloqueoGlobalMarcas() {

    /*
     * Descarte EXPLICITO (aviso persistente): solo para el
     * bloqueo global por marcas ilegibles. Los bloqueos por
     * vehiculo usan descartarBloqueoBorrado.
     */

    bloqueoGlobalMarcas = null;

    renderizarPlanificacion();
}


function recuperarMarcasBorradoAlIniciar() {

    if (recuperacionInicialBorradoHecha) {

        return {
            recuperadas: 0,
            repetida: true
        };
    }


    recuperacionInicialBorradoHecha = true;


    const lectura =
        leerRegistroMarcasBorrado();


    if (!lectura.ok) {

        bloqueoGlobalMarcas = {

            motivo: "lectura",

            mensaje:
                "No se pudo leer el registro de borrados: " +
                "guardados bloqueados hasta resolver."
        };

        renderizarPlanificacion();


        return {
            recuperadas: 0,
            global: true
        };
    }


    const registro =
        lectura.registro;


    if (!registro) {

        return {
            recuperadas: 0
        };
    }


    if (
        !registro ||
        registro.version !== 1 ||
        !registro.marcas ||
        typeof registro.marcas !== "object"
    ) {

        bloqueoGlobalMarcas = {

            motivo: "version",

            mensaje:
                "Registro de borrados con formato desconocido: " +
                "guardados bloqueados hasta resolver."
        };

        renderizarPlanificacion();


        return {
            recuperadas: 0,
            global: true
        };
    }


    let recuperadas = 0;

    const pendientesReconciliar = [];


    Object.keys(registro.marcas).forEach(
        function(id) {

            const validacion =
                validarMarcaBorrado(
                    registro.marcas[id]
                );


            if (!validacion.valida) {

                bloqueoGlobalMarcas = {

                    motivo: "corrupta",

                    mensaje:
                        "Marca de borrado ilegible (" +
                        validacion.motivo + "): guardados " +
                        "bloqueados hasta resolver."
                };

                return;
            }


            const marca =
                registro.marcas[id];


            bloqueosBorrado[id] = {

                fase: "desconocido",

                fecha:
                    marca.fecha,

                vehiculoId:
                    id,

                generacionEnvioAlSolicitar:
                    Number(
                        generacionEnvioPorVehiculo[id]
                    ) || 0,

                versionBase: 0,

                mensaje:
                    "Borrado pendiente recuperado tras " +
                    "recarga (sin confirmación previa)." +
                    (
                        validacion.antigua
                            ? " Marca antigua: requiere " +
                              "intervención explícita."
                            : ""
                    ),

                eliminadas: null,

                cambiosPosteriores: false,

                recuperada: true
            };

            recuperadas++;


            if (
                fechaServidor &&
                marca.fecha === fechaServidor
            ) {

                pendientesReconciliar.push(id);
            }
        }
    );


    renderizarPlanificacion();


    pendientesReconciliar.forEach(
        function(id) {

            try {

                const resultado =
                    reconciliarBorrado(id);


                Promise.resolve(resultado).then(
                    function() {

                        refrescarTrasBorrado();
                    },
                    function() {

                        refrescarTrasBorrado();
                    }
                );

            } catch (error) {

                console.error(
                    "No se pudo iniciar la reconciliación de " +
                    id + ":",
                    error
                );
            }
        }
    );


    return {
        recuperadas: recuperadas,
        global: bloqueoGlobalMarcas !== null
    };
}



/* ============================================================
   FASE 3F.2.1 · MOTOR DE AUTOSAVE + DEBOUNCE
============================================================ */

/*
 * Duración del debounce. Se mide desde el ÚLTIMO cambio:
 * cualquier modificación cancela el temporizador anterior y
 * programa uno nuevo, de modo que una ráfaga de cambios
 * produce un único POST.
 */
const DURACION_DEBOUNCE_AUTOSAVE_MS = 3000;


/*
 * Estado interno del motor, SIEMPRE indexado por vehiculoId.
 * Separado del estado del guardado manual (guardandoPlanificacion,
 * vehiculoGuardandoPlanificacion, estadoFeedback...).
 *
 * - temporizadoresAutosave: debounce pendiente por vehículo.
 *   Como máximo uno por vehículo: nunca coexisten dos.
 * - colaAutosave: vehículos con guardado pendiente de carril.
 *   Sin duplicados: una única entrada lógica por vehículo.
 * - vehiculoAutosaveEnCurso: vehículo con el POST en vuelo
 *   (null = carril libre). UN SOLO POST de planificación a la
 *   vez, aunque haya varios temporizadores corriendo.
 */
const temporizadoresAutosave = {};


let colaAutosave = [];


let vehiculoAutosaveEnCurso = null;


/* ============================================================
   FASE 3F.2.3 · RECUPERACIÓN DEL AUTOSAVE
   (reintentos + backoff + online + visibilitychange)
=========================================================== */

/*
 * Nº máximo de intentos AUTOMÁTICOS consecutivos para un
 * mismo trabajo pendiente:
 *   intento 1 (inmediato) + 2 reintentos = 3 POSTs como máximo.
 */
const MAX_INTENTOS_AUTOSAVE = 3;


/*
 * Retraso (ms) centralizado programado ANTES de cada intento:
 *   intento 1 → 0 ms    (lo disparan el debounce / el guardado
 *                        manual / la cola; nunca este backoff)
 *   intento 2 → 3000 ms
 *   intento 3 → 10000 ms
 * Marco temporal desde el primer intento: t=0 → t=3000 → t=13000.
 * Ninguna otra función usa un setTimeout "disperso" para
 * reintentar: TODO pasa por aquí para poder cancelarse de
 * forma unificada.
 */
const RETRASOS_REINTENTO_AUTOSAVE_MS = [0, 3000, 10000];


/*
 * Estado de RECUPERACIÓN por vehículo. Índice estricto por
 * vehiculoId. NO almacena versiones (la fuente de verdad sigue
 * siendo estadoVersionesAutosave) ni payloads antiguos:
 *
 * - intento: nº del último intento automático iniciado.
 * - timerReintento: espera de backoff pendiente (null = no hay).
 * - esperandoRecuperacion: true mientras exista retry pendiente.
 * - pendienteDuranteVuelo: se activa cuando el debounce vence
 *   mientras el POST de ESE vehículo sigue en vuelo (§7 de la
 *   auditoría 3F.2.3): representación EXPLÍCITA de trabajo
 *   pendiente; nunca se pierde.
 * - origenReintento: el próximo arranque del vehículo contará
 *   como reintento (se conserva si acaba esperando en cola).
 */
const estadoRecuperacionAutosave = {};


function obtenerOCrearEstadoRecuperacion(vehiculoId) {

    const id = String(vehiculoId);

    if (!estadoRecuperacionAutosave[id]) {

        estadoRecuperacionAutosave[id] = {
            intento: 0,
            timerReintento: null,
            esperandoRecuperacion: false,
            pendienteDuranteVuelo: false,
            origenReintento: false
        };
    }

    return estadoRecuperacionAutosave[id];
}


/*
 * Cancela (si existe) la espera de backoff/retry de un vehículo.
 * Segura si se repite; nunca deja timers huérfanos.
 */
function cancelarReintentoAutosave(vehiculoId) {

    const id = String(vehiculoId);
    const estado = estadoRecuperacionAutosave[id];

    if (!estado) {
        return;
    }

    if (estado.timerReintento !== null) {

        window.clearTimeout(estado.timerReintento);
    }

    estado.timerReintento = null;
    estado.esperandoRecuperacion = false;
}


/*
 * Cancelación CENTRALIZADA de esperas por vehículo (§18):
 * debounce + retry/backoff. Idempotente.
 */
function cancelarEsperasAutosave(vehiculoId) {

    cancelarDebounceAutosave(vehiculoId);
    cancelarReintentoAutosave(vehiculoId);
}


/*
 * Reinicia el ciclo de recuperación de un vehículo: cancela
 * TODAS sus esperas (debounce y retry) y pone a cero sus
 * contadores. Empleada cuando el trabajo deja de estar
 * pendiente o cuando un guardado MANUAL toma el control.
 */
function reiniciarRecuperacionVehiculo(vehiculoId) {

    const id = String(vehiculoId);

    cancelarEsperasAutosave(id);

    const estado = estadoRecuperacionAutosave[id];

    if (!estado) {
        return;
    }

    estado.intento = 0;
    estado.pendienteDuranteVuelo = false;
    estado.origenReintento = false;
}


/*
 * Programa el SIGUIENTE intento automático tras un fallo
 * (error o timeout de 15 s), con el backoff centralizado.
 *
 * - Un SOLO retry pendiente por vehículo: jamás se duplica.
 * - Cancela el debounce del vehículo: la espera de backoff es
 *   la ÚNICA espera del vehículo mientras dure la recuperación.
 * - No programa nada si se agotaron los intentos (§15): el
 *   trabajo queda visible y recuperable con el botón manual.
 *
 * NO guarda payloads: el snapshot se reconstruye en cada
 * intento, justo antes del POST (§8).
 */
function programarReintentoAutosave(vehiculoId) {

    const id = String(vehiculoId);


    /*
     * FASE 3F.6.6-B2 · sin reintentos en pausa ni sin fecha
     * de pertenencia: el trabajo sigue pendiente y visible.
     */
    const planReintento = planificacionDia[id];

    if (
        pausaCambioDia ||
        !planReintento ||
        !fechaPertenenciaPlan(planReintento) ||
        bloqueoBorradoActivo(id)
    ) {

        return false;
    }

    const estado = obtenerOCrearEstadoRecuperacion(id);

    if (
        estado.esperandoRecuperacion &&
        estado.timerReintento !== null
    ) {
        return false;
    }

    if (estado.intento >= MAX_INTENTOS_AUTOSAVE) {

        estado.esperandoRecuperacion = false;
        estado.timerReintento = null;

        return false;
    }

    cancelarDebounceAutosave(id);

    const retraso =
        RETRASOS_REINTENTO_AUTOSAVE_MS[estado.intento] || 0;

    estado.esperandoRecuperacion = true;

    estado.timerReintento = window.setTimeout(
        function() {

            estado.timerReintento = null;
            estado.esperandoRecuperacion = false;

            dispararAutosaveVehiculo(id, true);

        },
        retraso
    );

    return true;
}


/*
 * Disparador COMÚN del motor (lo usan el debounce y el retry).
 * Respeta siempre: plan.modificado, carril único y cola.
 *
 * - vehículo en vuelo → trabajo pendiente EXPLÍCITO (§7 de la
 *   auditoría): se marca pendienteDuranteVuelo y NO se pierde.
 * - esReintento → el arranque contará como intento N+1.
 */
function dispararAutosaveVehiculo(vehiculoId, esReintento) {

    const id = String(vehiculoId);
    const estado = obtenerOCrearEstadoRecuperacion(id);
    const plan = planificacionDia[id];


    if (!plan || plan.modificado !== true) {

        reiniciarRecuperacionVehiculo(id);
        return;
    }


    /*
     * FASE 3F.6.6-B2 · el disparo (debounce o retry) no emite
     * si el envío está bloqueado. No se altera el estado de
     * recuperación: el trabajo sigue pendiente.
     */
    if (
        pausaCambioDia ||
        !fechaPertenenciaPlan(plan) ||
        bloqueoBorradoActivo(id)
    ) {

        return;
    }


    if (vehiculoAutosaveEnCurso === id) {

        estado.pendienteDuranteVuelo = true;

        if (esReintento) {

            estado.esperandoRecuperacion = false;
            estado.timerReintento = null;

            programarReintentoAutosave(id);
        }

        return;
    }


    if (esReintento) {
        estado.origenReintento = true;
    }

    encolarAutosave(id);

    procesarColaAutosave();
}


/*
 * Vista de inspección (pruebas / diagnóstico).
 * NO crea estados ni toca versiones (§19/§23).
 */
function obtenerEstadoRecuperacionAutosave() {

    const vista = {};


    Object.keys(planificacionDia).forEach(
        function(vehiculoId) {

            const estado =
                estadoRecuperacionAutosave[vehiculoId];

            vista[vehiculoId] = estado
                ? {
                    intento: estado.intento,
                    retryPendiente:
                        estado.esperandoRecuperacion === true,
                    timerReintento:
                        estado.timerReintento !== null,
                    pendienteDuranteVuelo:
                        estado.pendienteDuranteVuelo === true
                }
                : {
                    intento: 0,
                    retryPendiente: false,
                    timerReintento: false,
                    pendienteDuranteVuelo: false
                };
        }
    );


    return vista;
}


/*
 * RECUPERACIÓN compartida por `online` y `visibilitychange`.
 *
 * Reutiliza el motor existente (cola + carril único + dedup):
 * NO crea un sistema paralelo ni un POST inmediato
 * indiscriminado. La ÚNICA condición funcional es
 * plan.modificado === true (§22); navigator.onLine y
 * document.visibilityState solo SON SEÑALES de oportunidad.
 *
 * @param {string} origen  "online" | "visibilitychange"
 * @returns {number} nº de vehículos introducidos en el motor
 */
function recuperarAutosavePendiente(origen) {

    let recuperados = 0;


    /*
     * FASE 3F.6.6-B2 · en pausa por cambio de día no se
     * reencola nada: los pendientes esperan la decisión.
     */
    if (pausaCambioDia) {

        return 0;
    }


    Object.keys(planificacionDia).forEach(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];


            if (!plan || plan.modificado !== true) {
                return;
            }


            /*
             * FASE 3F.6.7-C2 · vehículo con borrado en curso:
             * ni online ni visibility pueden reencolarlo.
             */
            if (bloqueoBorradoActivo(vehiculoId)) {
                return;
            }


            /*
             * POST en vuelo → ese propio POST decidirá con las
             * versiones; aquí no se duplica nada.
             */
            if (vehiculoAutosaveEnCurso === vehiculoId) {
                return;
            }


            /*
             * Ya está en la cola → deduplicación entre
             * autosave / retry / online / visibility / manual.
             */
            if (colaAutosave.indexOf(vehiculoId) !== -1) {
                return;
            }


            /*
             * Se reemplaza ÚNICAMENTE la espera de
             * recuperación de este vehículo (retry o debounce),
             * nunca la de los demás, y se abre un ciclo nuevo
             * de intentos: esta señal da una nueva
             * oportunidad de guardado.
             */
            reiniciarRecuperacionVehiculo(vehiculoId);

            encolarAutosave(vehiculoId);

            recuperados++;
        }
    );


    if (recuperados > 0) {
        procesarColaAutosave();
    }

    return recuperados;
}


window.addEventListener(
    "online",
    function() {

        recuperarAutosavePendiente("online");
    }
);


document.addEventListener(
    "visibilitychange",
    function() {

        if (document.visibilityState !== "visible") {
            return;
        }

        recuperarAutosavePendiente("visibilitychange");
    }
);


/* ============================================================
   FASE 3F.2.2 · ESTADO DE VERSIONES POR VEHÍCULO
=========================================================== */

/*
 * versionActual / versionEnviada / versionGuardada por
 * vehiculoId, EXCLUSIVAMENTE en memoria (nunca viajan al
 * backend ni entran en construirPayloadPlanificacion).
 *
 * - versionActual: último estado de mutaciones. Es espejo de
 *   plan.versionModificacion (se sincroniza en
 *   marcarPlanificacionModificada y en cada captura/respuesta
 *   de guardarPlanificacionVehiculo).
 * - versionEnviada: versión capturada justo antes del POST
 *   en vuelo (0 si nunca se ha enviado).
 * - versionGuardada: versión que el servidor tiene
 *   confirmada. Solo avanza tras un OK sin cambios durante
 *   el POST (versionActual === versionEnviada).
 *
 * Invariante §2:
 *   plan.modificado === true  ⇔  versionActual !== versionGuardada
 *
 * Un único estado por vehículo; no se crean estados para
 * vehículos inexistentes (la vista solo recorre
 * planificacionDia).
 */
const estadoVersionesAutosave = {};


/*
 * Obtiene (creando si no existía) el estado de versiones de
 * un plan. Al crearlo, las tres versiones arrancan iguales:
 * estado local = estado confirmado por el servidor.
 */
function obtenerOCrearEstadoVersiones(plan) {

    if (!plan || !plan.vehiculoId) {

        return {
            versionActual: 0,
            versionEnviada: 0,
            versionGuardada: 0
        };
    }


    const id = String(plan.vehiculoId);

    if (!estadoVersionesAutosave[id]) {

        const base =
            Number(plan.versionModificacion) || 0;

        estadoVersionesAutosave[id] = {
            versionActual: base,
            versionEnviada: base,
            versionGuardada: base
        };
    }


    return estadoVersionesAutosave[id];
}


/*
 * Vista de inspección (pruebas / diagnóstico).
 * NO crea estados: un vehículo nunca tocado aparece como
 * 0/0/0 (o con la versión vigente de su plan), y nunca se
 * generan entradas para vehículos inexistentes.
 */
function obtenerEstadoVersionesAutosave() {

    const vista = {};


    Object.keys(planificacionDia).forEach(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];

            const estado =
                estadoVersionesAutosave[vehiculoId];

            const base =
                Number(plan.versionModificacion) || 0;

            const versionActual =
                estado ? estado.versionActual : base;

            const versionEnviada =
                estado ? estado.versionEnviada : base;

            const versionGuardada =
                estado ? estado.versionGuardada : base;

            const modificado =
                plan.modificado === true;

            vista[vehiculoId] = {
                versionActual: versionActual,
                versionEnviada: versionEnviada,
                versionGuardada: versionGuardada,
                modificado: modificado,
                coherente:
                    modificado ===
                    (versionActual !== versionGuardada)
            };
        }
    );


    return vista;
}


/*
 * Cancela (si existe) el temporizador de debounce de un vehículo.
 */
function cancelarDebounceAutosave(vehiculoId) {

    const id = String(vehiculoId);

    if (
        temporizadoresAutosave[id] !== undefined &&
        temporizadoresAutosave[id] !== null
    ) {

        window.clearTimeout(
            temporizadoresAutosave[id]
        );
    }

    delete temporizadoresAutosave[id];
}


/*
 * Programa (o REprograma) el autosave de un vehículo.
 *
 * Nunca quedan dos temporizadores para el mismo vehículo:
 * el anterior se cancela siempre. No usa
 * vehiculoPlanSeleccionado: cada vehículo tiene su propio
 * debounce y sigue funcionando aunque el usuario cambie de
 * vehículo seleccionado.
 */
function programarAutosave(plan) {

    if (!plan || !plan.vehiculoId) {
        return;
    }


    const vehiculoId =
        String(plan.vehiculoId);


    /*
     * FASE 3F.6.6-B2 · sin temporizador si el envío está
     * bloqueado (pausa por cambio de día o fecha
     * desconocida): el trabajo sigue pendiente y visible.
     */
    if (
        pausaCambioDia ||
        !fechaPertenenciaPlan(plan) ||
        bloqueoBorradoActivo(vehiculoId)
    ) {

        return;
    }


    /*
     * FASE 3F.2.3 · §5/§9: si ya existe una espera de backoff
     * para este vehículo, ESA espera es la única del vehículo y
     * re-capturará la versión más reciente cuando dispare → no
     * se arma un segundo temporizador (nunca coexisten
     * debounce + retry para el mismo vehículo).
     */
    const estadoRec =
        estadoRecuperacionAutosave[vehiculoId];


    if (estadoRec && estadoRec.esperandoRecuperacion) {
        return;
    }


    cancelarDebounceAutosave(vehiculoId);


    temporizadoresAutosave[vehiculoId] =
        window.setTimeout(
            function() {

                delete temporizadoresAutosave[vehiculoId];

                dispararAutosaveVehiculo(
                    vehiculoId,
                    false
                );

            },
            DURACION_DEBOUNCE_AUTOSAVE_MS
        );
}


/*
 * Añade un vehículo a la cola SIN duplicarlo.
 * El snapshot NO se congela aquí: se construirá justo antes
 * de que el vehículo inicie su POST.
 */
function encolarAutosave(vehiculoId) {

    const id = String(vehiculoId);


    /*
     * Si ya está en vuelo no se encola: cuando ese POST
     * termine, la comparación de versiones decidirá si
     * sigue pendiente y reabrirá el debounce.
     */

    if (vehiculoAutosaveEnCurso === id) {
        return;
    }


    if (colaAutosave.indexOf(id) === -1) {

        colaAutosave.push(id);
    }
}


/*
 * El carril está ocupado si el motor tiene un POST en vuelo
 * o si se lanzó un guardado directo (fuera del motor).
 */
function carrilAutosaveOcupado() {

    return (
        vehiculoAutosaveEnCurso !== null ||
        guardandoPlanificacion === true
    );
}


/*
 * Procesa el siguiente vehículo pendiente.
 * Solo hay UN POST en vuelo: si el carril está ocupado no
 * hace nada (se volverá a llamar al liberarse).
 */
function procesarColaAutosave() {

    /*
     * FASE 3F.6.6-B2 · en pausa no se consume la cola: los
     * pendientes se conservan por sus flags de modificado.
     */
    if (pausaCambioDia) {

        return;
    }


    if (vehiculoAutosaveEnCurso !== null) {
        return;
    }


    if (guardandoPlanificacion === true) {
        return;
    }


    while (colaAutosave.length > 0) {

        const vehiculoId =
            colaAutosave.shift();


        const plan =
            planificacionDia[vehiculoId];


        if (!plan || plan.modificado !== true) {
            continue;
        }


        if (!fechaPertenenciaPlan(plan)) {
            continue;
        }


        /*
         * FASE 3F.6.7-C2 · un vehículo con borrado en curso
         * nunca sale por la cola; los demás siguen fluyendo.
         */
        if (bloqueoBorradoActivo(vehiculoId)) {
            continue;
        }


        ejecutarAutosaveVehiculo(vehiculoId);

        return;
    }
}


/*
 * Ejecuta el guardado de un vehículo como dueño del carril.
 * La liberación va SIEMPRE en .finally: ok, error, timeout o
 * excepción inesperada no pueden dejar el motor bloqueado.
 */
function ejecutarAutosaveVehiculo(vehiculoId, opciones) {

    const id = String(vehiculoId);


    /*
     * FASE 3F.2.3 · contabilización de intentos:
     * - origen normal (debounce / manual / cola) → ciclo nuevo:
     *   este será el intento 1.
     * - origen reintento (o el vehículo llegó a cola con la
     *   marca de reintento) → intento anterior + 1, con el
     *   tope duro de MAX_INTENTOS_AUTOSAVE.
     */
    const estadoRecup =
        obtenerOCrearEstadoRecuperacion(id);


    if (estadoRecup.origenReintento) {

        estadoRecup.intento += 1;
        estadoRecup.origenReintento = false;

    } else {

        estadoRecup.intento = 1;
    }


    vehiculoAutosaveEnCurso = id;


    let guardado = null;


    try {

        guardado =
            guardarPlanificacionVehiculo(
                id,
                opciones || { automatico: true }
            );

    } catch (error) {

        vehiculoAutosaveEnCurso = null;

        procesarColaAutosave();

        throw error;
    }


    return Promise.resolve(guardado)
        .finally(
            function() {

                vehiculoAutosaveEnCurso = null;

                procesarColaAutosave();
            }
        );
}


/*
 * Estado del motor para inspección y pruebas.
 */
function obtenerEstadoAutosave() {

    return {
        debounce:
            Object.keys(temporizadoresAutosave),

        cola:
            colaAutosave.slice(),

        enCurso:
            vehiculoAutosaveEnCurso,

        duracionDebounceMs:
            DURACION_DEBOUNCE_AUTOSAVE_MS
    };
}


/*
 * Limpieza del estado del motor (pruebas / mantenimiento).
 * Si hay un POST real en vuelo, la marca de carril se
 * conserva: será el propio .finally quien la libere.
 */
function reiniciarMotorAutosave() {

    Object.keys(temporizadoresAutosave).forEach(
        function(vehiculoId) {

            window.clearTimeout(
                temporizadoresAutosave[vehiculoId]
            );

            delete temporizadoresAutosave[vehiculoId];
        }
    );


    colaAutosave = [];


    /*
     * FASE 3F.2.3 · §20: los reintentos y sus esperas de
     * backoff tampoco sobreviven al reinicio del motor.
     */
    Object.keys(estadoRecuperacionAutosave).forEach(
        function(vehiculoId) {

            cancelarReintentoAutosave(vehiculoId);

            delete estadoRecuperacionAutosave[vehiculoId];
        }
    );


    if (guardandoPlanificacion !== true) {

        vehiculoAutosaveEnCurso = null;
    }


    /*
     * FASE 3F.2.2 · reconstrucción coherente del estado de
     * versiones (pruebas / mantenimiento):
     * - plan NO modificado → las tres versiones = versión
     *   vigente (estado local = estado confirmado).
     * - plan modificado con estado existente → se CONSERVA,
     *   para no romper el invariante §2.
     */
    Object.keys(planificacionDia).forEach(
        function(vehiculoId) {

            const plan =
                planificacionDia[vehiculoId];

            if (
                plan.modificado === true &&
                estadoVersionesAutosave[vehiculoId]
            ) {
                return;
            }

            const base =
                Number(plan.versionModificacion) || 0;

            estadoVersionesAutosave[vehiculoId] = {
                versionActual: base,
                versionEnviada: base,
                versionGuardada: base
            };
        }
    );
}


/* ============================================================
   EXPORTAR FUNCIONES
============================================================ */

window.construirPayloadPlanificacion =
    construirPayloadPlanificacion;

window.guardarPlanificacionVehiculo =
    guardarPlanificacionVehiculo;

window.guardarPlanificacionVehiculoSeleccionado =
    guardarPlanificacionVehiculoSeleccionado;

window.hayPlanificacionModificadaSinGuardar =
    hayPlanificacionModificadaSinGuardar;

/*
 * FASE 3F.2.1 · motor de autosave.
 */
window.programarAutosave =
    programarAutosave;

/*
 * FASE 3F.6.6-B2 · fecha de pertenencia y cambio de día.
 */
window.evaluarCambioDia =
    evaluarCambioDia;

window.obtenerInfoDiaPlanificacion =
    obtenerInfoDiaPlanificacion;

window.establecerFechaServidor =
    establecerFechaServidor;

window.obtenerEstadoAutosave =
    obtenerEstadoAutosave;

window.reiniciarMotorAutosave =
    reiniciarMotorAutosave;

/*
 * FASE 3F.2.2 · estado de versiones por vehículo.
 */
window.obtenerEstadoVersionesAutosave =
    obtenerEstadoVersionesAutosave;

/*
 * FASE 3F.2.3 · recuperación del autosave.
 */
window.obtenerEstadoRecuperacionAutosave =
    obtenerEstadoRecuperacionAutosave;

/*
 * FASE 3F.6.7-C2 · borrado explícito.
 */
window.solicitarBorradoPlanificacion =
    solicitarBorradoPlanificacion;

window.obtenerEstadoBorrado =
    obtenerEstadoBorrado;

window.descartarBloqueoBorrado =
    descartarBloqueoBorrado;

window.reconciliarBorrado =
    reconciliarBorrado;

window.bloqueoBorradoActivo =
    bloqueoBorradoActivo;

/*
 * FASE 3F.6.7-C4-C · descarte diferenciado.
 */
window.evaluarDescarteBloqueo =
    evaluarDescarteBloqueo;

window.confirmarDescarteBorrado =
    confirmarDescarteBorrado;

window.mostrarDialogoDescarteBorrado =
    mostrarDialogoDescarteBorrado;

window.cerrarDialogoDescarteBorrado =
    cerrarDialogoDescarteBorrado;

/*
 * FASE 3F.6.7-C4-B · persistencia y recuperación del bloqueo.
 */
window.recuperarMarcasBorradoAlIniciar =
    recuperarMarcasBorradoAlIniciar;

window.descartarBloqueoGlobalMarcas =
    descartarBloqueoGlobalMarcas;

window.recuperarAutosavePendiente =
    recuperarAutosavePendiente;

window.cancelarEsperasAutosave =
    cancelarEsperasAutosave;

window.reiniciarRecuperacionVehiculo =
    reiniciarRecuperacionVehiculo;

window.MAX_INTENTOS_AUTOSAVE =
    MAX_INTENTOS_AUTOSAVE;

window.RETRASOS_REINTENTO_AUTOSAVE_MS =
    RETRASOS_REINTENTO_AUTOSAVE_MS.slice();

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

window.crearParadaDesdeMapa =
    crearParadaDesdeMapa;

window.eliminarParada =
    eliminarParada;

window.editarNombreParada =
    editarNombreParada;

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

