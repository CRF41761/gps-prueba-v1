/* ============================================================
   CRF LA GRANJA DE EL SALER
   RUTAS.JS · PLANIFICACIÓN Y GESTIÓN DE PARADAS
============================================================ */


/* ============================================================
   ESTADO GLOBAL
============================================================ */

let planificacionDia = {};
let vehiculoPlanSeleccionado = null;

/* Estado de filtros de avisos */
let filtroAvisosTexto = "";
let filtroAvisosEstado = "PENDIENTE";


/* ============================================================
   INICIALIZACIÓN
============================================================ */

async function inicializarPlanificacion() {
    try {
        await cargarDatos();

        renderizarLeyendaRutas();
        renderizarAvisosPendientes();

        cargarPlanificacionDesdeDatos();
        seleccionarVehiculoPlanInicial();
        renderizarPlanificacion();

    } catch (error) {
        console.error(
            "Error inicializando planificación:",
            error
        );
    }
}


/* ============================================================
   AVISOS
============================================================ */

/*
 * Devuelve todos los avisos disponibles.
 */
function obtenerTodosLosAvisos() {
    if (!Array.isArray(window.avisos)) {
        return [];
    }

    return window.avisos;
}


/*
 * Devuelve únicamente los avisos pendientes.
 */
function obtenerAvisosPendientes() {
    return obtenerTodosLosAvisos().filter(aviso => {
        return normalizarEstado(aviso.estado) === "PENDIENTE";
    });
}


/*
 * Render principal de la sección AVISOS.
 *
 * Por defecto muestra únicamente PENDIENTES.
 * El usuario puede utilizar "Ver todos" y los filtros
 * para consultar otros estados.
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

    const avisosTodos =
        obtenerTodosLosAvisos();

    const avisosPendientes =
        avisosTodos.filter(aviso => {
            return normalizarEstado(aviso.estado) === "PENDIENTE";
        });

    /*
     * El contador del encabezado representa siempre
     * los avisos pendientes reales, independientemente
     * del filtro que esté viendo el usuario.
     */
    if (contador) {
        contador.textContent =
            avisosPendientes.length;
    }


    /*
     * Aplicar búsqueda + filtro.
     */
    const avisosFiltrados =
        filtrarAvisosParaTabla(avisosTodos);


    /*
     * Si no hay resultados.
     */
    if (!avisosFiltrados.length) {
        contenedor.innerHTML = `
            ${crearControlesAvisos()}

            <div class="sin-avisos-pendientes">
                ${
                    filtroAvisosTexto ||
                    filtroAvisosEstado !== "PENDIENTE"
                        ? "No hay avisos que coincidan con los filtros."
                        : "No hay avisos pendientes de asignar."
                }
            </div>
        `;

        return;
    }


    /*
     * Tabla.
     */
    contenedor.innerHTML = `
        ${crearControlesAvisos()}

        <div class="tabla-avisos-wrapper">

            <table class="tabla-avisos-pendientes">

                <thead>
                    <tr>
                        <th class="columna-id">
                            ID
                        </th>

                        <th class="columna-colaborador">
                            COLABORADOR
                        </th>

                        <th class="columna-municipio">
                            MUNICIPIO
                        </th>

                        <th class="columna-animales">
                            ANIMALES
                        </th>

                        <th class="columna-estado">
                            ESTADO
                        </th>

                        <th class="columna-telefono">
                            TELÉFONO
                        </th>

                        <th class="columna-vehiculo">
                            VEHÍCULO
                        </th>
                    </tr>
                </thead>

                <tbody>
                    ${
                        avisosFiltrados
                            .map(aviso =>
                                crearFilaAvisoPendiente(
                                    aviso
                                )
                            )
                            .join("")
                    }
                </tbody>

            </table>

        </div>
    `;
}


/*
 * Controles superiores de la tabla.
 */
function crearControlesAvisos() {
    return `
        <div class="controles-avisos-pendientes">

            <div class="buscador-avisos-pendientes">

                <span class="icono-buscador-avisos">
                    🔎
                </span>

                <label
                    for="buscador-avisos-planificacion"
                    class="sr-only"
                >
                    Buscar avisos
                </label>

                <input
                    id="buscador-avisos-planificacion"
                    name="buscador-avisos-planificacion"
                    type="search"
                    value="${escaparHTML(
                        filtroAvisosTexto
                    )}"
                    placeholder="Buscar por municipio, colaborador, ID o especie..."
                    autocomplete="off"
                    oninput="actualizarFiltroTextoAvisos(this.value)"
                />

            </div>


            <div class="filtro-estado-avisos">

                <label
                    for="filtro-estado-avisos"
                    class="sr-only"
                >
                    Filtrar avisos por estado
                </label>

                <select
                    id="filtro-estado-avisos"
                    name="filtro-estado-avisos"
                    onchange="actualizarFiltroEstadoAvisos(this.value)"
                >

                    <option
                        value="PENDIENTE"
                        ${
                            filtroAvisosEstado === "PENDIENTE"
                                ? "selected"
                                : ""
                        }
                    >
                        Pendientes
                    </option>

                    <option
                        value="TODOS"
                        ${
                            filtroAvisosEstado === "TODOS"
                                ? "selected"
                                : ""
                        }
                    >
                        Todos
                    </option>

                    <option
                        value="ASIGNADO"
                        ${
                            filtroAvisosEstado === "ASIGNADO"
                                ? "selected"
                                : ""
                        }
                    >
                        Asignados
                    </option>

                    <option
                        value="RECOGIDO"
                        ${
                            filtroAvisosEstado === "RECOGIDO"
                                ? "selected"
                                : ""
                        }
                    >
                        Recogidos
                    </option>

                </select>

            </div>


            <button
                type="button"
                class="boton-ver-todos-avisos"
                onclick="mostrarTodosLosAvisos()"
            >
                Ver todos
            </button>

        </div>
    `;
}


/*
 * Filtrado de avisos.
 */
function filtrarAvisosParaTabla(avisos) {
    const texto =
        normalizarTexto(
            filtroAvisosTexto
        );

    const estado =
        normalizarEstado(
            filtroAvisosEstado
        );

    return avisos.filter(aviso => {

        /*
         * Filtro de estado.
         */
        if (
            estado &&
            estado !== "TODOS"
        ) {
            if (
                normalizarEstado(aviso.estado) !==
                estado
            ) {
                return false;
            }
        }


        /*
         * Filtro de texto.
         */
        if (!texto) {
            return true;
        }

        const id =
            obtenerIdAviso(aviso);

        const especie =
            obtenerEspecieAviso(aviso);

        const colaborador =
            obtenerColaboradorAviso(aviso);

        const municipio =
            obtenerMunicipioAviso(aviso);

        const punto =
            obtenerPuntoAviso(aviso);

        const telefono =
            obtenerTelefonoAviso(aviso);

        const textoBusqueda =
            normalizarTexto(
                [
                    id,
                    especie,
                    colaborador,
                    municipio,
                    punto,
                    telefono
                ]
                    .filter(Boolean)
                    .join(" ")
            );

        return textoBusqueda.includes(
            texto
        );
    });
}


/*
 * Actualizar texto de búsqueda.
 */
function actualizarFiltroTextoAvisos(valor) {
    filtroAvisosTexto =
        String(valor || "");

    renderizarAvisosPendientes();

    /*
     * El foco puede perderse al reconstruir la tabla.
     * Se recupera automáticamente.
     */
    const input =
        document.getElementById(
            "buscador-avisos-planificacion"
        );

    if (input) {
        input.focus();

        try {
            const posicion =
                filtroAvisosTexto.length;

            input.setSelectionRange(
                posicion,
                posicion
            );
        } catch (error) {
            /*
             * Algunos navegadores pueden no permitir
             * setSelectionRange en determinadas situaciones.
             */
        }
    }
}


/*
 * Actualizar estado.
 */
function actualizarFiltroEstadoAvisos(valor) {
    filtroAvisosEstado =
        normalizarEstado(valor) || "PENDIENTE";

    renderizarAvisosPendientes();
}


/*
 * Mostrar todos los avisos.
 */
function mostrarTodosLosAvisos() {
    filtroAvisosEstado = "TODOS";

    renderizarAvisosPendientes();
}


/*
 * Volver a pendientes.
 */
function mostrarAvisosPendientes() {
    filtroAvisosEstado = "PENDIENTE";

    renderizarAvisosPendientes();
}


/* ============================================================
   FILA DE AVISO
============================================================ */

function crearFilaAvisoPendiente(aviso) {

    const idAviso =
        obtenerIdAviso(aviso);

    const especie =
        obtenerEspecieAviso(aviso);

    const cantidad =
        obtenerCantidadAviso(aviso);

    const punto =
        obtenerPuntoAviso(aviso);

    const colaborador =
        obtenerColaboradorAviso(aviso);

    const municipio =
        obtenerMunicipioAviso(aviso);

    const telefono =
        obtenerTelefonoAviso(aviso);

    const estado =
        normalizarEstado(
            aviso.estado
        ) || "PENDIENTE";

    const vehiculoAsignado =
        aviso.vehiculo_id ||
        aviso.vehiculo ||
        aviso.id_vehiculo ||
        "";


    /*
     * Vehículo recomendado:
     *
     * - Si ya existe vehículo asignado, se mantiene.
     * - Si no existe, se calcula mediante la lógica
     *   de recomendación existente.
     */
    const vehiculoSeleccionado =
        vehiculoAsignado ||
        obtenerVehiculoRecomendado(aviso);


    let claseEstado =
        "estado-aviso-tabla";

    if (estado === "PENDIENTE") {
        claseEstado +=
            " estado-aviso-pendiente";
    }

    if (estado === "ASIGNADO") {
        claseEstado +=
            " estado-aviso-asignado";
    }

    if (estado === "RECOGIDO") {
        claseEstado +=
            " estado-aviso-recogido";
    }


    const textoEstado =
        textoEstadoAviso(
            estado
        );


    /*
     * Texto secundario de especie.
     */
    const especieHTML =
        especie &&
        especie !== "Especie no indicada"
            ? `
                <span class="especie-secundaria-aviso">
                    ${escaparHTML(String(especie))}
                </span>
              `
            : "";


    /*
     * Vehículo.
     */
    const selectorVehiculo =
        estado === "RECOGIDO"
            ? `
                <span class="vehiculo-tabla-final">
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
              `
            : `
                <div class="asignacion-tabla-aviso">

                    <label
                        for="vehiculo-aviso-${escaparHTML(String(idAviso))}"
                        class="sr-only"
                    >
                        Vehículo para aviso ${escaparHTML(
                            String(idAviso)
                        )}
                    </label>

                    <select
                        id="vehiculo-aviso-${escaparHTML(String(idAviso))}"
                        name="vehiculo-aviso-${escaparHTML(String(idAviso))}"
                        class="selector-vehiculo-aviso"
                        data-aviso-id="${escaparHTML(
                            String(idAviso)
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
                            String(idAviso)
                        )}')"
                    >
                        ${
                            estado === "ASIGNADO"
                                ? "Cambiar"
                                : "Asignar"
                        }
                    </button>

                </div>
              `;


    return `
        <tr
            class="fila-aviso-tabla"
            data-aviso-id="${escaparHTML(
                String(idAviso)
            )}"
        >

            <!-- ID -->
            <td class="celda-id-aviso">
                <span class="id-aviso-tabla">
                    #${escaparHTML(String(idAviso))}
                </span>
            </td>


            <!-- COLABORADOR -->
            <td class="celda-colaborador-aviso">

                <div class="colaborador-aviso-tabla">

                    <strong>
                        ${escaparHTML(
                            String(colaborador)
                        )}
                    </strong>

                    ${
                        punto &&
                        normalizarTexto(punto) !==
                        normalizarTexto(colaborador)
                            ? `
                                <span class="punto-secundario-aviso">
                                    ${escaparHTML(
                                        String(punto)
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${especieHTML}

                </div>

            </td>


            <!-- MUNICIPIO -->
            <td class="celda-municipio-aviso">

                <span class="municipio-aviso-tabla">
                    ${
                        municipio
                            ? escaparHTML(
                                String(municipio)
                            )
                            : "—"
                    }
                </span>

            </td>


            <!-- ANIMALES -->
            <td class="celda-animales-aviso">

                <span class="cantidad-animales-aviso">
                    ${escaparHTML(
                        String(cantidad)
                    )}
                </span>

            </td>


            <!-- ESTADO -->
            <td class="celda-estado-aviso">

                <span class="${claseEstado}">

                    <span
                        class="punto-estado-aviso"
                        aria-hidden="true"
                    ></span>

                    <span>
                        ${escaparHTML(
                            textoEstado
                        )}
                    </span>

                </span>

            </td>


            <!-- TELÉFONO -->
            <td class="celda-telefono-aviso">

                ${
                    telefono
                        ? `
                            <span class="telefono-aviso-tabla">
                                ${escaparHTML(
                                    String(telefono)
                                )}
                            </span>
                          `
                        : `
                            <span class="telefono-aviso-vacio">
                                —
                            </span>
                          `
                }

            </td>


            <!-- VEHÍCULO -->
            <td class="celda-vehiculo-aviso">

                ${selectorVehiculo}

            </td>

        </tr>
    `;
}


/* ============================================================
   DATOS DE AVISOS
============================================================ */

function obtenerEspecieAviso(aviso) {
    return (
        aviso.especie ||
        aviso.especie_reportada ||
        aviso.ESPECIE ||
        "Especie no indicada"
    );
}


function obtenerCantidadAviso(aviso) {
    const cantidad =
        aviso.cantidad ??
        aviso.numero_animales ??
        aviso.animales ??
        1;

    const numero =
        Number(cantidad);

    return Number.isFinite(numero)
        ? numero
        : 1;
}


function obtenerPuntoAviso(aviso) {
    return (
        aviso.punto ||
        aviso.nombre_punto ||
        aviso.punto_recogida ||
        aviso.direccion ||
        "Punto no indicado"
    );
}


function obtenerColaboradorAviso(aviso) {

    const colaborador =
        aviso.colaborador ||
        aviso.nombre_colaborador ||
        aviso.COLABORADOR ||
        aviso.punto ||
        aviso.nombre_punto ||
        aviso.punto_recogida ||
        "";

    if (colaborador) {
        return colaborador;
    }

    return "Colaborador no indicado";
}


function obtenerMunicipioAviso(aviso) {

    return (
        aviso.municipio ||
        aviso.localidad ||
        aviso.municipality ||
        aviso.MUNICIPIO ||
        ""
    );
}


function obtenerTelefonoAviso(aviso) {
    return (
        aviso.telefono ||
        aviso.telefono_contacto ||
        aviso.telefono_info ||
        aviso.TELEFONO ||
        aviso.TELEFONO_INFO ||
        ""
    );
}


function textoEstadoAviso(estado) {

    switch (
        normalizarEstado(estado)
    ) {

        case "PENDIENTE":
            return "Pendiente";

        case "ASIGNADO":
            return "Asignado";

        case "RECOGIDO":
            return "Recogido";

        default:
            return estado || "Pendiente";
    }
}


/* ============================================================
   ASIGNACIÓN INTELIGENTE
============================================================ */

function obtenerVehiculoRecomendado(aviso) {

    const planes =
        Object.values(
            planificacionDia
        );

    if (!planes.length) {
        return null;
    }

    let mejorVehiculo = null;
    let mejorPuntuacion = -Infinity;

    planes.forEach(plan => {

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
    });

    return mejorVehiculo;
}


function evaluarVehiculoParaAviso(
    plan,
    aviso
) {

    let puntuacion = 0;

    const rutaAviso =
        normalizarTexto(
            aviso.ruta_id ||
            aviso.ruta ||
            aviso.ruta_geografica ||
            ""
        );

    const rutaHabitual =
        normalizarTexto(
            plan.rutaHabitual || ""
        );

    const rutaActiva =
        normalizarTexto(
            plan.rutaActiva || ""
        );


    /*
     * Coincidencia con ruta activa.
     */
    if (
        rutaAviso &&
        rutaActiva &&
        rutaAviso === rutaActiva
    ) {
        puntuacion += 100;
    }


    /*
     * Coincidencia con ruta habitual.
     */
    if (
        rutaAviso &&
        rutaHabitual &&
        rutaAviso === rutaHabitual
    ) {
        puntuacion += 50;
    }


    const latAviso =
        obtenerLat(aviso);

    const lngAviso =
        obtenerLng(aviso);


    if (
        coordenadasValidas(
            latAviso,
            lngAviso
        )
    ) {

        /*
         * Proximidad a las paradas
         * ya planificadas.
         */

        let distanciaMinima =
            Infinity;

        (
            plan.paradas || []
        ).forEach(parada => {

            const lat =
                obtenerLat(parada);

            const lng =
                obtenerLng(parada);

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
        });


        if (
            distanciaMinima <= 5
        ) {
            puntuacion += 40;

        } else if (
            distanciaMinima <= 15
        ) {
            puntuacion += 25;

        } else if (
            distanciaMinima <= 30
        ) {
            puntuacion += 10;
        }


        /*
         * Proximidad al vehículo.
         */

        const posicionVehiculo =
            obtenerPosicionVehiculo(
                plan.vehiculoId
            );

        if (posicionVehiculo) {

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
                    puntuacion += 20;

                } else if (
                    distanciaVehiculo <= 15
                ) {
                    puntuacion += 10;
                }
            }
        }
    }

    return puntuacion;
}


function obtenerPosicionVehiculo(
    vehiculoId
) {

    if (
        typeof window.posicionesVehiculos ===
        "object"
    ) {
        return (
            window.posicionesVehiculos[
                vehiculoId
            ] || null
        );
    }

    if (
        Array.isArray(
            window.posiciones
        )
    ) {
        return (
            window.posiciones.find(
                pos => {
                    return (
                        obtenerIdVehiculo(pos) ===
                        vehiculoId
                    );
                }
            ) || null
        );
    }

    return null;
}


/* ============================================================
   ASIGNAR AVISO A VEHÍCULO
============================================================ */

function asignarAvisoAVehiculo(
    avisoId
) {

    const selector =
        document.querySelector(
            `.selector-vehiculo-aviso[data-aviso-id="${CSS.escape(
                String(avisoId)
            )}"]`
        );

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


    /*
     * Comprobar si ya estaba asignado.
     */

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


    /*
     * Comprobar si ya está en el plan.
     */

    const yaExiste =
        (
            plan.paradas ||
            []
        ).some(parada => {

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
        });


    /*
     * Crear parada.
     */

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

            municipio:
                obtenerMunicipioAviso(
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

            estado:
                "ASIGNADO",

            origen:
                "AVISO"
        });
    }


    /*
     * Actualizar estado del aviso.
     */

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


    /*
     * Actualizar interfaz.
     */

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
}


function encontrarAvisoPorId(
    avisoId
) {

    if (
        !Array.isArray(
            window.avisos
        )
    ) {
        return null;
    }

    return (
        window.avisos.find(
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
        ) || null
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

    planificacionDia = {};

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

    if (
        Array.isArray(
            window.avisos
        )
    ) {

        window.avisos.forEach(
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
                                    String(
                                        avisoId
                                    )
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

                    municipio:
                        obtenerMunicipioAviso(
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

                    estado:
                        estado,

                    origen:
                        "AVISO"
                });
            }
        );
    }


    /* --------------------------------------------------------
       Incorporar planificación almacenada
    -------------------------------------------------------- */

    if (
        window.planificacionGuardada &&
        typeof window.planificacionGuardada ===
            "object"
    ) {

        Object.keys(
            window.planificacionGuardada
        ).forEach(
            vehiculoId => {

                const guardada =
                    window.planificacionGuardada[
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

    if (
        !Array.isArray(
            window.vehiculos
        )
    ) {
        return [];
    }

    return window.vehiculos.filter(
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
                v => {
                    return (
                        obtenerIdVehiculo(
                            v
                        ) ===
                        vehiculoId
                    );
                }
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

    if (
        !Array.isArray(
            window.rutas
        )
    ) {
        return [];
    }

    return window.rutas;
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
            R1: "Norte",
            R2: "Interior",
            R3: "Sur"
        };

        return (
            nombres[texto] ||
            String(rutaId)
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
            rutaId || ""
        ).toUpperCase();

    if (id === "R1") {
        return "#1976D2";
    }

    if (id === "R2") {
        return "#388E3C";
    }

    if (id === "R3") {
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
        rutas.map(
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
                    <div class="item-leyenda-ruta">

                        <span
                            class="color-leyenda-ruta"
                            style="background:${color}"
                        ></span>

                        <span>
                            ${escaparHTML(
                                String(nombre)
                            )}
                        </span>

                    </div>
                `;
            }
        ).join("");
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
        ] || null
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

    let totalAnimales = 0;

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

        <span>·</span>

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
        <div class="selector-vehiculos-plan">

            ${
                planes.map(
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
                                        String(ruta)
                                    )}
                                </span>

                            </button>
                        `;
                    }
                ).join("")
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
        plan.modificado === true;


    return `
        <div
            class="
                plan-vehiculo-seleccionado
                detalle-plan-vehiculo
            "
            data-vehiculo-id="${escaparHTML(
                String(vehiculoId)
            )}"
        >

            <div class="plan-vehiculo-columnas">


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
                            class="
                                cabecera-plan-vehiculo
                            "
                        >

                            <div>

                                <span class="etiqueta-plan">
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


                        <div class="datos-vehiculo-plan">

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


                    <!-- ======================================
                         RUTA ACTIVA
                    ======================================= -->

                    <div class="plan-bloque">

                        <div class="titulo-bloque-plan">

                            <span>
                                RUTA ACTIVA
                            </span>

                        </div>


                        <label
                            for="ruta-plan-${escaparHTML(
                                String(vehiculoId)
                            )}"
                            class="etiqueta-campo-plan"
                        >
                            Ruta de trabajo
                        </label>


                        <select
                            id="ruta-plan-${escaparHTML(
                                String(vehiculoId)
                            )}"
                            name="ruta-plan-${escaparHTML(
                                String(vehiculoId)
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


                    <!-- ======================================
                         HORARIOS
                    ======================================= -->

                    <div class="plan-bloque">

                        <div class="titulo-bloque-plan">

                            <span>
                                HORARIO PREVISTO
                            </span>

                        </div>


                        <div class="horarios-plan">

                            <div
                                class="
                                    campo-hora-plan
                                "
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
                                class="
                                    campo-hora-plan
                                "
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


                    <!-- ======================================
                         RESUMEN
                    ======================================= -->

                    <div
                        class="
                            plan-bloque
                            resumen-plan-vehiculo
                        "
                    >

                        <div class="titulo-bloque-plan">

                            <span>
                                RESUMEN
                            </span>

                        </div>


                        <div class="resumen-plan-datos">

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
                                    <div class="sin-paradas">
                                        No hay paradas planificadas.
                                    </div>
                                `
                        }

                    </div>


                    <!-- ======================================
                         AÑADIR PARADA
                    ======================================= -->

                    <button
                        type="button"
                        class="
                            boton-anadir-parada-principal
                        "
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
                            <span>🔔</span>
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
                            <span>📍</span>
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
                            <span>📌</span>
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
                            <span>🔎</span>
                            <strong>
                                Buscar dirección
                            </strong>
                        </button>

                    </div>


                    <!-- ======================================
                         OPTIMIZACIÓN
                    ======================================= -->

                    <div class="acciones-plan">

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

    return rutas.map(
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
                        String(nombre)
                    )}
                </option>
            `;
        }
    ).join("");
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

    let existente =
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
            <div class="sin-opciones-parada">
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

    wrapper.className = `
        subopciones-anadir-parada
        selector-secundario-parada
    `;


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
            avisos.map(
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
            ).join("")
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

    let existente =
        menu.querySelector(
            ".subopciones-anadir-parada"
        );

    if (existente) {
        existente.remove();
    }


    const puntos =
        Array.isArray(
            window.puntosRecogida
        )
            ? window.puntosRecogida
            : (
                Array.isArray(
                    window.puntos
                )
                    ? window.puntos
                    : []
            );


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

    wrapper.className = `
        subopciones-anadir-parada
        selector-secundario-parada
    `;


    if (!activos.length) {

        wrapper.innerHTML = `
            <div class="sin-opciones-parada">
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
            activos.map(
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
            ).join("")
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
        String(tipo).toUpperCase() ===
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

            municipio:
                obtenerMunicipioAviso(
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
        String(tipo).toUpperCase() ===
        "PUNTO"
    ) {

        const puntos =
            Array.isArray(
                window.puntosRecogida
            )
                ? window.puntosRecogida
                : (
                    Array.isArray(
                        window.puntos
                    )
                        ? window.puntos
                        : []
                );


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
            parada.tipo || ""
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
        estado === "ASIGNADO"
    ) {
        claseEstado +=
            " estado-asignado";
    }

    if (
        estado === "RECOGIDO"
    ) {
        claseEstado +=
            " estado-recogido";
    }

    if (
        estado === "PENDIENTE"
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

            <div class="numero-parada">
                ${numero}
            </div>


            <div class="icono-parada">
                ${
                    esAviso
                        ? "🔔"
                        : "📍"
                }
            </div>


            <div class="informacion-parada">

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
                            <span class="especie-parada">
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
                            <span class="detalles-parada">
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
            obtenerLat(parada),
            obtenerLng(parada)
        )
    ) {

        window.map.setView(
            [
                obtenerLat(parada),
                obtenerLng(parada)
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


    /*
     * La lógica de cálculo automático de ruta se
     * mantiene preparada para integrarse con el
     * motor de rutas del mapa.
     */

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
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`
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
            lat2 - lat1
        );

    const dLng =
        gradosARadianes(
            lng2 - lng1
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
        .normalize(
            "NFD"
        )
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
        .normalize(
            "NFD"
        )
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

window.obtenerTodosLosAvisos =
    obtenerTodosLosAvisos;

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

window.actualizarFiltroTextoAvisos =
    actualizarFiltroTextoAvisos;

window.actualizarFiltroEstadoAvisos =
    actualizarFiltroEstadoAvisos;

window.mostrarTodosLosAvisos =
    mostrarTodosLosAvisos;

window.mostrarAvisosPendientes =
    mostrarAvisosPendientes;
