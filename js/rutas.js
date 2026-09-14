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

    // Crear estructura para todos los vehículos activos
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

            rutaHabitual:
                vehiculo.ruta_id ||
                vehiculo.rutaHabitual ||
                vehiculo.ruta_habitual ||
                "",

            horaSalida:
                planVehiculo?.horaSalida ||
                planVehiculo?.hora_salida ||
                "08:30",

            horaRegreso:
                planVehiculo?.horaEstimadaRegreso ||
                planVehiculo?.hora_regreso ||
                "13:30",

            rutaActiva:
                planVehiculo?.ruta_id ||
                planVehiculo?.rutaActiva ||
                vehiculo.ruta_id ||
                "",

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
// LEYENDA DE RUTAS
// ============================================================

function renderizarLeyendaRutas() {

    const contenedor =
        document.getElementById("leyenda-rutas");

    if (!contenedor) {
        return;
    }

    const datos = window.DATOS_MOCK || {};

    const rutas = Array.isArray(datos.RUTAS)
        ? datos.RUTAS
        : [];

    const rutasFinales = rutas.length
        ? rutas
        : [
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

    contenedor.innerHTML = rutasFinales.map(ruta => {

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

    contenedor.innerHTML = vehiculos.map(plan => {

        return crearTarjetaVehiculo(plan);

    }).join("");
}


// ============================================================
// CREAR TARJETA DE VEHÍCULO
// ============================================================

function crearTarjetaVehiculo(plan) {

    const colorRuta =
        CONFIG.coloresRutas?.[plan.rutaHabitual] ||
        "#666";

    const nombreRuta =
        CONFIG.nombresRutas?.[plan.rutaHabitual] ||
        plan.rutaHabitual ||
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
                                style="background:${colorRuta};"
                            ></span>

                            Ruta habitual:
                            ${escaparHTML(nombreRuta)}

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


            <div class="horarios-plan">

                <div>
                    <span>Salida</span>
                    <strong>
                        ${escaparHTML(plan.horaSalida)}
                    </strong>
                </div>

                <div>
                    <span>Regreso estimado</span>
                    <strong>
                        ${escaparHTML(plan.horaRegreso)}
                    </strong>
                </div>

            </div>


            <div class="titulo-paradas">
                PARADAS DEL DÍA
            </div>


            <div class="lista-paradas">

                ${paradasHTML}

            </div>


            <div class="acciones-plan">

                <button
                    type="button"
                    onclick="anadirParada('${escaparHTML(plan.vehiculoId)}')"
                    class="boton-secundario"
                >
                    + Añadir parada
                </button>

                <button
                    type="button"
                    onclick="reordenarParadas('${escaparHTML(plan.vehiculoId)}')"
                    class="boton-secundario"
                >
                    ↕ Reordenar
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// CREAR PARADA
// ============================================================

function crearParadaHTML(plan, parada, index) {

    const estado =
        normalizarEstadoParada(parada.estado);

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
                    onclick="subirParada('${escaparHTML(plan.vehiculoId)}', ${index})"
                    title="Subir parada"
                    ${index === 0 ? "disabled" : ""}
                >
                    ↑
                </button>

                <button
                    type="button"
                    onclick="bajarParada('${escaparHTML(plan.vehiculoId)}', ${index})"
                    title="Bajar parada"
                    ${index === plan.paradas.length - 1 ? "disabled" : ""}
                >
                    ↓
                </button>

                <button
                    type="button"
                    onclick="eliminarParada('${escaparHTML(plan.vehiculoId)}', ${index})"
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
// REORDENAR
// ============================================================

function subirParada(vehiculoId, indice) {

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

    marcarPlanificacionModificada(vehiculoId);
}


function bajarParada(vehiculoId, indice) {

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

    marcarPlanificacionModificada(vehiculoId);
}


function actualizarOrdenes(plan) {

    plan.paradas.forEach((parada, index) => {

        parada.orden =
            index + 1;

    });
}


// ============================================================
// ELIMINAR PARADA
// ============================================================

function eliminarParada(vehiculoId, indice) {

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

    plan.paradas.splice(indice, 1);

    actualizarOrdenes(plan);

    renderizarPlanificacion();

    marcarPlanificacionModificada(vehiculoId);
}


// ============================================================
// AÑADIR PARADA
// ============================================================

function anadirParada(vehiculoId) {

    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }

    const datos =
        window.DATOS_MOCK || {};

    const avisos =
        Array.isArray(datos.AVISOS)
            ? datos.AVISOS
            : [];

    const puntos =
        Array.isArray(datos.PUNTOS_RECOGIDA)
            ? datos.PUNTOS_RECOGIDA
            : [];


    // Buscar avisos que todavía no están
    // incluidos en la planificación

    const idsIncluidos =
        new Set(
            plan.paradas
                .map(parada => parada.aviso_id)
                .filter(Boolean)
        );


    const candidatos =
        avisos.filter(aviso => {

            const estado =
                normalizarEstadoParada(aviso.estado);

            return (
                estado !== "RECOGIDO" &&
                !idsIncluidos.has(
                    aviso.id_aviso || aviso.id
                )
            );

        });


    if (candidatos.length) {

        const aviso =
            candidatos[0];

        plan.paradas.push({

            orden:
                plan.paradas.length + 1,

            tipo:
                "AVISO",

            aviso_id:
                aviso.id_aviso || aviso.id,

            punto_id:
                aviso.puntoId ||
                aviso.punto_id,

            nombre:
                aviso.punto ||
                aviso.nombre ||
                "Aviso",

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

        actualizarOrdenes(plan);

        renderizarPlanificacion();

        marcarPlanificacionModificada(vehiculoId);

        return;
    }


    // Si no quedan avisos, intentar añadir
    // un punto colaborador no incluido

    const puntosIncluidos =
        new Set(
            plan.paradas
                .map(parada => parada.punto_id)
                .filter(Boolean)
        );


    const candidatosPuntos =
        puntos.filter(punto => {

            return (
                punto.activo !== false &&
                !puntosIncluidos.has(
                    punto.id_punto || punto.id
                )
            );

        });


    if (candidatosPuntos.length) {

        const punto =
            candidatosPuntos[0];

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

        actualizarOrdenes(plan);

        renderizarPlanificacion();

        marcarPlanificacionModificada(vehiculoId);

        return;
    }


    alert(
        "No hay más avisos ni puntos colaboradores disponibles para añadir."
    );
}


// ============================================================
// REORDENAR AUTOMÁTICAMENTE
// ============================================================

function reordenarParadas(vehiculoId) {

    const plan =
        planificacionDia[vehiculoId];

    if (!plan || plan.paradas.length < 2) {
        return;
    }

    // Por ahora NO calculamos una ruta geográfica.
    // Simplemente mostramos información al usuario.
    // El algoritmo real de optimización se añadirá
    // posteriormente.

    alert(
        "La optimización automática de la ruta se implementará en el siguiente paso.\n\n" +
        "Por ahora puedes modificar el orden manualmente con ↑ y ↓."
    );
}


// ============================================================
// CENTRAR VEHÍCULO
// ============================================================

function centrarVehiculoDesdePlan(vehiculoId) {

    if (
        typeof centrarVehiculo === "function"
    ) {

        centrarVehiculo(vehiculoId);

        return;
    }

    if (
        typeof window.centrarVehiculo === "function"
    ) {

        window.centrarVehiculo(vehiculoId);

        return;
    }

    console.warn(
        "No se ha encontrado la función centrarVehiculo()."
    );
}


// ============================================================
// AVISAR DE CAMBIO
// ============================================================

function marcarPlanificacionModificada(vehiculoId) {

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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

window.anadirParada =
    anadirParada;

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
