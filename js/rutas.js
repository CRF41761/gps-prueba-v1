// ============================================================
// RUTAS.JS
// Gestión de rutas y planificación del día
// ============================================================

let planificacionDia = {};


// ============================================================
// INICIALIZACIÓN
// ============================================================

function inicializarPlanificacion() {
    cargarPlanificacionDesdeDatos();
    renderizarLeyendaRutas();
    renderizarAvisosPendientes();
    renderizarPlanificacion();
}


// ============================================================
// AVISOS PENDIENTES DE ASIGNACIÓN
// ============================================================

function obtenerAvisosPendientes() {

    const datos = window.DATOS_MOCK || {};

    const avisos =
        Array.isArray(datos.AVISOS)
            ? datos.AVISOS
            : [];

    return avisos.filter(aviso => {

        const estado =
            String(aviso.estado || "")
                .trim()
                .toUpperCase();

        return estado === "PENDIENTE";
    });
}


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

    const avisos =
        obtenerAvisosPendientes();

    if (contador) {

        contador.textContent =
            `${avisos.length} ${
                avisos.length === 1
                    ? "pendiente"
                    : "pendientes"
            }`;
    }

    if (!avisos.length) {

        contenedor.innerHTML = `
            <div class="sin-avisos-pendientes">

                <span class="icono-sin-avisos">
                    ✓
                </span>

                <div>

                    <strong>
                        No hay avisos pendientes
                    </strong>

                    <div>
                        Todos los avisos están asignados o recogidos.
                    </div>

                </div>

            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        avisos
            .map(aviso =>
                crearTarjetaAvisoPendiente(aviso)
            )
            .join("");
}


// ============================================================
// VEHÍCULOS DISPONIBLES PARA ASIGNACIÓN
// ============================================================

function obtenerVehiculosDisponibles() {

    const datos =
        window.DATOS_MOCK || {};

    const vehiculos =
        Array.isArray(datos.VEHICULOS)
            ? datos.VEHICULOS
            : [];

    return vehiculos.filter(vehiculo => {

        return vehiculo.activo !== false;
    });
}


// ============================================================
// RECOMENDACIÓN DE VEHÍCULO
// ============================================================

function obtenerVehiculoRecomendado(aviso) {

    const vehiculos =
        obtenerVehiculosDisponibles();

    if (!vehiculos.length) {
        return "";
    }

    const rutaAviso =
        String(
            aviso.ruta ||
            aviso.ruta_id ||
            ""
        )
            .trim()
            .toUpperCase();

    const latAviso =
        Number(
            aviso.latitud ??
            aviso.lat ??
            NaN
        );

    const lngAviso =
        Number(
            aviso.longitud ??
            aviso.lng ??
            NaN
        );

    let mejorVehiculo = null;
    let mejorPuntuacion = -Infinity;

    vehiculos.forEach((vehiculo, indice) => {

        const id =
            vehiculo.id_vehiculo ||
            vehiculo.vehiculo_id ||
            vehiculo.id ||
            `V${indice + 1}`;

        const rutaHabitual =
            String(
                vehiculo.ruta_id ||
                vehiculo.rutaHabitual ||
                vehiculo.ruta_habitual ||
                ""
            )
                .trim()
                .toUpperCase();

        let puntuacion = 0;

        // Prioridad principal:
        // la ruta geográfica del aviso coincide
        // con la ruta planificada del vehículo.
        const plan =
            planificacionDia[id];

        const rutaPlanificada =
            String(
                plan?.rutaActiva ||
                ""
            )
                .trim()
                .toUpperCase();

        if (
            rutaAviso &&
            rutaPlanificada &&
            rutaAviso === rutaPlanificada
        ) {
            puntuacion += 100;
        }

        // Segunda prioridad:
        // coincide con la ruta habitual del vehículo.
        if (
            rutaAviso &&
            rutaHabitual &&
            rutaAviso === rutaHabitual
        ) {
            puntuacion += 50;
        }

        // Si el vehículo ya tiene una parada del mismo aviso,
        // no debe ser recomendado como nueva asignación.
        if (
            plan &&
            Array.isArray(plan.paradas) &&
            plan.paradas.some(parada =>
                parada.tipo === "AVISO" &&
                String(parada.aviso_id || "") ===
                    String(
                        aviso.id_aviso ||
                        aviso.id ||
                        ""
                    )
            )
        ) {
            puntuacion -= 1000;
        }

        // Como criterio secundario, valorar la cercanía
        // a las paradas ya planificadas.
        if (
            plan &&
            Array.isArray(plan.paradas) &&
            Number.isFinite(latAviso) &&
            Number.isFinite(lngAviso)
        ) {

            plan.paradas.forEach(parada => {

                const lat =
                    Number(
                        parada.latitud
                    );

                const lng =
                    Number(
                        parada.longitud
                    );

                if (
                    !Number.isFinite(lat) ||
                    !Number.isFinite(lng)
                ) {
                    return;
                }

                const distancia =
                    calcularDistanciaAproximada(
                        latAviso,
                        lngAviso,
                        lat,
                        lng
                    );

                if (distancia < 5) {
                    puntuacion += 20;
                } else if (distancia < 15) {
                    puntuacion += 10;
                } else if (distancia < 30) {
                    puntuacion += 5;
                }
            });
        }

        if (
            mejorVehiculo === null ||
            puntuacion > mejorPuntuacion
        ) {
            mejorVehiculo = id;
            mejorPuntuacion = puntuacion;
        }
    });

    return mejorVehiculo || "";
}


function calcularDistanciaAproximada(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const rad =
        Math.PI / 180;

    const x =
        (lng2 - lng1) *
        Math.cos(
            (lat1 + lat2) / 2 * rad
        );

    const y =
        lat2 - lat1;

    return (
        Math.sqrt(
            x * x +
            y * y
        ) * 111
    );
}


function crearOpcionesVehiculosAsignacion(aviso) {

    const vehiculos =
        obtenerVehiculosDisponibles();

    if (!vehiculos.length) {

        return `
            <option value="">
                No hay vehículos disponibles
            </option>
        `;
    }

    const vehiculoRecomendado =
        aviso
            ? obtenerVehiculoRecomendado(aviso)
            : "";

    return `
        <option value="">
            Seleccionar vehículo...
        </option>

        ${
            vehiculos
                .map((vehiculo, index) => {

                    const id =
                        vehiculo.id_vehiculo ||
                        vehiculo.vehiculo_id ||
                        vehiculo.id ||
                        `V${index + 1}`;

                    const nombre =
                        vehiculo.nombre ||
                        `Vehículo ${index + 1}`;

                    return `
                        <option
                            value="${escaparHTML(id)}"
                            ${
                                id === vehiculoRecomendado
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escaparHTML(nombre)}
                        </option>
                    `;
                })
                .join("")
        }
    `;
}


// ============================================================
// TARJETA DE AVISO PENDIENTE
// ============================================================

function crearTarjetaAvisoPendiente(aviso) {

    const idAviso =
        aviso.id ||
        aviso.id_aviso ||
        "";

    const nombrePunto =
        aviso.punto ||
        aviso.nombre ||
        aviso.punto_nombre ||
        "Punto de recogida";

    const especie =
        aviso.especie ||
        aviso.especie_reportada ||
        "Especie no indicada";

    const cantidad =
        aviso.cantidad ||
        1;

    const telefono =
        aviso.telefono ||
        aviso.telefono_info ||
        "";

    const observaciones =
        aviso.observaciones ||
        "";

    const ruta =
        aviso.ruta ||
        aviso.ruta_id ||
        "";

    const nombreRuta =
        CONFIG.nombresRutas?.[ruta] ||
        ruta ||
        "Sin ruta";

    const colorRuta =
        CONFIG.coloresRutas?.[ruta] ||
        "#666";

    return `
        <article
            class="tarjeta-aviso-pendiente"
            data-aviso="${escaparHTML(idAviso)}"
        >

            <div class="cabecera-aviso-pendiente">

                <div class="icono-aviso-pendiente">
                    🔔
                </div>

                <div class="datos-aviso-pendiente">

                    <div class="titulo-aviso-pendiente">
                        ${escaparHTML(nombrePunto)}
                    </div>

                    <div class="identificador-aviso-pendiente">
                        ${escaparHTML(idAviso)}
                    </div>

                </div>

                <div class="ruta-aviso-pendiente">

                    <span
                        class="punto-ruta"
                        style="background:${colorRuta};"
                    ></span>

                    ${escaparHTML(nombreRuta)}

                </div>

            </div>


            <div class="contenido-aviso-pendiente">

                <div class="dato-aviso">

                    <span class="etiqueta-dato">
                        Especie
                    </span>

                    <strong>
                        ${escaparHTML(especie)}
                    </strong>

                </div>


                <div class="dato-aviso">

                    <span class="etiqueta-dato">
                        Cantidad
                    </span>

                    <strong>
                        ${escaparHTML(String(cantidad))}
                    </strong>

                </div>


                ${
                    telefono
                        ? `
                            <div class="dato-aviso">

                                <span class="etiqueta-dato">
                                    Teléfono
                                </span>

                                <strong>
                                    ${escaparHTML(telefono)}
                                </strong>

                            </div>
                        `
                        : ""
                }

            </div>


            ${
                observaciones
                    ? `
                        <div class="observaciones-aviso-pendiente">
                            ${escaparHTML(observaciones)}
                        </div>
                    `
                    : ""
            }


            <div class="pie-aviso-pendiente">

                <span class="estado-aviso-pendiente">
                    PENDIENTE DE ASIGNACIÓN
                </span>

                <span class="coordenadas-aviso-pendiente">
                    ${formatearCoordenadasAviso(aviso)}
                </span>

            </div>


            <div class="asignacion-aviso-pendiente">

                <label>
                    Asignar a vehículo
                </label>

                <div class="control-asignacion-aviso">

                    <select
                        id="asignar-aviso-${escaparHTML(idAviso)}"
                    >
                        ${crearOpcionesVehiculosAsignacion(aviso)}
                    </select>

                    <button
                        type="button"
                        class="boton-secundario boton-asignar-aviso"
                        onclick="asignarAvisoAVehiculo('${escaparHTML(idAviso)}')"
                    >
                        Asignar
                    </button>

                </div>

            </div>

        </article>
    `;
}


// ============================================================
// ASIGNAR AVISO A VEHÍCULO
// ============================================================

function asignarAvisoAVehiculo(
    avisoId
) {

    const selector =
        document.getElementById(
            `asignar-aviso-${avisoId}`
        );

    if (!selector) {

        console.warn(
            "No se encuentra el selector del aviso:",
            avisoId
        );

        return;
    }

    const vehiculoId =
        selector.value;

    if (!vehiculoId) {

        alert(
            "Selecciona primero el vehículo al que quieres asignar el aviso."
        );

        return;
    }

    const datos =
        window.DATOS_MOCK || {};

    const avisos =
        Array.isArray(datos.AVISOS)
            ? datos.AVISOS
            : [];

    const aviso =
        avisos.find(item => {

            const id =
                item.id_aviso ||
                item.id;

            return id === avisoId;
        });

    if (!aviso) {

        console.warn(
            "No se encuentra el aviso:",
            avisoId
        );

        return;
    }


    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {

        alert(
            "No se ha encontrado la planificación del vehículo seleccionado."
        );

        return;
    }


    const yaExiste =
        plan.paradas.some(parada => {

            return (
                parada.tipo === "AVISO" &&
                parada.aviso_id === avisoId
            );
        });

    if (yaExiste) {

        alert(
            "Este aviso ya está incluido en la planificación del vehículo."
        );

        return;
    }


    const nuevaParada = {

        orden:
            plan.paradas.length + 1,

        tipo:
            "AVISO",

        aviso_id:
            aviso.id_aviso ||
            aviso.id,

        punto_id:
            aviso.puntoId ||
            aviso.punto_id ||
            "",

        nombre:
            aviso.punto ||
            aviso.nombre ||
            "Aviso",

        especie:
            aviso.especie ||
            aviso.especie_reportada ||
            "",

        cantidad:
            aviso.cantidad ||
            1,

        latitud:
            Number(
                aviso.latitud ??
                aviso.lat ??
                0
            ),

        longitud:
            Number(
                aviso.longitud ??
                aviso.lng ??
                0
            ),

        estado:
            "ASIGNADO",

        hora:
            "--:--"
    };


    plan.paradas.push(
        nuevaParada
    );


    aviso.estado =
        "ASIGNADO";

    aviso.vehiculo =
        vehiculoId;


    actualizarOrdenes(
        plan
    );


    renderizarAvisosPendientes();

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );


    console.log(
        `Aviso ${avisoId} asignado a ${vehiculoId}`
    );
}


// ============================================================
// COORDENADAS DEL AVISO
// ============================================================

function formatearCoordenadasAviso(aviso) {

    const latitud =
        aviso.latitud ??
        aviso.lat ??
        "";

    const longitud =
        aviso.longitud ??
        aviso.lng ??
        "";

    if (
        latitud === "" ||
        longitud === ""
    ) {

        return "Coordenadas no disponibles";
    }

    return `${Number(latitud).toFixed(4)}, ${Number(longitud).toFixed(4)}`;
}


// ============================================================
// CARGAR PLANIFICACIÓN
// ============================================================

function cargarPlanificacionDesdeDatos() {

    planificacionDia = {};

    const datos =
        window.DATOS_MOCK || {};

    const vehiculos =
        Array.isArray(datos.VEHICULOS)
            ? datos.VEHICULOS
            : [];

    const planificacion =
        Array.isArray(datos.PLANIFICACION)
            ? datos.PLANIFICACION
            : [];

    vehiculos.forEach(
        (vehiculo, indice) => {

            const idVehiculo =
                vehiculo.id_vehiculo ||
                vehiculo.vehiculo_id ||
                vehiculo.id ||
                `V${indice + 1}`;

            const planVehiculo =
                planificacion.find(plan => {

                    const idPlan =
                        plan.vehiculo_id ||
                        plan.vehiculo ||
                        plan.id_vehiculo;

                    return idPlan === idVehiculo;
                });


            planificacionDia[idVehiculo] = {

                vehiculoId:
                    idVehiculo,

                nombreVehiculo:
                    vehiculo.nombre ||
                    `Vehículo ${indice + 1}`,

                tablet:
                    vehiculo.tablet ||
                    vehiculo.tablet_id ||
                    "",

                rutaHabitual:
                    vehiculo.ruta_id ||
                    vehiculo.rutaHabitual ||
                    vehiculo.ruta_habitual ||
                    "",

                rutaActiva:
                    planVehiculo?.ruta_id ||
                    planVehiculo?.rutaActiva ||
                    vehiculo.ruta_id ||
                    "",

                horaSalida:
                    planVehiculo?.horaSalida ||
                    planVehiculo?.hora_salida ||
                    "08:30",

                horaRegreso:
                    planVehiculo?.horaEstimadaRegreso ||
                    planVehiculo?.hora_regreso ||
                    "13:30",

                paradas:
                    Array.isArray(
                        planVehiculo?.paradas
                    )
                        ? planVehiculo.paradas.map(
                            (parada, index) => ({
                                ...parada,
                                orden: index + 1
                            })
                        )
                        : []
            };
        }
    );
}


// ============================================================
// OBTENER RUTAS
// ============================================================

function obtenerRutasDisponibles() {

    const datos =
        window.DATOS_MOCK || {};

    const rutas =
        Array.isArray(datos.RUTAS)
            ? datos.RUTAS
            : [];

    if (rutas.length) {
        return rutas;
    }

    return [
        {
            ruta_id: "R1",
            nombre: "Norte",
            color: "#1976D2"
        },
        {
            ruta_id: "R2",
            nombre: "Interior",
            color: "#388E3C"
        },
        {
            ruta_id: "R3",
            nombre: "Sur",
            color: "#F57C00"
        }
    ];
}


// ============================================================
// LEYENDA DE RUTAS
// ============================================================

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

    contenedor.innerHTML =
        rutas
            .map(ruta => {

                const id =
                    ruta.ruta_id ||
                    ruta.id ||
                    "";

                const nombre =
                    ruta.nombre ||
                    id;

                const color =
                    ruta.color ||
                    CONFIG.coloresRutas?.[id] ||
                    "#666";

                return `
                    <div class="leyenda-ruta">

                        <span
                            class="leyenda-color"
                            style="background:${color};"
                        ></span>

                        <span>
                            ${escaparHTML(nombre)}
                        </span>

                    </div>
                `;
            })
            .join("");
}


// ============================================================
// RENDERIZAR PLANIFICACIÓN
// ============================================================

function renderizarPlanificacion() {

    const contenedor =
        document.getElementById(
            "planificacion-dia"
        );

    if (!contenedor) {

        console.warn(
            "No se encuentra #planificacion-dia."
        );

        return;
    }

    const vehiculos =
        Object.values(
            planificacionDia
        );

    if (!vehiculos.length) {

        contenedor.innerHTML = `
            <div class="sin-datos">
                No hay vehículos disponibles.
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        vehiculos
            .map(plan => {

                return crearTarjetaVehiculo(
                    plan
                );

            })
            .join("");
}


// ============================================================
// CREAR TARJETA DE VEHÍCULO
// ============================================================

function crearTarjetaVehiculo(plan) {

    const colorRutaHabitual =
        CONFIG.coloresRutas?.[
            plan.rutaHabitual
        ] ||
        "#666";

    const nombreRutaHabitual =
        CONFIG.nombresRutas?.[
            plan.rutaHabitual
        ] ||
        plan.rutaHabitual ||
        "Sin ruta";

    const colorRutaActiva =
        CONFIG.coloresRutas?.[
            plan.rutaActiva
        ] ||
        "#666";

    const nombreRutaActiva =
        CONFIG.nombresRutas?.[
            plan.rutaActiva
        ] ||
        plan.rutaActiva ||
        "Sin ruta";


    const paradasHTML =
        plan.paradas.length
            ? plan.paradas
                .map(
                    (parada, index) =>
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
            `;


    const selectorRutasHTML =
        obtenerRutasDisponibles()
            .map(ruta => {

                const id =
                    ruta.ruta_id ||
                    ruta.id ||
                    "";

                const nombre =
                    ruta.nombre ||
                    id;

                return `
                    <option
                        value="${escaparHTML(id)}"
                        ${
                            id === plan.rutaActiva
                                ? "selected"
                                : ""
                        }
                    >
                        ${escaparHTML(nombre)}
                    </option>
                `;
            })
            .join("");


    return `
        <div
            class="tarjeta-plan-vehiculo"
            data-vehiculo="${escaparHTML(plan.vehiculoId)}"
        >

            <div class="cabecera-plan">

                <div class="identificacion-vehiculo">

                    <span class="icono-vehiculo">
                        🚐
                    </span>

                    <div>

                        <strong>
                            ${escaparHTML(plan.nombreVehiculo)}
                        </strong>

                        <div class="ruta-habitual">

                            <span
                                class="punto-ruta"
                                style="background:${colorRutaHabitual};"
                            ></span>

                            Ruta habitual:
                            ${escaparHTML(nombreRutaHabitual)}

                        </div>

                        <div class="ruta-planificada">

                            <span
                                class="punto-ruta"
                                style="background:${colorRutaActiva};"
                            ></span>

                            Ruta planificada:
                            ${escaparHTML(nombreRutaActiva)}

                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    class="boton-centro-vehiculo"
                    onclick="centrarVehiculoDesdePlan('${escaparHTML(plan.vehiculoId)}')"
                    title="Ver vehículo en el mapa"
                >
                    🗺️
                </button>

            </div>


            <div class="datos-configuracion-plan">

                <div class="campo-plan">

                    <label>
                        Ruta del día
                    </label>

                    <select
                        onchange="cambiarRutaPlanificada(
                            '${escaparHTML(plan.vehiculoId)}',
                            this.value
                        )"
                    >
                        ${selectorRutasHTML}
                    </select>

                </div>


                <div class="campo-plan">

                    <label>
                        Hora de salida
                    </label>

                    <input
                        type="time"
                        value="${escaparHTML(plan.horaSalida)}"
                        onchange="cambiarHoraPlanificacion(
                            '${escaparHTML(plan.vehiculoId)}',
                            'salida',
                            this.value
                        )"
                    >

                </div>


                <div class="campo-plan">

                    <label>
                        Regreso estimado
                    </label>

                    <input
                        type="time"
                        value="${escaparHTML(plan.horaRegreso)}"
                        onchange="cambiarHoraPlanificacion(
                            '${escaparHTML(plan.vehiculoId)}',
                            'regreso',
                            this.value
                        )"
                    >

                </div>

            </div>


            <div class="resumen-plan-vehiculo">

                <span>
                    Tablet:
                    <strong>
                        ${escaparHTML(plan.tablet || "—")}
                    </strong>
                </span>

                <span>
                    Paradas:
                    <strong>
                        ${plan.paradas.length}
                    </strong>
                </span>

            </div>


            <div class="titulo-paradas">
                PARADAS DEL DÍA
            </div>


            <div class="lista-paradas">

                ${paradasHTML}

            </div>


            <div class="selector-anadir-parada">

                <select
                    id="selector-parada-${escaparHTML(plan.vehiculoId)}"
                >

                    <option value="">
                        + Seleccionar aviso o punto...
                    </option>

                    ${crearOpcionesAvisos(plan)}

                    ${crearOpcionesPuntos(plan)}

                </select>


                <button
                    type="button"
                    class="boton-secundario"
                    onclick="anadirParadaSeleccionada(
                        '${escaparHTML(plan.vehiculoId)}'
                    )"
                >
                    Añadir
                </button>

            </div>


            <div class="acciones-plan">

                <button
                    type="button"
                    onclick="reordenarParadas('${escaparHTML(plan.vehiculoId)}')"
                    class="boton-secundario"
                >
                    ↕ Optimizar orden
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// OPCIONES DE AVISOS
// ============================================================

function crearOpcionesAvisos(plan) {

    const datos =
        window.DATOS_MOCK || {};

    const avisos =
        Array.isArray(datos.AVISOS)
            ? datos.AVISOS
            : [];

    const idsIncluidos =
        new Set(
            plan.paradas
                .map(parada => parada.aviso_id)
                .filter(Boolean)
        );

    const candidatos =
        avisos.filter(aviso => {

            const id =
                aviso.id_aviso ||
                aviso.id;

            const estado =
                normalizarEstadoParada(
                    aviso.estado
                );

            // No mostrar avisos recogidos.
            if (estado === "RECOGIDO") {
                return false;
            }

            // Si ya está en este vehículo, no duplicarlo.
            if (idsIncluidos.has(id)) {
                return false;
            }

            // Si está asignado a otro vehículo, no permitir
            // que aparezca como una segunda asignación.
            if (
                estado === "ASIGNADO" &&
                aviso.vehiculo &&
                String(aviso.vehiculo) !==
                    String(plan.vehiculoId)
            ) {
                return false;
            }

            return true;
        });


    if (!candidatos.length) {
        return "";
    }


    return `
        <optgroup label="Avisos">

            ${
                candidatos
                    .map(aviso => {

                        const id =
                            aviso.id_aviso ||
                            aviso.id;

                        const nombre =
                            aviso.punto ||
                            aviso.nombre ||
                            "Aviso";

                        const especie =
                            aviso.especie
                                ? ` — ${aviso.especie}`
                                : "";

                        return `
                            <option
                                value="AVISO|${escaparHTML(id)}"
                            >
                                ${escaparHTML(nombre + especie)}
                            </option>
                        `;
                    })
                    .join("")
            }

        </optgroup>
    `;
}


// ============================================================
// OPCIONES DE PUNTOS
// ============================================================

function crearOpcionesPuntos(plan) {

    const datos =
        window.DATOS_MOCK || {};

    const puntos =
        Array.isArray(datos.PUNTOS_RECOGIDA)
            ? datos.PUNTOS_RECOGIDA
            : [];

    const puntosIncluidos =
        new Set(
            plan.paradas
                .map(parada => parada.punto_id)
                .filter(Boolean)
        );


    const candidatos =
        puntos.filter(punto => {

            const id =
                punto.id_punto ||
                punto.id;

            return (
                punto.activo !== false &&
                !puntosIncluidos.has(id)
            );
        });


    if (!candidatos.length) {
        return "";
    }


    return `
        <optgroup label="Puntos colaboradores">

            ${
                candidatos
                    .map(punto => {

                        const id =
                            punto.id_punto ||
                            punto.id;

                        const nombre =
                            punto.nombre ||
                            "Punto colaborador";

                        return `
                            <option
                                value="PUNTO|${escaparHTML(id)}"
                            >
                                ${escaparHTML(nombre)}
                            </option>
                        `;
                    })
                    .join("")
            }

        </optgroup>
    `;
}


// ============================================================
// CAMBIAR RUTA PLANIFICADA
// ============================================================

function cambiarRutaPlanificada(
    vehiculoId,
    rutaId
) {

    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        !rutaId
    ) {
        return;
    }

    plan.rutaActiva =
        rutaId;

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );
}


// ============================================================
// CAMBIAR HORAS
// ============================================================

function cambiarHoraPlanificacion(
    vehiculoId,
    tipo,
    valor
) {

    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        !valor
    ) {
        return;
    }

    if (tipo === "salida") {

        plan.horaSalida =
            valor;
    }

    if (tipo === "regreso") {

        plan.horaRegreso =
            valor;
    }

    marcarPlanificacionModificada(
        vehiculoId
    );
}


// ============================================================
// CREAR PARADA DESDE SELECTOR
// ============================================================

function anadirParadaSeleccionada(
    vehiculoId
) {

    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }


    const selector =
        document.getElementById(
            `selector-parada-${vehiculoId}`
        );

    if (
        !selector ||
        !selector.value
    ) {

        alert(
            "Selecciona primero un aviso o un punto."
        );

        return;
    }


    const partes =
        selector.value.split("|");

    const tipo =
        partes[0];

    const id =
        partes[1];

    const datos =
        window.DATOS_MOCK || {};


    if (tipo === "AVISO") {

        const avisos =
            Array.isArray(datos.AVISOS)
                ? datos.AVISOS
                : [];

        const aviso =
            avisos.find(item => {

                return (
                    item.id_aviso ||
                    item.id
                ) === id;
            });


        if (!aviso) {
            return;
        }


        // Evitar duplicar un aviso que ya esté asignado
        // a otro vehículo.
        if (
            String(aviso.estado || "")
                .trim()
                .toUpperCase() === "ASIGNADO" &&
            aviso.vehiculo &&
            String(aviso.vehiculo) !==
                String(vehiculoId)
        ) {

            alert(
                "Este aviso ya está asignado a otro vehículo."
            );

            return;
        }


        plan.paradas.push({

            orden:
                plan.paradas.length + 1,

            tipo:
                "AVISO",

            aviso_id:
                aviso.id_aviso ||
                aviso.id,

            punto_id:
                aviso.puntoId ||
                aviso.punto_id,

            nombre:
                aviso.punto ||
                aviso.nombre ||
                "Aviso",

            especie:
                aviso.especie ||
                "",

            cantidad:
                aviso.cantidad ||
                1,

            latitud:
                Number(
                    aviso.latitud ??
                    aviso.lat ??
                    0
                ),

            longitud:
                Number(
                    aviso.longitud ??
                    aviso.lng ??
                    0
                ),

            estado:
                "ASIGNADO",

            hora:
                "--:--"
        });


        aviso.estado =
            "ASIGNADO";

        aviso.vehiculo =
            vehiculoId;
    }


    if (tipo === "PUNTO") {

        const puntos =
            Array.isArray(datos.PUNTOS_RECOGIDA)
                ? datos.PUNTOS_RECOGIDA
                : [];

        const punto =
            puntos.find(item => {

                return (
                    item.id_punto ||
                    item.id
                ) === id;
            });


        if (!punto) {
            return;
        }


        plan.paradas.push({

            orden:
                plan.paradas.length + 1,

            tipo:
                "PUNTO",

            punto_id:
                punto.id_punto ||
                punto.id,

            nombre:
                punto.nombre ||
                "Punto colaborador",

            latitud:
                Number(punto.latitud),

            longitud:
                Number(punto.longitud),

            estado:
                "PLANIFICADO",

            hora:
                "--:--"
        });
    }


    actualizarOrdenes(
        plan
    );

    renderizarAvisosPendientes();

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );
}


// ============================================================
// CREAR PARADA HTML
// ============================================================

function crearParadaHTML(
    plan,
    parada,
    index
) {

    const estado =
        normalizarEstadoParada(
            parada.estado
        );

    const claseEstado =
        `estado-parada-${estado.toLowerCase()}`;

    const icono =
        obtenerIconoParada(
            parada
        );

    const nombre =
        parada.nombre ||
        parada.punto ||
        "Parada";

    const hora =
        parada.hora ||
        parada.hora_estimada ||
        "--:--";

    const tipo =
        parada.tipo ||
        "PUNTO";


    return `
        <div
            class="parada-plan ${claseEstado}"
            data-vehiculo="${escaparHTML(plan.vehiculoId)}"
            data-indice="${index}"
            onclick="centrarParadaDesdePlan('${escaparHTML(plan.vehiculoId)}', ${index}, event)"
            title="Ver parada en el mapa"
        >

            <div class="numero-parada">
                ${index + 1}
            </div>


            <div class="icono-parada">
                ${icono}
            </div>


            <div class="informacion-parada">

                <strong>
                    ${escaparHTML(nombre)}
                </strong>


                ${
                    parada.especie
                        ? `
                            <div class="especie-parada">
                                ${escaparHTML(parada.especie)}
                            </div>
                        `
                        : ""
                }


                <div class="detalles-parada">

                    <span>
                        ${escaparHTML(tipo)}
                    </span>

                    <span>
                        ${escaparHTML(hora)}
                    </span>

                </div>

            </div>


            <div
                class="acciones-parada"
                onclick="event.stopPropagation()"
            >

                <button
                    type="button"
                    onclick="subirParada(
                        '${escaparHTML(plan.vehiculoId)}',
                        ${index}
                    )"
                    title="Subir parada"
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
                    onclick="bajarParada(
                        '${escaparHTML(plan.vehiculoId)}',
                        ${index}
                    )"
                    title="Bajar parada"
                    ${
                        index === plan.paradas.length - 1
                            ? "disabled"
                            : ""
                    }
                >
                    ↓
                </button>


                <button
                    type="button"
                    onclick="eliminarParada(
                        '${escaparHTML(plan.vehiculoId)}',
                        ${index}
                    )"
                    title="Eliminar parada"
                >
                    ×
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// ESTADOS
// ============================================================

function normalizarEstadoParada(
    estado
) {

    const valor =
        String(estado || "")
            .trim()
            .toUpperCase();

    if (valor === "RECOGIDO") {
        return "RECOGIDO";
    }

    if (valor === "ASIGNADO") {
        return "ASIGNADO";
    }

    if (valor === "PENDIENTE") {
        return "PENDIENTE";
    }

    return "PLANIFICADO";
}


function obtenerTextoEstadoParada(
    estado
) {

    switch (estado) {

        case "RECOGIDO":
            return "✓ Recogido";

        case "ASIGNADO":
            return "Asignado";

        case "PENDIENTE":
            return "Pendiente";

        default:
            return "Planificado";
    }
}


function obtenerIconoParada(
    parada
) {

    const tipo =
        String(parada.tipo || "")
            .toUpperCase();

    if (tipo === "AVISO") {
        return "🔔";
    }

    if (tipo === "PUNTO") {
        return "📍";
    }

    return "📌";
}


// ============================================================
// CENTRAR PARADA EN MAPA
// ============================================================

function centrarParadaDesdePlan(
    vehiculoId,
    indice,
    evento
) {

    if (
        evento &&
        evento.target &&
        evento.target.closest &&
        evento.target.closest(".acciones-parada")
    ) {
        return;
    }

    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }

    const parada =
        plan.paradas[indice];

    if (!parada) {
        return;
    }

    const latitud =
        Number(
            parada.latitud ??
            parada.lat ??
            NaN
        );

    const longitud =
        Number(
            parada.longitud ??
            parada.lng ??
            NaN
        );

    if (
        !Number.isFinite(latitud) ||
        !Number.isFinite(longitud)
    ) {

        console.warn(
            "La parada no tiene coordenadas válidas:",
            parada
        );

        return;
    }


    // Si existe una función específica del mapa,
    // utilizarla.
    if (
        typeof window.centrarParadaEnMapa ===
        "function"
    ) {

        window.centrarParadaEnMapa(
            latitud,
            longitud,
            parada
        );

        return;
    }


    // Compatibilidad con Leaflet directamente.
    if (
        typeof mapa !== "undefined" &&
        mapa &&
        typeof mapa.setView === "function"
    ) {

        mapa.setView(
            [latitud, longitud],
            Math.max(
                mapa.getZoom(),
                14
            )
        );

        return;
    }


    if (
        typeof window.mapa !== "undefined" &&
        window.mapa &&
        typeof window.mapa.setView === "function"
    ) {

        window.mapa.setView(
            [latitud, longitud],
            Math.max(
                window.mapa.getZoom(),
                14
            )
        );

        return;
    }

    console.warn(
        "No se ha encontrado el mapa para centrar la parada."
    );
}


// ============================================================
// REORDENAR PARADAS
// ============================================================

function subirParada(
    vehiculoId,
    indice
) {

    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        indice <= 0
    ) {
        return;
    }


    const temporal =
        plan.paradas[indice - 1];

    plan.paradas[indice - 1] =
        plan.paradas[indice];

    plan.paradas[indice] =
        temporal;


    actualizarOrdenes(
        plan
    );

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );
}


function bajarParada(
    vehiculoId,
    indice
) {

    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        indice >= plan.paradas.length - 1
    ) {
        return;
    }


    const temporal =
        plan.paradas[indice + 1];

    plan.paradas[indice + 1] =
        plan.paradas[indice];

    plan.paradas[indice] =
        temporal;


    actualizarOrdenes(
        plan
    );

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );
}


function actualizarOrdenes(
    plan
) {

    plan.paradas.forEach(
        (parada, index) => {

            parada.orden =
                index + 1;
        }
    );
}


// ============================================================
// ELIMINAR PARADA
// ============================================================

function eliminarParada(
    vehiculoId,
    indice
) {

    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }


    const parada =
        plan.paradas[indice];

    if (!parada) {
        return;
    }


    const nombre =
        parada.nombre ||
        parada.punto ||
        "esta parada";


    const confirmar =
        window.confirm(
            `¿Quieres eliminar "${nombre}" de la planificación de este vehículo?`
        );


    if (!confirmar) {
        return;
    }


    // --------------------------------------------------------
    // Si es un AVISO, devolverlo a PENDIENTE.
    // Si ya está RECOGIDO, conservar ese estado.
    // --------------------------------------------------------

    if (
        String(parada.tipo || "")
            .toUpperCase() === "AVISO"
    ) {

        const datos =
            window.DATOS_MOCK || {};

        const avisos =
            Array.isArray(datos.AVISOS)
                ? datos.AVISOS
                : [];

        const aviso =
            avisos.find(item => {

                const id =
                    item.id_aviso ||
                    item.id;

                return (
                    String(id) ===
                    String(parada.aviso_id)
                );
            });

        if (aviso) {

            const estadoActual =
                String(
                    aviso.estado || ""
                )
                    .trim()
                    .toUpperCase();

            if (estadoActual !== "RECOGIDO") {

                aviso.estado =
                    "PENDIENTE";

                aviso.vehiculo =
                    "";
            }
        }
    }


    plan.paradas.splice(
        indice,
        1
    );


    actualizarOrdenes(
        plan
    );

    renderizarAvisosPendientes();

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );
}


// ============================================================
// OPTIMIZACIÓN FUTURA
// ============================================================

function reordenarParadas(
    vehiculoId
) {

    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        plan.paradas.length < 2
    ) {
        return;
    }


    alert(
        "La optimización automática de la ruta se implementará posteriormente.\n\n" +
        "Por ahora puedes modificar el orden manualmente con ↑ y ↓."
    );
}


// ============================================================
// CENTRAR VEHÍCULO
// ============================================================

function centrarVehiculoDesdePlan(
    vehiculoId
) {

    if (
        typeof centrarVehiculo === "function"
    ) {

        centrarVehiculo(
            vehiculoId
        );

        return;
    }


    if (
        typeof window.centrarVehiculo === "function"
    ) {

        window.centrarVehiculo(
            vehiculoId
        );

        return;
    }


    console.warn(
        "No se ha encontrado la función centrarVehiculo()."
    );
}


// ============================================================
// MARCAR PLANIFICACIÓN MODIFICADA
// ============================================================

function marcarPlanificacionModificada(
    vehiculoId
) {

    const tarjeta =
        document.querySelector(
            `.tarjeta-plan-vehiculo[data-vehiculo="${vehiculoId}"]`
        );

    if (!tarjeta) {
        return;
    }


    tarjeta.classList.add(
        "plan-modificado"
    );


    setTimeout(() => {

        tarjeta.classList.remove(
            "plan-modificado"
        );

    }, 1200);
}


// ============================================================
// UTILIDADES
// ============================================================

function escaparHTML(
    valor
) {

    return String(
        valor ?? ""
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


// ============================================================
// COMPATIBILIDAD
// ============================================================

window.inicializarPlanificacion =
    inicializarPlanificacion;

window.renderizarLeyendaRutas =
    renderizarLeyendaRutas;

window.renderizarPlanificacion =
    renderizarPlanificacion;

window.cambiarRutaPlanificada =
    cambiarRutaPlanificada;

window.cambiarHoraPlanificacion =
    cambiarHoraPlanificacion;

window.anadirParadaSeleccionada =
    anadirParadaSeleccionada;

window.asignarAvisoAVehiculo =
    asignarAvisoAVehiculo;

window.eliminarParada =
    eliminarParada;

window.subirParada =
    subirParada;

window.bajarParada =
    bajarParada;

window.reordenarParadas =
    reordenarParadas;

window.centrarVehiculoDesdePlan =
    centrarVehiculoDesdePlan;

window.centrarParadaDesdePlan =
    centrarParadaDesdePlan;
