let planificacionDia = {};

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

function inicializarPlanificacion() {
    cargarPlanificacionDesdeDatos();
    renderizarLeyendaRutas();
    renderizarAvisosPendientes();
    renderizarPlanificacion();
}


/* ============================================================
   AVISOS PENDIENTES
   ============================================================ */

function obtenerAvisosPendientes() {
    if (!window.DATOS_MOCK || !Array.isArray(window.DATOS_MOCK.AVISOS)) {
        return [];
    }

    return window.DATOS_MOCK.AVISOS.filter(aviso =>
        String(aviso.estado || "").toUpperCase() === "PENDIENTE"
    );
}


function renderizarAvisosPendientes() {
    const contenedor = document.getElementById("avisos-pendientes-planificacion");
    const contador = document.getElementById("contador-avisos-pendientes");

    if (!contenedor) {
        return;
    }

    const avisos = obtenerAvisosPendientes();

    if (contador) {
        contador.textContent = avisos.length;
    }

    if (avisos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-avisos-pendientes">
                No hay avisos pendientes de asignar.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = avisos
        .map(aviso => crearTarjetaAvisoPendiente(aviso))
        .join("");
}


function crearTarjetaAvisoPendiente(aviso) {
    const vehiculoRecomendado = obtenerVehiculoRecomendado(aviso);
    const opcionesVehiculos = crearOpcionesVehiculosAsignacion(
        aviso,
        vehiculoRecomendado ? vehiculoRecomendado.id : null
    );

    const rutaNombre = obtenerNombreRuta(aviso.ruta);

    return `
        <div class="aviso-pendiente-card">

            <div class="aviso-pendiente-cabecera">
                <div>
                    <strong>${escaparHTML(aviso.punto || "Punto sin nombre")}</strong>
                    <span class="aviso-id">${escaparHTML(aviso.id || "")}</span>
                </div>

                <span class="estado-aviso estado-pendiente">
                    PENDIENTE
                </span>
            </div>

            <div class="aviso-pendiente-datos">

                <div>
                    <span class="dato-label">Ruta geográfica</span>
                    <strong>${escaparHTML(rutaNombre)}</strong>
                </div>

                <div>
                    <span class="dato-label">Especie</span>
                    <strong>${escaparHTML(aviso.especie || "No indicada")}</strong>
                </div>

                <div>
                    <span class="dato-label">Cantidad</span>
                    <strong>${escaparHTML(String(aviso.cantidad || 1))}</strong>
                </div>

                <div>
                    <span class="dato-label">Teléfono</span>
                    <strong>${escaparHTML(aviso.telefono || "No indicado")}</strong>
                </div>

            </div>

            ${
                aviso.observaciones
                    ? `
                        <div class="aviso-observaciones">
                            <span class="dato-label">Observaciones</span>
                            <div>${escaparHTML(aviso.observaciones)}</div>
                        </div>
                    `
                    : ""
            }

            <div class="aviso-coordenadas">
                ${formatearCoordenadasAviso(aviso)}
            </div>

            ${
                vehiculoRecomendado
                    ? `
                        <div class="recomendacion-vehiculo">
                            <span class="recomendacion-icono">★</span>
                            <div>
                                <strong>Vehículo recomendado</strong>
                                <span>
                                    ${escaparHTML(vehiculoRecomendado.nombre)}
                                    · ${escaparHTML(vehiculoRecomendado.motivo)}
                                </span>
                            </div>
                        </div>
                    `
                    : ""
            }

            <div class="asignacion-aviso">

                <label for="vehiculo-${escaparHTML(aviso.id)}">
                    Vehículo
                </label>

                <div class="asignacion-aviso-controles">

                    <select
                        id="vehiculo-${escaparHTML(aviso.id)}"
                        class="selector-vehiculo-aviso"
                    >
                        ${opcionesVehiculos}
                    </select>

                    <button
                        type="button"
                        class="btn-asignar-aviso"
                        onclick="asignarAvisoAVehiculo('${escaparHTML(aviso.id)}')"
                    >
                        Asignar
                    </button>

                </div>

            </div>

        </div>
    `;
}


/* ============================================================
   ASIGNACIÓN INTELIGENTE DE VEHÍCULOS
   ============================================================ */

/*
 * Calcula el vehículo más coherente para un aviso.
 *
 * Prioridad:
 * 1. Vehículo activo.
 * 2. Coincidencia con la ruta planificada del día.
 * 3. Coincidencia con la ruta habitual.
 * 4. Proximidad a las paradas que ya tiene planificadas.
 * 5. Proximidad a la posición GPS actual.
 *
 * IMPORTANTE:
 * La "ruta" del aviso sigue siendo independiente del vehículo.
 * Que un aviso sea R1 no significa que obligatoriamente tenga
 * que realizarlo V1.
 */

function obtenerVehiculoRecomendado(aviso) {
    const vehiculos = obtenerVehiculosDisponibles();

    if (!vehiculos.length) {
        return null;
    }

    const candidatos = vehiculos
        .map(vehiculo => evaluarVehiculoParaAviso(vehiculo, aviso))
        .sort((a, b) => b.puntuacion - a.puntuacion);

    return candidatos.length ? candidatos[0] : null;
}


function evaluarVehiculoParaAviso(vehiculo, aviso) {
    const plan = planificacionDia[vehiculo.id];

    let puntuacion = 0;
    const motivos = [];

    const rutaAviso = String(aviso.ruta || "").toUpperCase();

    const rutaPlanificada = plan
        ? String(plan.rutaActiva || "").toUpperCase()
        : "";

    const rutaHabitual = String(
        vehiculo.rutaHabitual || ""
    ).toUpperCase();


    /* --------------------------------------------------------
       Coincidencia con ruta planificada
       -------------------------------------------------------- */

    if (rutaAviso && rutaPlanificada && rutaAviso === rutaPlanificada) {
        puntuacion += 100;
        motivos.push("misma ruta planificada");
    }


    /* --------------------------------------------------------
       Coincidencia con ruta habitual
       -------------------------------------------------------- */

    if (rutaAviso && rutaHabitual && rutaAviso === rutaHabitual) {
        puntuacion += 50;

        if (!motivos.includes("misma ruta planificada")) {
            motivos.push("ruta habitual");
        }
    }


    /* --------------------------------------------------------
       Proximidad a las paradas ya planificadas
       -------------------------------------------------------- */

    const distanciaParada = obtenerDistanciaAvisoAParadasPlanificadas(
        aviso,
        plan
    );

    if (distanciaParada !== null) {
        if (distanciaParada <= 5) {
            puntuacion += 40;
            motivos.push("muy cerca de otra parada");
        } else if (distanciaParada <= 15) {
            puntuacion += 25;
            motivos.push("cerca de otra parada");
        } else if (distanciaParada <= 30) {
            puntuacion += 10;
        }
    }


    /* --------------------------------------------------------
       Proximidad a posición GPS del vehículo
       -------------------------------------------------------- */

    const distanciaGPS = obtenerDistanciaAvisoAVehiculo(
        aviso,
        vehiculo.id
    );

    if (distanciaGPS !== null) {
        if (distanciaGPS <= 5) {
            puntuacion += 20;
            motivos.push("vehículo próximo");
        } else if (distanciaGPS <= 15) {
            puntuacion += 10;
        }
    }


    /* --------------------------------------------------------
       Motivo final
       -------------------------------------------------------- */

    let motivo = "mejor combinación disponible";

    if (motivos.length) {
        motivo = motivos.slice(0, 2).join(" + ");
    }

    return {
        ...vehiculo,
        puntuacion,
        motivo,
        distanciaParada,
        distanciaGPS
    };
}


function obtenerDistanciaAvisoAParadasPlanificadas(aviso, plan) {
    if (
        !plan ||
        !Array.isArray(plan.paradas) ||
        !plan.paradas.length
    ) {
        return null;
    }

    const latAviso = obtenerLat(aviso);
    const lngAviso = obtenerLng(aviso);

    if (!coordenadasValidas(latAviso, lngAviso)) {
        return null;
    }

    let distanciaMinima = null;

    plan.paradas.forEach(parada => {
        const lat = obtenerLat(parada);
        const lng = obtenerLng(parada);

        if (!coordenadasValidas(lat, lng)) {
            return;
        }

        const distancia = calcularDistanciaKm(
            latAviso,
            lngAviso,
            lat,
            lng
        );

        if (
            distanciaMinima === null ||
            distancia < distanciaMinima
        ) {
            distanciaMinima = distancia;
        }
    });

    return distanciaMinima;
}


function obtenerDistanciaAvisoAVehiculo(aviso, vehiculoId) {
    if (
        !window.DATOS_MOCK ||
        !window.DATOS_MOCK.POSICIONES
    ) {
        return null;
    }

    let posicion = window.DATOS_MOCK.POSICIONES;

    if (Array.isArray(posicion)) {
        posicion = posicion.find(p =>
            obtenerIdVehiculo(p) === vehiculoId
        );
    } else {
        posicion = posicion[vehiculoId];
    }

    if (!posicion) {
        return null;
    }

    const latAviso = obtenerLat(aviso);
    const lngAviso = obtenerLng(aviso);
    const latVehiculo = obtenerLat(posicion);
    const lngVehiculo = obtenerLng(posicion);

    if (
        !coordenadasValidas(latAviso, lngAviso) ||
        !coordenadasValidas(latVehiculo, lngVehiculo)
    ) {
        return null;
    }

    return calcularDistanciaKm(
        latAviso,
        lngAviso,
        latVehiculo,
        lngVehiculo
    );
}


function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
    const radioTierra = 6371;

    const dLat = gradosARadianes(lat2 - lat1);
    const dLng = gradosARadianes(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(gradosARadianes(lat1)) *
        Math.cos(gradosARadianes(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return radioTierra * c;
}


function gradosARadianes(grados) {
    return grados * Math.PI / 180;
}


/* ============================================================
   VEHÍCULOS DISPONIBLES
   ============================================================ */

function obtenerVehiculosDisponibles() {
    if (
        !window.DATOS_MOCK ||
        !Array.isArray(window.DATOS_MOCK.VEHICULOS)
    ) {
        return [];
    }

    return window.DATOS_MOCK.VEHICULOS.filter(
        vehiculo => vehiculo.activo !== false
    );
}


function crearOpcionesVehiculosAsignacion(aviso, vehiculoRecomendadoId) {
    const vehiculos = obtenerVehiculosDisponibles();

    let html = `
        <option value="">
            Seleccionar vehículo...
        </option>
    `;

    vehiculos.forEach(vehiculo => {
        const esRecomendado =
            vehiculo.id === vehiculoRecomendadoId;

        html += `
            <option
                value="${escaparHTML(vehiculo.id)}"
                ${esRecomendado ? "selected" : ""}
            >
                ${esRecomendado ? "★ " : ""}
                ${escaparHTML(vehiculo.nombre)}
                ${vehiculo.rutaHabitual
                    ? ` · ${escaparHTML(obtenerNombreRuta(vehiculo.rutaHabitual))}`
                    : ""}
            </option>
        `;
    });

    return html;
}


/* ============================================================
   ASIGNAR AVISO A VEHÍCULO
   ============================================================ */

function asignarAvisoAVehiculo(avisoId) {
    const selector = document.getElementById(
        `vehiculo-${avisoId}`
    );

    if (!selector) {
        console.error(
            "No se encontró el selector del aviso:",
            avisoId
        );
        return;
    }

    const vehiculoId = selector.value;

    if (!vehiculoId) {
        alert("Selecciona un vehículo para asignar el aviso.");
        return;
    }

    const avisos = window.DATOS_MOCK?.AVISOS || [];

    const aviso = avisos.find(
        item => String(item.id) === String(avisoId)
    );

    if (!aviso) {
        alert("No se ha encontrado el aviso.");
        return;
    }

    const plan = planificacionDia[vehiculoId];

    if (!plan) {
        alert(
            "El vehículo seleccionado no tiene una planificación creada."
        );
        return;
    }


    /* --------------------------------------------------------
       Comprobar si ya está en ese plan
       -------------------------------------------------------- */

    const yaExiste = plan.paradas.some(parada =>
        parada.tipo === "AVISO" &&
        String(parada.avisoId || parada.id) === String(avisoId)
    );

    if (yaExiste) {
        alert(
            "Este aviso ya está incluido en las paradas del vehículo."
        );
        return;
    }


    /* --------------------------------------------------------
       Comprobar si está en otro vehículo
       -------------------------------------------------------- */

    const otroVehiculo = encontrarVehiculoConAviso(avisoId);

    if (otroVehiculo && otroVehiculo !== vehiculoId) {
        const confirmar = confirm(
            `El aviso ${avisoId} ya está asignado a ${obtenerNombreVehiculo(otroVehiculo)}.\n\n¿Quieres moverlo al vehículo seleccionado?`
        );

        if (!confirmar) {
            return;
        }

        quitarAvisoDePlanSinPerderAviso(avisoId, otroVehiculo);
    }


    /* --------------------------------------------------------
       Crear parada
       -------------------------------------------------------- */

    const nuevaParada = {
        orden: plan.paradas.length + 1,
        hora: "",
        nombre: aviso.punto || "Punto de recogida",
        tipo: "AVISO",
        estado: "ASIGNADO",
        avisoId: aviso.id,
        puntoId: aviso.puntoId || null,
        especie: aviso.especie || "",
        cantidad: aviso.cantidad || 1,
        telefono: aviso.telefono || "",
        observaciones: aviso.observaciones || "",
        latitud: obtenerLat(aviso),
        longitud: obtenerLng(aviso)
    };

    plan.paradas.push(nuevaParada);


    /* --------------------------------------------------------
       Actualizar aviso
       -------------------------------------------------------- */

    aviso.estado = "ASIGNADO";
    aviso.vehiculo = vehiculoId;


    actualizarOrdenes(plan);
    marcarPlanificacionModificada();

    renderizarAvisosPendientes();
    renderizarPlanificacion();
}


/* ============================================================
   BUSCAR AVISO EN PLANES
   ============================================================ */

function encontrarVehiculoConAviso(avisoId) {
    for (const vehiculoId of Object.keys(planificacionDia)) {
        const plan = planificacionDia[vehiculoId];

        if (!plan || !Array.isArray(plan.paradas)) {
            continue;
        }

        const encontrado = plan.paradas.some(parada =>
            parada.tipo === "AVISO" &&
            String(parada.avisoId || parada.id) === String(avisoId)
        );

        if (encontrado) {
            return vehiculoId;
        }
    }

    return null;
}


function quitarAvisoDePlanSinPerderAviso(avisoId, vehiculoId) {
    const plan = planificacionDia[vehiculoId];

    if (!plan || !Array.isArray(plan.paradas)) {
        return;
    }

    plan.paradas = plan.paradas.filter(parada =>
        !(
            parada.tipo === "AVISO" &&
            String(parada.avisoId || parada.id) === String(avisoId)
        )
    );

    actualizarOrdenes(plan);
}


/* ============================================================
   FORMATO DE COORDENADAS
   ============================================================ */

function formatearCoordenadasAviso(aviso) {
    const lat = obtenerLat(aviso);
    const lng = obtenerLng(aviso);

    if (!coordenadasValidas(lat, lng)) {
        return "Coordenadas no disponibles";
    }

    return `
        Coordenadas:
        ${Number(lat).toFixed(5)},
        ${Number(lng).toFixed(5)}
    `;
}


/* ============================================================
   CARGAR PLANIFICACIÓN
   ============================================================ */

function cargarPlanificacionDesdeDatos() {
    planificacionDia = {};

    const vehiculos =
        window.DATOS_MOCK?.VEHICULOS || [];

    const planificacion =
        window.DATOS_MOCK?.PLANIFICACION_DIA ||
        window.DATOS_MOCK?.PLANIFICACION ||
        [];

    vehiculos.forEach(vehiculo => {
        planificacionDia[vehiculo.id] = {
            vehiculoId: vehiculo.id,
            vehiculoNombre:
                vehiculo.nombre || vehiculo.id,

            rutaHabitual:
                vehiculo.rutaHabitual || "",

            rutaActiva: vehiculo.rutaHabitual || "",

            rutaNombre:
                obtenerNombreRuta(
                    vehiculo.rutaHabitual
                ),

            horaSalida: "",
            horaEstimadaRegreso: "",

            tablet:
                vehiculo.tablet || "",

            paradas: []
        };
    });


    if (Array.isArray(planificacion)) {
        planificacion.forEach(planOriginal => {
            const vehiculoId =
                planOriginal.vehiculo ||
                planOriginal.vehiculoId;

            if (!vehiculoId) {
                return;
            }

            if (!planificacionDia[vehiculoId]) {
                planificacionDia[vehiculoId] = {
                    vehiculoId,
                    vehiculoNombre: vehiculoId,
                    rutaHabitual: "",
                    rutaActiva:
                        planOriginal.rutaActiva || "",
                    rutaNombre:
                        planOriginal.rutaNombre ||
                        obtenerNombreRuta(
                            planOriginal.rutaActiva
                        ),
                    horaSalida: "",
                    horaEstimadaRegreso: "",
                    tablet: "",
                    paradas: []
                };
            }

            const plan =
                planificacionDia[vehiculoId];

            plan.rutaActiva =
                planOriginal.rutaActiva ||
                plan.rutaActiva;

            plan.rutaNombre =
                planOriginal.rutaNombre ||
                obtenerNombreRuta(
                    plan.rutaActiva
                );

            plan.horaSalida =
                planOriginal.horaSalida || "";

            plan.horaEstimadaRegreso =
                planOriginal.horaEstimadaRegreso || "";

            plan.paradas =
                Array.isArray(planOriginal.paradas)
                    ? planOriginal.paradas.map(
                        parada => ({
                            ...parada,
                            avisoId:
                                parada.avisoId ||
                                (
                                    parada.tipo === "AVISO"
                                        ? parada.id
                                        : null
                                )
                        })
                    )
                    : [];
        });
    }
}


/* ============================================================
   RUTAS
   ============================================================ */

function obtenerRutasDisponibles() {
    return window.DATOS_MOCK?.RUTAS || [];
}


function obtenerNombreRuta(rutaId) {
    if (!rutaId) {
        return "Sin ruta";
    }

    const rutas = obtenerRutasDisponibles();

    const ruta = rutas.find(
        item => String(item.id) === String(rutaId)
    );

    if (ruta) {
        return ruta.nombre;
    }

    if (typeof CONFIG !== "undefined" &&
        CONFIG.nombresRutas &&
        CONFIG.nombresRutas[rutaId]) {
        return CONFIG.nombresRutas[rutaId];
    }

    return rutaId;
}


function obtenerColorRuta(rutaId) {
    const rutas = obtenerRutasDisponibles();

    const ruta = rutas.find(
        item => String(item.id) === String(rutaId)
    );

    if (ruta && ruta.color) {
        return ruta.color;
    }

    if (
        typeof CONFIG !== "undefined" &&
        CONFIG.coloresRutas &&
        CONFIG.coloresRutas[rutaId]
    ) {
        return CONFIG.coloresRutas[rutaId];
    }

    return "#777777";
}


function renderizarLeyendaRutas() {
    const contenedor =
        document.getElementById("leyenda-rutas");

    if (!contenedor) {
        return;
    }

    const rutas = obtenerRutasDisponibles();

    contenedor.innerHTML = rutas.map(ruta => `
        <div class="leyenda-ruta">
            <span
                class="leyenda-color"
                style="background:${escaparHTML(ruta.color || "#777")}"
            ></span>

            <span>
                ${escaparHTML(ruta.nombre || ruta.id)}
            </span>
        </div>
    `).join("");
}


/* ============================================================
   RENDERIZAR PLANIFICACIÓN
   ============================================================ */

function renderizarPlanificacion() {
    const contenedor =
        document.getElementById("planificacion-dia");

    if (!contenedor) {
        return;
    }

    const planes =
        Object.values(planificacionDia);

    if (!planes.length) {
        contenedor.innerHTML = `
            <div class="sin-planificacion">
                No hay vehículos disponibles.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = planes
        .map(plan => crearTarjetaVehiculo(plan))
        .join("");
}


function crearTarjetaVehiculo(plan) {
    const rutaColor =
        obtenerColorRuta(plan.rutaActiva);

    return `
        <div
            class="tarjeta-vehiculo-plan"
            data-vehiculo="${escaparHTML(plan.vehiculoId)}"
        >

            <div class="cabecera-vehiculo-plan">

                <div>
                    <strong>
                        ${escaparHTML(plan.vehiculoNombre)}
                    </strong>

                    <span class="vehiculo-ruta-habitual">
                        Ruta habitual:
                        ${escaparHTML(
                            obtenerNombreRuta(
                                plan.rutaHabitual
                            )
                        )}
                    </span>
                </div>

                <span
                    class="indicador-ruta-plan"
                    style="background:${escaparHTML(rutaColor)}"
                >
                    ${escaparHTML(
                        plan.rutaNombre ||
                        obtenerNombreRuta(plan.rutaActiva)
                    )}
                </span>

            </div>


            <div class="configuracion-vehiculo-plan">

                <div class="campo-plan">

                    <label>Ruta del día</label>

                    <select
                        onchange="cambiarRutaPlanificada(
                            '${escaparHTML(plan.vehiculoId)}',
                            this.value
                        )"
                    >
                        ${crearOpcionesRutas(plan.rutaActiva)}
                    </select>

                </div>


                <div class="campo-plan">

                    <label>Salida</label>

                    <input
                        type="time"
                        value="${escaparHTML(plan.horaSalida || "")}"
                        onchange="cambiarHoraPlanificacion(
                            '${escaparHTML(plan.vehiculoId)}',
                            'salida',
                            this.value
                        )"
                    >

                </div>


                <div class="campo-plan">

                    <label>Regreso estimado</label>

                    <input
                        type="time"
                        value="${escaparHTML(plan.horaEstimadaRegreso || "")}"
                        onchange="cambiarHoraPlanificacion(
                            '${escaparHTML(plan.vehiculoId)}',
                            'regreso',
                            this.value
                        )"
                    >

                </div>

            </div>


            <div class="resumen-vehiculo-plan">

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


            <div class="titulo-paradas-dia">
                PARADAS DEL DÍA
            </div>


            <div class="lista-paradas-dia">

                ${
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
                        `
                }

            </div>


            <div class="anadir-parada-plan">

                <select
                    onchange="anadirParadaSeleccionada(
                        '${escaparHTML(plan.vehiculoId)}',
                        this.value
                    )"
                >

                    <option value="">
                        + Añadir parada...
                    </option>

                    <optgroup label="Avisos">

                        ${crearOpcionesAvisos(plan)}

                    </optgroup>

                    <optgroup label="Puntos habituales">

                        ${crearOpcionesPuntos(plan)}

                    </optgroup>

                </select>

            </div>


            <div class="acciones-plan-vehiculo">

                <button
                    type="button"
                    onclick="reordenarParadas(
                        '${escaparHTML(plan.vehiculoId)}'
                    )"
                >
                    Optimizar orden
                </button>

                <button
                    type="button"
                    onclick="centrarVehiculoDesdePlan(
                        '${escaparHTML(plan.vehiculoId)}'
                    )"
                >
                    Ver vehículo
                </button>

            </div>

        </div>
    `;
}


function crearOpcionesRutas(rutaSeleccionada) {
    const rutas = obtenerRutasDisponibles();

    return rutas.map(ruta => `
        <option
            value="${escaparHTML(ruta.id)}"
            ${String(ruta.id) === String(rutaSeleccionada)
                ? "selected"
                : ""}
        >
            ${escaparHTML(ruta.nombre || ruta.id)}
        </option>
    `).join("");
}


/* ============================================================
   OPCIONES DE AVISOS
   ============================================================ */

function crearOpcionesAvisos(plan) {
    const avisos =
        window.DATOS_MOCK?.AVISOS || [];

    return avisos
        .filter(aviso => {
            const estado =
                String(aviso.estado || "").toUpperCase();

            if (estado === "RECOGIDO") {
                return false;
            }

            const yaIncluido =
                plan.paradas.some(parada =>
                    parada.tipo === "AVISO" &&
                    String(parada.avisoId || parada.id) ===
                    String(aviso.id)
                );

            if (yaIncluido) {
                return false;
            }

            /*
             * No mostramos aquí avisos que ya estén asignados
             * a otro vehículo. Se pueden mover desde la tarjeta
             * de aviso pendiente si es necesario.
             */
            const vehiculoActual =
                encontrarVehiculoConAviso(aviso.id);

            if (
                vehiculoActual &&
                vehiculoActual !== plan.vehiculoId
            ) {
                return false;
            }

            return true;
        })
        .map(aviso => `
            <option value="AVISO:${escaparHTML(aviso.id)}">
                ${escaparHTML(
                    aviso.punto ||
                    "Punto de recogida"
                )}
                ·
                ${escaparHTML(
                    aviso.especie ||
                    "Especie no indicada"
                )}
            </option>
        `)
        .join("");
}


/* ============================================================
   OPCIONES DE PUNTOS
   ============================================================ */

function crearOpcionesPuntos(plan) {
    const puntos =
        window.DATOS_MOCK?.PUNTOS_RECOGIDA || [];

    return puntos
        .filter(punto => punto.activo !== false)
        .map(punto => `
            <option value="PUNTO:${escaparHTML(punto.id)}">
                ${escaparHTML(
                    punto.nombre ||
                    punto.municipio ||
                    punto.id
                )}
            </option>
        `)
        .join("");
}


/* ============================================================
   CAMBIAR RUTA PLANIFICADA
   ============================================================ */

function cambiarRutaPlanificada(vehiculoId, nuevaRuta) {
    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }

    plan.rutaActiva = nuevaRuta;
    plan.rutaNombre =
        obtenerNombreRuta(nuevaRuta);

    marcarPlanificacionModificada();
    renderizarPlanificacion();
}


/* ============================================================
   CAMBIAR HORAS
   ============================================================ */

function cambiarHoraPlanificacion(
    vehiculoId,
    tipo,
    valor
) {
    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }

    if (tipo === "salida") {
        plan.horaSalida = valor;
    }

    if (tipo === "regreso") {
        plan.horaEstimadaRegreso = valor;
    }

    marcarPlanificacionModificada();
}


/* ============================================================
   AÑADIR PARADA
   ============================================================ */

function anadirParadaSeleccionada(
    vehiculoId,
    valor
) {
    if (!valor) {
        return;
    }

    const plan =
        planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }

    const partes = valor.split(":");
    const tipo = partes[0];
    const id = partes.slice(1).join(":");


    /* --------------------------------------------------------
       AVISO
       -------------------------------------------------------- */

    if (tipo === "AVISO") {
        const avisos =
            window.DATOS_MOCK?.AVISOS || [];

        const aviso = avisos.find(
            item => String(item.id) === String(id)
        );

        if (!aviso) {
            alert("No se ha encontrado el aviso.");
            renderizarPlanificacion();
            return;
        }

        const vehiculoActual =
            encontrarVehiculoConAviso(aviso.id);

        if (
            vehiculoActual &&
            vehiculoActual !== vehiculoId
        ) {
            alert(
                `Este aviso ya está asignado a ${obtenerNombreVehiculo(vehiculoActual)}.`
            );

            renderizarPlanificacion();
            return;
        }

        const nuevaParada = {
            orden: plan.paradas.length + 1,
            hora: "",
            nombre:
                aviso.punto ||
                "Punto de recogida",
            tipo: "AVISO",
            estado: "ASIGNADO",
            avisoId: aviso.id,
            puntoId: aviso.puntoId || null,
            especie: aviso.especie || "",
            cantidad: aviso.cantidad || 1,
            telefono: aviso.telefono || "",
            observaciones:
                aviso.observaciones || "",
            latitud: obtenerLat(aviso),
            longitud: obtenerLng(aviso)
        };

        plan.paradas.push(nuevaParada);

        aviso.estado = "ASIGNADO";
        aviso.vehiculo = vehiculoId;
    }


    /* --------------------------------------------------------
       PUNTO
       -------------------------------------------------------- */

    if (tipo === "PUNTO") {
        const puntos =
            window.DATOS_MOCK?.PUNTOS_RECOGIDA || [];

        const punto = puntos.find(
            item => String(item.id) === String(id)
        );

        if (!punto) {
            alert("No se ha encontrado el punto.");
            renderizarPlanificacion();
            return;
        }

        const nuevaParada = {
            orden: plan.paradas.length + 1,
            hora: "",
            nombre:
                punto.nombre ||
                punto.municipio ||
                punto.id,
            tipo: "PUNTO",
            estado: "PLANIFICADO",
            puntoId: punto.id,
            especie: "",
            cantidad: "",
            telefono: "",
            observaciones: "",
            latitud: obtenerLat(punto),
            longitud: obtenerLng(punto)
        };

        plan.paradas.push(nuevaParada);
    }

    actualizarOrdenes(plan);

    marcarPlanificacionModificada();

    renderizarAvisosPendientes();
    renderizarPlanificacion();
}


/* ============================================================
   CREAR HTML DE UNA PARADA
   ============================================================ */

function crearParadaHTML(
    plan,
    parada,
    index
) {
    const esAviso =
        String(parada.tipo || "").toUpperCase() ===
        "AVISO";

    const icono =
        esAviso ? "⚠" : "●";

    const tipoTexto =
        esAviso
            ? "Aviso"
            : "Punto habitual";

    const hora =
        parada.hora
            ? ` · ${escaparHTML(parada.hora)}`
            : "";

    const especie =
        parada.especie
            ? `
                <span class="especie-parada">
                    ${escaparHTML(parada.especie)}
                </span>
              `
            : "";

    /*
     * La parada completa es ahora clicable.
     * mapa.js implementará centrarParadaEnMapa().
     */
    return `
        <div
            class="parada-plan ${esAviso ? "parada-aviso" : "parada-punto"}"
            data-indice="${index}"
            onclick="seleccionarParadaEnMapa(
                '${escaparHTML(plan.vehiculoId)}',
                ${index}
            )"
            title="Mostrar esta parada en el mapa"
        >

            <div class="numero-parada">
                ${index + 1}
            </div>

            <div class="icono-parada">
                ${icono}
            </div>

            <div class="informacion-parada">

                <strong>
                    ${escaparHTML(
                        parada.nombre ||
                        "Parada sin nombre"
                    )}
                </strong>

                <div class="detalles-parada">
                    ${escaparHTML(tipoTexto)}
                    ${hora}
                    ${especie}
                </div>

            </div>

            <div
                class="acciones-parada"
                onclick="event.stopPropagation();"
            >

                <button
                    type="button"
                    onclick="subirParada(
                        '${escaparHTML(plan.vehiculoId)}',
                        ${index}
                    )"
                    title="Subir parada"
                    ${index === 0 ? "disabled" : ""}
                >
                    ▲
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
                    ▼
                </button>

                <button
                    type="button"
                    onclick="eliminarParada(
                        '${escaparHTML(plan.vehiculoId)}',
                        ${index}
                    )"
                    title="Eliminar parada"
                >
                    ✕
                </button>

            </div>

        </div>
    `;
}


/* ============================================================
   SELECCIONAR PARADA EN MAPA
   ============================================================ */

function seleccionarParadaEnMapa(
    vehiculoId,
    indice
) {
    const plan =
        planificacionDia[vehiculoId];

    if (!plan || !plan.paradas[indice]) {
        return;
    }

    const parada =
        plan.paradas[indice];

    /*
     * Esta función se implementará en mapa.js.
     * Dejamos aquí el enlace entre planificación y mapa.
     */
    if (
        typeof centrarParadaEnMapa === "function"
    ) {
        centrarParadaEnMapa(parada);
    } else {
        console.warn(
            "centrarParadaEnMapa() todavía no está disponible en mapa.js."
        );
    }
}


/* ============================================================
   ELIMINAR PARADA
   ============================================================ */

function eliminarParada(
    vehiculoId,
    indice
) {
    const plan =
        planificacionDia[vehiculoId];

    if (!plan || !plan.paradas[indice]) {
        return;
    }

    const parada =
        plan.paradas[indice];

    const confirmar = confirm(
        `¿Eliminar "${parada.nombre || "esta parada"}" de la planificación?`
    );

    if (!confirmar) {
        return;
    }


    /* --------------------------------------------------------
       Si es un AVISO, actualizar también el aviso original.
       -------------------------------------------------------- */

    if (
        String(parada.tipo || "").toUpperCase() ===
        "AVISO"
    ) {
        const avisoId =
            parada.avisoId || parada.id;

        const avisos =
            window.DATOS_MOCK?.AVISOS || [];

        const aviso =
            avisos.find(item =>
                String(item.id) ===
                String(avisoId)
            );

        if (aviso) {
            const estadoActual =
                String(aviso.estado || "")
                    .toUpperCase();

            /*
             * Si todavía no está recogido, vuelve a PENDIENTE.
             */
            if (estadoActual !== "RECOGIDO") {
                aviso.estado = "PENDIENTE";
                aviso.vehiculo = null;
            }
        }
    }


    /* --------------------------------------------------------
       Eliminar de la planificación
       -------------------------------------------------------- */

    plan.paradas.splice(indice, 1);

    actualizarOrdenes(plan);

    marcarPlanificacionModificada();

    renderizarAvisosPendientes();
    renderizarPlanificacion();
}


/* ============================================================
   REORDENAR PARADAS
   ============================================================ */

function subirParada(
    vehiculoId,
    indice
) {
    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        indice <= 0 ||
        indice >= plan.paradas.length
    ) {
        return;
    }

    const temporal =
        plan.paradas[indice - 1];

    plan.paradas[indice - 1] =
        plan.paradas[indice];

    plan.paradas[indice] =
        temporal;

    actualizarOrdenes(plan);

    marcarPlanificacionModificada();
    renderizarPlanificacion();
}


function bajarParada(
    vehiculoId,
    indice
) {
    const plan =
        planificacionDia[vehiculoId];

    if (
        !plan ||
        indice < 0 ||
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

    marcarPlanificacionModificada();
    renderizarPlanificacion();
}


function actualizarOrdenes(plan) {
    if (!plan || !Array.isArray(plan.paradas)) {
        return;
    }

    plan.paradas.forEach(
        (parada, index) => {
            parada.orden = index + 1;
        }
    );
}


/* ============================================================
   OPTIMIZAR ORDEN
   ============================================================ */

function reordenarParadas(vehiculoId) {
    /*
     * Por ahora no alteramos automáticamente el orden.
     * La futura optimización deberá utilizar la red viaria
     * real y no una distancia aérea simple.
     */
    alert(
        "La optimización automática de la ruta se implementará cuando conectemos la planificación con el cálculo de ruta por carretera."
    );
}


/* ============================================================
   CENTRAR VEHÍCULO
   ============================================================ */

function centrarVehiculoDesdePlan(vehiculoId) {
    if (
        typeof centrarVehiculo === "function"
    ) {
        centrarVehiculo(vehiculoId);
        return;
    }

    if (
        typeof centrarTodosLosVehiculos === "function"
    ) {
        centrarTodosLosVehiculos();
    }
}


/* ============================================================
   UTILIDADES DE COORDENADAS
   ============================================================ */

function obtenerLat(objeto) {
    if (!objeto) {
        return null;
    }

    const valor =
        objeto.latitud ??
        objeto.lat ??
        objeto.latitude;

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    const numero =
        Number(String(valor).replace(",", "."));

    return Number.isFinite(numero)
        ? numero
        : null;
}


function obtenerLng(objeto) {
    if (!objeto) {
        return null;
    }

    const valor =
        objeto.longitud ??
        objeto.lng ??
        objeto.lon ??
        objeto.longitude;

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    const numero =
        Number(String(valor).replace(",", "."));

    return Number.isFinite(numero)
        ? numero
        : null;
}


function coordenadasValidas(lat, lng) {
    return (
        Number.isFinite(Number(lat)) &&
        Number.isFinite(Number(lng)) &&
        Number(lat) >= -90 &&
        Number(lat) <= 90 &&
        Number(lng) >= -180 &&
        Number(lng) <= 180
    );
}


function obtenerIdVehiculo(objeto) {
    if (!objeto) {
        return null;
    }

    return (
        objeto.id ||
        objeto.vehiculo ||
        objeto.vehiculoId ||
        null
    );
}


function obtenerNombreVehiculo(vehiculoId) {
    const vehiculos =
        window.DATOS_MOCK?.VEHICULOS || [];

    const vehiculo =
        vehiculos.find(item =>
            String(item.id) ===
            String(vehiculoId)
        );

    return vehiculo
        ? vehiculo.nombre || vehiculo.id
        : vehiculoId;
}


/* ============================================================
   ESTADOS
   ============================================================ */

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

    if (valor === "PLANIFICADO") {
        return "PLANIFICADO";
    }

    return valor || "PLANIFICADO";
}


function obtenerTextoEstadoParada(estado) {
    switch (
        normalizarEstadoParada(estado)
    ) {
        case "RECOGIDO":
            return "Recogido";

        case "ASIGNADO":
            return "Asignado";

        case "PENDIENTE":
            return "Pendiente";

        case "PLANIFICADO":
            return "Planificado";

        default:
            return estado || "";
    }
}


/* ============================================================
   MARCAR CAMBIOS
   ============================================================ */

function marcarPlanificacionModificada() {
    window.planificacionModificada = true;

    const indicador =
        document.getElementById(
            "indicador-planificacion-modificada"
        );

    if (indicador) {
        indicador.style.display = "block";
        indicador.textContent =
            "Planificación modificada";
    }
}


/* ============================================================
   ESCAPAR HTML
   ============================================================ */

function escaparHTML(valor) {
    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

window.asignarAvisoAVehiculo =
    asignarAvisoAVehiculo;

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

window.seleccionarParadaEnMapa =
    seleccionarParadaEnMapa;

window.obtenerVehiculoRecomendado =
    obtenerVehiculoRecomendado;
