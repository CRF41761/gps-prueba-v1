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

    renderizarPlanificacion();
}


// ============================================================
// CARGAR PLANIFICACIÓN
// ============================================================

function cargarPlanificacionDesdeDatos() {

    planificacionDia = {};

    const datos = window.DATOS_MOCK || {};

    const vehiculos = Array.isArray(datos.VEHICULOS)
        ? datos.VEHICULOS
        : [];

    const planificacion = Array.isArray(datos.PLANIFICACION)
        ? datos.PLANIFICACION
        : [];

    vehiculos.forEach((vehiculo, indice) => {

        const idVehiculo =
            vehiculo.id_vehiculo ||
            vehiculo.vehiculo_id ||
            vehiculo.id ||
            `V${indice + 1}`;

        const planVehiculo = planificacion.find(plan => {

            const idPlan =
                plan.vehiculo_id ||
                plan.vehiculo ||
                plan.id_vehiculo;

            return idPlan === idVehiculo;
        });

        planificacionDia[idVehiculo] = {

            vehiculoId: idVehiculo,

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

            paradas: Array.isArray(planVehiculo?.paradas)
                ? planVehiculo.paradas.map((parada, index) => ({
                    ...parada,
                    orden: index + 1
                }))
                : []
        };
    });
}


// ============================================================
// OBTENER RUTAS
// ============================================================

function obtenerRutasDisponibles() {

    const datos = window.DATOS_MOCK || {};

    const rutas = Array.isArray(datos.RUTAS)
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
        document.getElementById("leyenda-rutas");

    if (!contenedor) {
        return;
    }

    const rutas =
        obtenerRutasDisponibles();

    contenedor.innerHTML =
        rutas.map(ruta => {

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

        }).join("");
}


// ============================================================
// RENDERIZAR PLANIFICACIÓN
// ============================================================

function renderizarPlanificacion() {

    const contenedor =
        document.getElementById("planificacion-dia");

    if (!contenedor) {
        console.warn(
            "No se encuentra #planificacion-dia."
        );

        return;
    }

    const vehiculos =
        Object.values(planificacionDia);

    if (!vehiculos.length) {

        contenedor.innerHTML = `
            <div class="sin-datos">
                No hay vehículos disponibles.
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        vehiculos.map(plan => {

            return crearTarjetaVehiculo(plan);

        }).join("");
}


// ============================================================
// CREAR TARJETA DE VEHÍCULO
// ============================================================

function crearTarjetaVehiculo(plan) {

    const colorRutaHabitual =
        CONFIG.coloresRutas?.[plan.rutaHabitual] ||
        "#666";

    const nombreRutaHabitual =
        CONFIG.nombresRutas?.[plan.rutaHabitual] ||
        plan.rutaHabitual ||
        "Sin ruta";

    const colorRutaActiva =
        CONFIG.coloresRutas?.[plan.rutaActiva] ||
        "#666";

    const nombreRutaActiva =
        CONFIG.nombresRutas?.[plan.rutaActiva] ||
        plan.rutaActiva ||
        "Sin ruta";

    const paradasHTML =
        plan.paradas.length
            ? plan.paradas.map((parada, index) =>
                crearParadaHTML(plan, parada, index)
            ).join("")
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
                        ${id === plan.rutaActiva ? "selected" : ""}
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

            return (
                estado !== "RECOGIDO" &&
                !idsIncluidos.has(id)
            );
        });

    if (!candidatos.length) {
        return "";
    }

    return `
        <optgroup label="Avisos">

            ${candidatos.map(aviso => {

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

            }).join("")}

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

            ${candidatos.map(punto => {

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

            }).join("")}

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

    if (!plan || !rutaId) {
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

    if (!plan || !valor) {
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

    if (!selector || !selector.value) {
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
                Number(aviso.latitud),

            longitud:
                Number(aviso.longitud),

            estado:
                aviso.estado ||
                "PENDIENTE",

            hora:
                "--:--"
        });
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

    actualizarOrdenes(plan);

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
        obtenerIconoParada(parada);

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


            <div class="estado-parada">
                ${obtenerTextoEstadoParada(estado)}
            </div>


            <div class="acciones-parada">

                <button
                    type="button"
                    onclick="subirParada(
                        '${escaparHTML(plan.vehiculoId)}',
                        ${index}
                    )"
                    title="Subir parada"
                    ${index === 0 ? "disabled" : ""}
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

function normalizarEstadoParada(estado) {

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


function obtenerTextoEstadoParada(estado) {

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


function obtenerIconoParada(parada) {

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
// REORDENAR PARADAS
// ============================================================

function subirParada(
    vehiculoId,
    indice
) {

    const plan =
        planificacionDia[vehiculoId];

    if (!plan || indice <= 0) {
        return;
    }

    const temporal =
        plan.paradas[indice - 1];

    plan.paradas[indice - 1] =
        plan.paradas[indice];

    plan.paradas[indice] =
        temporal;

    actualizarOrdenes(plan);

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

    actualizarOrdenes(plan);

    renderizarPlanificacion();

    marcarPlanificacionModificada(
        vehiculoId
    );
}


function actualizarOrdenes(plan) {

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

    plan.paradas.splice(
        indice,
        1
    );

    actualizarOrdenes(plan);

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

function escaparHTML(valor) {

    return String(valor ?? "")
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
