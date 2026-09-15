let planificacionDia = {};

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function inicializarPlanificacion() {
    cargarPlanificacionDesdeDatos();
    renderizarLeyendaRutas();
    renderizarAvisosPendientes();
    renderizarPlanificacion();
}


/* =========================================================
   AVISOS PENDIENTES
   ========================================================= */

function obtenerAvisosPendientes() {
    const avisos = window.DATOS_MOCK?.AVISOS || [];

    return avisos.filter(aviso =>
        normalizarEstadoAvisoPlan(aviso.estado) === "PENDIENTE"
    );
}

function normalizarEstadoAvisoPlan(estado) {
    return String(estado || "")
        .trim()
        .toUpperCase();
}

function renderizarAvisosPendientes() {
    const contenedor = document.getElementById("avisos-pendientes-planificacion");
    const contador = document.getElementById("contador-avisos-pendientes");

    if (!contenedor) return;

    const avisos = obtenerAvisosPendientes();

    if (contador) {
        contador.textContent = avisos.length;
    }

    contenedor.innerHTML = "";

    if (!avisos.length) {
        contenedor.innerHTML = `
            <div class="sin-avisos-pendientes">
                <div class="icono-sin-avisos">✓</div>
                <div>No hay avisos pendientes de asignar</div>
            </div>
        `;
        return;
    }

    avisos.forEach(aviso => {
        contenedor.insertAdjacentHTML(
            "beforeend",
            crearTarjetaAvisoPendiente(aviso)
        );
    });
}


/* =========================================================
   TARJETA DE AVISO PENDIENTE
   ========================================================= */

function crearTarjetaAvisoPendiente(aviso) {
    const id = aviso.id || "";
    const especie = aviso.especie || "Especie no indicada";
    const punto = aviso.punto || "Punto de recogida no indicado";
    const cantidad = aviso.cantidad ?? 1;
    const telefono = aviso.telefono || "No indicado";
    const observaciones = aviso.observaciones || "";

    const rutaId = aviso.ruta || "";
    const nombreRuta = obtenerNombreRuta(rutaId);
    const colorRuta = obtenerColorRuta(rutaId);

    const lat = obtenerLatPlan(aviso);
    const lng = obtenerLngPlan(aviso);

    return `
        <article class="tarjeta-aviso-pendiente" data-aviso="${escaparHTMLPlan(id)}">

            <div class="cabecera-aviso-pendiente">

                <div class="icono-aviso-pendiente" aria-hidden="true">
                    🔔
                </div>

                <div class="datos-aviso-pendiente">
                    <div class="titulo-aviso-pendiente">
                        ${escaparHTMLPlan(especie)}
                    </div>

                    <div class="identificador-aviso-pendiente">
                        ${escaparHTMLPlan(id)}
                    </div>
                </div>

                <div class="ruta-aviso-pendiente">
                    <span
                        class="punto-ruta"
                        style="background:${colorRuta};"
                    ></span>
                    ${escaparHTMLPlan(nombreRuta)}
                </div>

            </div>


            <div class="contenido-aviso-pendiente">

                <div class="dato-aviso">
                    <span class="etiqueta-dato">📍 Punto</span>
                    <strong>${escaparHTMLPlan(punto)}</strong>
                </div>

                <div class="dato-aviso">
                    <span class="etiqueta-dato">🐾 Cantidad</span>
                    <strong>${escaparHTMLPlan(String(cantidad))}</strong>
                </div>

                <div class="dato-aviso">
                    <span class="etiqueta-dato">📞 Teléfono</span>
                    <strong>${escaparHTMLPlan(telefono)}</strong>
                </div>

            </div>


            ${
                observaciones
                    ? `
                        <div class="observaciones-aviso-pendiente">
                            <span class="etiqueta-dato">Observaciones</span>
                            <div>${escaparHTMLPlan(observaciones)}</div>
                        </div>
                    `
                    : ""
            }


            <div class="pie-aviso-pendiente">

                <span class="estado-aviso-pendiente">
                    PENDIENTE DE ASIGNACIÓN
                </span>

                ${
                    lat !== null && lng !== null
                        ? `
                            <span class="coordenadas-aviso-pendiente">
                                ${lat.toFixed(5)}, ${lng.toFixed(5)}
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="asignacion-aviso-pendiente">

                <label for="asignar-aviso-${escaparHTMLPlan(id)}">
                    Asignar a vehículo
                </label>

                <div class="control-asignacion-aviso">

                    <select
                        id="asignar-aviso-${escaparHTMLPlan(id)}"
                        aria-label="Seleccionar vehículo para ${escaparHTMLPlan(especie)}"
                    >
                        ${crearOpcionesVehiculosAsignacion(aviso)}
                    </select>

                    <button
                        type="button"
                        class="boton-secundario boton-asignar-aviso"
                        onclick="asignarAvisoAVehiculo('${escaparJSPlan(id)}')"
                    >
                        Asignar
                    </button>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   ASIGNACIÓN DE VEHÍCULO
   ========================================================= */

function crearOpcionesVehiculosAsignacion(aviso) {
    const vehiculos = window.DATOS_MOCK?.VEHICULOS || [];

    const recomendacion = obtenerVehiculoRecomendado(aviso);

    let html = `
        <option value="">
            Seleccionar vehículo...
        </option>
    `;

    vehiculos
        .filter(vehiculo => vehiculo.activo !== false)
        .forEach(vehiculo => {

            const seleccionado =
                String(vehiculo.id) === String(recomendacion)
                    ? " selected"
                    : "";

            html += `
                <option
                    value="${escaparHTMLPlan(vehiculo.id)}"
                    ${seleccionado}
                >
                    ${escaparHTMLPlan(
                        vehiculo.nombre || vehiculo.id
                    )}
                </option>
            `;
        });

    return html;
}


function obtenerVehiculoRecomendado(aviso) {
    const vehiculos = window.DATOS_MOCK?.VEHICULOS || [];

    if (!vehiculos.length || !aviso) {
        return null;
    }

    const rutaAviso = String(aviso.ruta || "")
        .trim()
        .toUpperCase();

    const latAviso = obtenerLatPlan(aviso);
    const lngAviso = obtenerLngPlan(aviso);

    let mejorVehiculo = null;
    let mejorPuntuacion = -Infinity;

    vehiculos
        .filter(vehiculo => vehiculo.activo !== false)
        .forEach(vehiculo => {

            const plan = planificacionDia[vehiculo.id];

            const rutaPlan = String(
                plan?.rutaActiva || ""
            )
                .trim()
                .toUpperCase();

            const rutaHabitual = String(
                vehiculo.rutaHabitual || ""
            )
                .trim()
                .toUpperCase();

            let puntuacion = 0;

            /*
             * 1. RUTA PLANIFICADA DEL DÍA
             * Es el criterio principal.
             */
            if (
                rutaAviso &&
                rutaPlan &&
                rutaAviso === rutaPlan
            ) {
                puntuacion += 1000;
            }

            /*
             * 2. RUTA HABITUAL
             */
            if (
                rutaAviso &&
                rutaHabitual &&
                rutaAviso === rutaHabitual
            ) {
                puntuacion += 300;
            }

            /*
             * 3. EVITAR DUPLICADOS
             */
            const yaTieneAviso = plan?.paradas?.some(parada =>
                String(parada.avisoId || "") ===
                String(aviso.id || "")
            );

            if (yaTieneAviso) {
                puntuacion -= 5000;
            }

            /*
             * 4. PROXIMIDAD A LAS PARADAS
             */
            if (
                latAviso !== null &&
                lngAviso !== null &&
                Array.isArray(plan?.paradas) &&
                plan.paradas.length
            ) {
                let distanciaMinima = Infinity;

                plan.paradas.forEach(parada => {

                    const latParada = obtenerLatPlan(parada);
                    const lngParada = obtenerLngPlan(parada);

                    if (
                        latParada === null ||
                        lngParada === null
                    ) {
                        return;
                    }

                    const distancia = distanciaEnKm(
                        latAviso,
                        lngAviso,
                        latParada,
                        lngParada
                    );

                    if (distancia < distanciaMinima) {
                        distanciaMinima = distancia;
                    }
                });

                if (distanciaMinima < 5) {
                    puntuacion += 100;
                } else if (distanciaMinima < 15) {
                    puntuacion += 50;
                } else if (distanciaMinima < 30) {
                    puntuacion += 20;
                }
            }

            /*
             * 5. SI NO HAY RUTA PLANIFICADA,
             * LA RUTA HABITUAL SIGUE TENIENDO PESO.
             */

            if (!rutaPlan && rutaAviso === rutaHabitual) {
                puntuacion += 200;
            }

            /*
             * En caso de empate se mantiene el primer
             * vehículo encontrado.
             */
            if (puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorVehiculo = vehiculo.id;
            }
        });

    return mejorVehiculo;
}

function asignarAvisoAVehiculo(avisoId) {
    const avisos = window.DATOS_MOCK?.AVISOS || [];
    const aviso = avisos.find(item =>
        String(item.id) === String(avisoId)
    );

    if (!aviso) {
        return;
    }

    const selector = document.getElementById(
        `asignar-aviso-${avisoId}`
    );

    if (!selector || !selector.value) {
        alert("Selecciona un vehículo antes de asignar el aviso.");
        return;
    }

    const vehiculoId = selector.value;
    const plan = planificacionDia[vehiculoId];

    if (!plan) {
        alert("El vehículo seleccionado no tiene planificación.");
        return;
    }

    const yaExiste = plan.paradas.some(parada =>
        String(parada.avisoId || "") === String(aviso.id)
    );

    if (yaExiste) {
        alert("Este aviso ya está incluido en la planificación.");
        return;
    }

    const ultimaOrden = plan.paradas.length
        ? Math.max(
            ...plan.paradas.map(parada =>
                Number(parada.orden) || 0
            )
        )
        : 0;

    plan.paradas.push({
        orden: ultimaOrden + 1,
        hora: "",
        nombre: aviso.punto || "Punto de recogida",
        tipo: "AVISO",
        estado: "ASIGNADO",
        avisoId: aviso.id,
        especie: aviso.especie || "",
        latitud: obtenerLatPlan(aviso),
        longitud: obtenerLngPlan(aviso)
    });

    aviso.estado = "ASIGNADO";
    aviso.vehiculo = vehiculoId;

    renderizarAvisosPendientes();
    renderizarPlanificacion();

    marcarPlanModificado(vehiculoId);
}


/* =========================================================
   PLANIFICACIÓN
   ========================================================= */

function cargarPlanificacionDesdeDatos() {
    planificacionDia = {};

    const vehiculos = window.DATOS_MOCK?.VEHICULOS || [];
    const planes = window.DATOS_MOCK?.PLANIFICACION || [];

    vehiculos.forEach(vehiculo => {

        const planExistente = planes.find(plan =>
            String(plan.vehiculo) === String(vehiculo.id)
        );

        planificacionDia[vehiculo.id] = {
            vehiculo: vehiculo.id,
            rutaActiva:
                planExistente?.rutaActiva ||
                vehiculo.rutaHabitual ||
                "",
            rutaNombre:
                planExistente?.rutaNombre ||
                obtenerNombreRuta(
                    planExistente?.rutaActiva ||
                    vehiculo.rutaHabitual
                ),
            horaSalida:
                planExistente?.horaSalida || "",
            horaEstimadaRegreso:
                planExistente?.horaEstimadaRegreso || "",
            paradas:
                Array.isArray(planExistente?.paradas)
                    ? planExistente.paradas.map(parada => ({
                        ...parada
                    }))
                    : []
        };
    });
}


function renderizarPlanificacion() {
    const contenedor = document.getElementById(
        "contenedor-planificacion"
    );

    if (!contenedor) return;

    const vehiculos = window.DATOS_MOCK?.VEHICULOS || [];

    contenedor.innerHTML = "";

    vehiculos
        .filter(vehiculo => vehiculo.activo !== false)
        .forEach(vehiculo => {
            const plan = planificacionDia[vehiculo.id];

            if (!plan) return;

            contenedor.insertAdjacentHTML(
                "beforeend",
                crearTarjetaVehiculo(vehiculo, plan)
            );
        });
}


function crearTarjetaVehiculo(vehiculo, plan) {
    const rutaHabitual = obtenerNombreRuta(
        vehiculo.rutaHabitual
    );

    const rutaPlanificada = obtenerNombreRuta(
        plan.rutaActiva
    );

    return `
        <article class="tarjeta-plan-vehiculo"
            data-vehiculo="${escaparHTMLPlan(vehiculo.id)}">

            <div class="cabecera-plan">

                <div class="identificacion-vehiculo">

                    <div class="icono-vehiculo">
                        🚐
                    </div>

                    <div>
                        <strong>
                            ${escaparHTMLPlan(
                                vehiculo.nombre || vehiculo.id
                            )}
                        </strong>

                        <div class="ruta-habitual">
                            Ruta habitual: ${escaparHTMLPlan(
                                rutaHabitual
                            )}
                        </div>
                    </div>

                </div>

                <button
                    type="button"
                    class="boton-centro-vehiculo"
                    onclick="centrarVehiculoDesdePlan('${escaparJSPlan(vehiculo.id)}')"
                    title="Centrar vehículo en el mapa"
                >
                    📍
                </button>

            </div>


            <div class="datos-configuracion-plan">

                <div class="campo-plan">
                    <label for="ruta-plan-${escaparHTMLPlan(vehiculo.id)}">
                        Ruta planificada
                    </label>

                    <select
                        id="ruta-plan-${escaparHTMLPlan(vehiculo.id)}"
                        class="ruta-planificada"
                        onchange="cambiarRutaPlanificada('${escaparJSPlan(vehiculo.id)}', this.value)"
                    >
                        ${crearOpcionesRutas(plan.rutaActiva)}
                    </select>
                </div>


                <div class="campo-plan">
                    <label for="salida-plan-${escaparHTMLPlan(vehiculo.id)}">
                        Salida
                    </label>

                    <input
                        id="salida-plan-${escaparHTMLPlan(vehiculo.id)}"
                        type="time"
                        value="${escaparHTMLPlan(plan.horaSalida || "")}"
                        onchange="cambiarHoraSalida('${escaparJSPlan(vehiculo.id)}', this.value)"
                    >
                </div>


                <div class="campo-plan">
                    <label for="regreso-plan-${escaparHTMLPlan(vehiculo.id)}">
                        Regreso estimado
                    </label>

                    <input
                        id="regreso-plan-${escaparHTMLPlan(vehiculo.id)}"
                        type="time"
                        value="${escaparHTMLPlan(plan.horaEstimadaRegreso || "")}"
                        onchange="cambiarHoraRegreso('${escaparJSPlan(vehiculo.id)}', this.value)"
                    >
                </div>

            </div>


            <div class="resumen-plan-vehiculo">

                <div class="titulo-paradas">
                    Paradas planificadas
                    <span>${plan.paradas.length}</span>
                </div>

                <div class="lista-paradas">
                    ${
                        plan.paradas.length
                            ? plan.paradas
                                .map((parada, indice) =>
                                    crearParadaHTML(
                                        parada,
                                        indice,
                                        vehiculo.id
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

            </div>


            <div class="acciones-plan">

                <select
                    class="selector-anadir-parada"
                    id="anadir-parada-${escaparHTMLPlan(vehiculo.id)}"
                >
                    <option value="">
                        Añadir aviso o punto...
                    </option>

                    ${crearOpcionesParadas(vehiculo.id)}
                </select>

                <button
                    type="button"
                    class="boton-secundario"
                    onclick="anadirParadaSeleccionada('${escaparJSPlan(vehiculo.id)}')"
                >
                    Añadir parada
                </button>

                <button
                    type="button"
                    class="boton-secundario"
                    onclick="optimizarOrdenParadas('${escaparJSPlan(vehiculo.id)}')"
                >
                    Optimizar orden
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   PARADAS
   ========================================================= */

function crearParadaHTML(parada, indice, vehiculoId) {
    const numero = indice + 1;
    const nombre = parada.nombre || "Parada sin nombre";
    const especie = parada.especie || "";
    const hora = parada.hora || "";

    const lat = obtenerLatPlan(parada);
    const lng = obtenerLngPlan(parada);

    return `
        <div
            class="parada-plan"
            data-parada-index="${indice}"
            onclick="centrarParadaDesdePlan('${escaparJSPlan(vehiculoId)}', ${indice}, event)"
        >

            <div class="numero-parada">
                ${numero}
            </div>

            <div class="icono-parada">
                ${parada.tipo === "AVISO" ? "🔔" : "📍"}
            </div>

            <div class="informacion-parada">

                <strong>
                    ${escaparHTMLPlan(nombre)}
                </strong>

                ${
                    especie
                        ? `
                            <div class="especie-parada">
                                ${escaparHTMLPlan(especie)}
                            </div>
                        `
                        : ""
                }

                <div class="detalles-parada">

                    ${
                        hora
                            ? `<span>🕐 ${escaparHTMLPlan(hora)}</span>`
                            : ""
                    }

                    ${
                        lat !== null && lng !== null
                            ? `<span>📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`
                            : ""
                    }

                </div>

            </div>

            <div class="acciones-parada">

                <button
                    type="button"
                    title="Eliminar parada"
                    onclick="eliminarParada('${escaparJSPlan(vehiculoId)}', ${indice}, event)"
                >
                    ×
                </button>

            </div>

        </div>
    `;
}


function obtenerTextoEstadoParada(estado) {
    const estadoNormalizado = String(estado || "")
        .trim()
        .toUpperCase();

    switch (estadoNormalizado) {
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


function centrarParadaDesdePlan(vehiculoId, indice, event) {
    if (event?.target?.closest(".acciones-parada")) {
        return;
    }

    const plan = planificacionDia[vehiculoId];

    if (!plan || !plan.paradas[indice]) {
        return;
    }

    const parada = plan.paradas[indice];

    if (typeof window.centrarParadaEnMapa === "function") {
        window.centrarParadaEnMapa(parada);
        return;
    }

    if (
        typeof mapa !== "undefined" &&
        mapa &&
        typeof mapa.setView === "function"
    ) {
        const lat = obtenerLatPlan(parada);
        const lng = obtenerLngPlan(parada);

        if (lat !== null && lng !== null) {
            mapa.setView([lat, lng], 13);
        }
    }
}


function eliminarParada(vehiculoId, indice, event) {
    if (event) {
        event.stopPropagation();
    }

    const plan = planificacionDia[vehiculoId];

    if (!plan || !plan.paradas[indice]) {
        return;
    }

    const parada = plan.paradas[indice];

    if (parada.tipo === "AVISO" && parada.avisoId) {
        const avisos = window.DATOS_MOCK?.AVISOS || [];

        const aviso = avisos.find(item =>
            String(item.id) === String(parada.avisoId)
        );

        if (aviso && aviso.estado !== "RECOGIDO") {
            aviso.estado = "PENDIENTE";
            aviso.vehiculo = null;
        }
    }

    plan.paradas.splice(indice, 1);

    plan.paradas.forEach((item, posicion) => {
        item.orden = posicion + 1;
    });

    renderizarAvisosPendientes();
    renderizarPlanificacion();

    marcarPlanModificado(vehiculoId);
}


/* =========================================================
   CAMBIOS DE CONFIGURACIÓN
   ========================================================= */

function cambiarRutaPlanificada(vehiculoId, rutaId) {
    const plan = planificacionDia[vehiculoId];

    if (!plan) return;

    plan.rutaActiva = rutaId;
    plan.rutaNombre = obtenerNombreRuta(rutaId);

    marcarPlanModificado(vehiculoId);
    renderizarPlanificacion();
}


function cambiarHoraSalida(vehiculoId, hora) {
    const plan = planificacionDia[vehiculoId];

    if (!plan) return;

    plan.horaSalida = hora;

    marcarPlanModificado(vehiculoId);
}


function cambiarHoraRegreso(vehiculoId, hora) {
    const plan = planificacionDia[vehiculoId];

    if (!plan) return;

    plan.horaEstimadaRegreso = hora;

    marcarPlanModificado(vehiculoId);
}


/* =========================================================
   AÑADIR PARADAS
   ========================================================= */

function crearOpcionesParadas(vehiculoId) {
    const avisos = window.DATOS_MOCK?.AVISOS || [];
    const puntos = window.DATOS_MOCK?.PUNTOS_RECOGIDA || [];

    const plan = planificacionDia[vehiculoId];

    if (!plan) return "";

    const idsIncluidos = new Set(
        plan.paradas
            .filter(parada => parada.avisoId)
            .map(parada => String(parada.avisoId))
    );

    let html = "";

    avisos
        .filter(aviso =>
            !idsIncluidos.has(String(aviso.id)) &&
            normalizarEstadoAvisoPlan(aviso.estado) !== "RECOGIDO"
        )
        .forEach(aviso => {
            html += `
                <option value="AVISO:${escaparHTMLPlan(aviso.id)}">
                    🔔 ${escaparHTMLPlan(
                        aviso.especie || aviso.id
                    )} — ${escaparHTMLPlan(
                        aviso.punto || ""
                    )}
                </option>
            `;
        });

    puntos.forEach(punto => {
        html += `
            <option value="PUNTO:${escaparHTMLPlan(punto.id)}">
                📍 ${escaparHTMLPlan(punto.nombre || punto.id)}
            </option>
        `;
    });

    return html;
}


function anadirParadaSeleccionada(vehiculoId) {
    const selector = document.getElementById(
        `anadir-parada-${vehiculoId}`
    );

    if (!selector || !selector.value) {
        return;
    }

    const [tipo, id] = selector.value.split(":");

    const plan = planificacionDia[vehiculoId];

    if (!plan) {
        return;
    }

    const ultimaOrden = plan.paradas.length
        ? Math.max(
            ...plan.paradas.map(parada =>
                Number(parada.orden) || 0
            )
        )
        : 0;

    if (tipo === "AVISO") {
        const avisos = window.DATOS_MOCK?.AVISOS || [];

        const aviso = avisos.find(item =>
            String(item.id) === String(id)
        );

        if (!aviso) return;

        const yaExiste = plan.paradas.some(parada =>
            String(parada.avisoId || "") === String(aviso.id)
        );

        if (yaExiste) {
            return;
        }

        plan.paradas.push({
            orden: ultimaOrden + 1,
            hora: "",
            nombre: aviso.punto || "Punto de recogida",
            tipo: "AVISO",
            estado:
                aviso.estado === "RECOGIDO"
                    ? "RECOGIDO"
                    : "ASIGNADO",
            avisoId: aviso.id,
            especie: aviso.especie || "",
            latitud: obtenerLatPlan(aviso),
            longitud: obtenerLngPlan(aviso)
        });

        if (aviso.estado !== "RECOGIDO") {
            aviso.estado = "ASIGNADO";
            aviso.vehiculo = vehiculoId;
        }
    }

    if (tipo === "PUNTO") {
        const puntos = window.DATOS_MOCK?.PUNTOS_RECOGIDA || [];

        const punto = puntos.find(item =>
            String(item.id) === String(id)
        );

        if (!punto) return;

        plan.paradas.push({
            orden: ultimaOrden + 1,
            hora: "",
            nombre: punto.nombre || punto.id,
            tipo: "PUNTO",
            estado: "PLANIFICADO",
            latitud: obtenerLatPlan(punto),
            longitud: obtenerLngPlan(punto)
        });
    }

    selector.value = "";

    renderizarAvisosPendientes();
    renderizarPlanificacion();

    marcarPlanModificado(vehiculoId);
}


/* =========================================================
   OPTIMIZACIÓN / ORDEN
   ========================================================= */

function optimizarOrdenParadas(vehiculoId) {
    const plan = planificacionDia[vehiculoId];

    if (!plan || plan.paradas.length < 2) {
        return;
    }

    const posiciones = window.DATOS_MOCK?.POSICIONES || [];

    let posicionVehiculo = null;

    if (Array.isArray(posiciones)) {
        posicionVehiculo = posiciones.find(posicion =>
            String(posicion.vehiculo) === String(vehiculoId)
        );
    } else if (posiciones && typeof posiciones === "object") {
        posicionVehiculo = posiciones[vehiculoId];
    }

    if (!posicionVehiculo) {
        return;
    }

    const latInicial = obtenerLatPlan(posicionVehiculo);
    const lngInicial = obtenerLngPlan(posicionVehiculo);

    if (latInicial === null || lngInicial === null) {
        return;
    }

    const pendientes = [...plan.paradas];
    const ordenadas = [];

    let latActual = latInicial;
    let lngActual = lngInicial;

    while (pendientes.length) {

        let indiceMejor = 0;
        let distanciaMejor = Infinity;

        pendientes.forEach((parada, indice) => {

            const lat = obtenerLatPlan(parada);
            const lng = obtenerLngPlan(parada);

            if (lat === null || lng === null) {
                return;
            }

            const distancia = distanciaEnKm(
                latActual,
                lngActual,
                lat,
                lng
            );

            if (distancia < distanciaMejor) {
                distanciaMejor = distancia;
                indiceMejor = indice;
            }
        });

        const siguiente = pendientes.splice(
            indiceMejor,
            1
        )[0];

        ordenadas.push(siguiente);

        const latSiguiente = obtenerLatPlan(siguiente);
        const lngSiguiente = obtenerLngPlan(siguiente);

        if (
            latSiguiente !== null &&
            lngSiguiente !== null
        ) {
            latActual = latSiguiente;
            lngActual = lngSiguiente;
        }
    }

    ordenadas.forEach((parada, indice) => {
        parada.orden = indice + 1;
    });

    plan.paradas = ordenadas;

    renderizarPlanificacion();
    marcarPlanModificado(vehiculoId);
}


/* =========================================================
   CENTRADO EN MAPA
   ========================================================= */

function centrarVehiculoDesdePlan(vehiculoId) {
    if (typeof window.centrarVehiculo === "function") {
        window.centrarVehiculo(vehiculoId);
        return;
    }

    if (
        typeof mapa !== "undefined" &&
        mapa &&
        typeof mapa.setView === "function"
    ) {
        const posiciones = window.DATOS_MOCK?.POSICIONES || [];

        let posicion = null;

        if (Array.isArray(posiciones)) {
            posicion = posiciones.find(item =>
                String(item.vehiculo) === String(vehiculoId)
            );
        } else if (
            posiciones &&
            typeof posiciones === "object"
        ) {
            posicion = posiciones[vehiculoId];
        }

        if (!posicion) return;

        const lat = obtenerLatPlan(posicion);
        const lng = obtenerLngPlan(posicion);

        if (lat !== null && lng !== null) {
            mapa.setView([lat, lng], 13);
        }
    }
}


/* =========================================================
   LEYENDA
   ========================================================= */

function renderizarLeyendaRutas() {
    const contenedor = document.getElementById(
        "leyenda-rutas"
    );

    if (!contenedor) return;

    const rutas = window.DATOS_MOCK?.RUTAS || [];

    contenedor.innerHTML = rutas.map(ruta => `
        <span class="item-leyenda-ruta">
            <span
                class="punto-ruta"
                style="background:${obtenerColorRuta(ruta.id)};"
            ></span>
            ${escaparHTMLPlan(ruta.nombre || ruta.id)}
        </span>
    `).join("");
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function obtenerNombreRuta(rutaId) {
    const rutas = window.DATOS_MOCK?.RUTAS || [];

    const ruta = rutas.find(item =>
        String(item.id).toUpperCase() ===
        String(rutaId || "").toUpperCase()
    );

    if (ruta) {
        return ruta.nombre || ruta.id;
    }

    if (
        window.CONFIG &&
        CONFIG.nombresRutas &&
        CONFIG.nombresRutas[rutaId]
    ) {
        return CONFIG.nombresRutas[rutaId];
    }

    return rutaId || "Sin ruta";
}


function obtenerColorRuta(rutaId) {
    const rutas = window.DATOS_MOCK?.RUTAS || [];

    const ruta = rutas.find(item =>
        String(item.id).toUpperCase() ===
        String(rutaId || "").toUpperCase()
    );

    if (ruta?.color) {
        return ruta.color;
    }

    if (
        window.CONFIG &&
        CONFIG.coloresRutas &&
        CONFIG.coloresRutas[rutaId]
    ) {
        return CONFIG.coloresRutas[rutaId];
    }

    return "#777";
}


function obtenerLatPlan(objeto) {
    if (!objeto) return null;

    const valor =
        objeto.latitud ??
        objeto.lat ??
        objeto.latitude;

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
}


function obtenerLngPlan(objeto) {
    if (!objeto) return null;

    const valor =
        objeto.longitud ??
        objeto.lng ??
        objeto.lon ??
        objeto.longitude;

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
}


function coordenadasValidasPlan(lat, lng) {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}


function distanciaEnKm(lat1, lng1, lat2, lng2) {
    const radioTierra = 6371;

    const dLat = (
        (lat2 - lat1) *
        Math.PI /
        180
    );

    const dLng = (
        (lng2 - lng1) *
        Math.PI /
        180
    );

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return radioTierra * c;
}


function escaparHTMLPlan(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escaparJSPlan(valor) {
    return String(valor ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}


function crearOpcionesRutas(rutaSeleccionada) {
    const rutas = window.DATOS_MOCK?.RUTAS || [];

    return rutas.map(ruta => `
        <option
            value="${escaparHTMLPlan(ruta.id)}"
            ${
                String(ruta.id) === String(rutaSeleccionada)
                    ? "selected"
                    : ""
            }
        >
            ${escaparHTMLPlan(ruta.nombre || ruta.id)}
        </option>
    `).join("");
}


function marcarPlanModificado(vehiculoId) {
    const tarjeta = document.querySelector(
        `.tarjeta-plan-vehiculo[data-vehiculo="${CSS.escape(String(vehiculoId))}"]`
    );

    if (!tarjeta) return;

    tarjeta.classList.add("plan-modificado");

    window.setTimeout(() => {
        tarjeta.classList.remove("plan-modificado");
    }, 1800);
}


/* =========================================================
   COMPATIBILIDAD / EXPORTACIONES
   ========================================================= */

window.inicializarPlanificacion = inicializarPlanificacion;
window.renderizarAvisosPendientes = renderizarAvisosPendientes;
window.renderizarPlanificacion = renderizarPlanificacion;
window.asignarAvisoAVehiculo = asignarAvisoAVehiculo;
window.centrarVehiculoDesdePlan = centrarVehiculoDesdePlan;
window.centrarParadaDesdePlan = centrarParadaDesdePlan;
window.eliminarParada = eliminarParada;
window.cambiarRutaPlanificada = cambiarRutaPlanificada;
window.cambiarHoraSalida = cambiarHoraSalida;
window.cambiarHoraRegreso = cambiarHoraRegreso;
window.anadirParadaSeleccionada = anadirParadaSeleccionada;
window.optimizarOrdenParadas = optimizarOrdenParadas;
window.obtenerTextoEstadoParada = obtenerTextoEstadoParada;
window.obtenerVehiculoRecomendado = obtenerVehiculoRecomendado;

