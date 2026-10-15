/* =========================================================
   SERVICIO OSRM
   Capa independiente para consultar el Worker de rutas.
   No se invoca automáticamente al cargar la aplicación.
========================================================= */

(function () {

    const configGlobal =
        (typeof window !== "undefined" && window.CONFIG)
            ? window.CONFIG
            : (
                typeof globalThis !== "undefined" &&
                globalThis.CONFIG
                    ? globalThis.CONFIG
                    : {}
            );

    const SERVICIO_OSRM = {
        baseUrl:
            (configGlobal.osrm && configGlobal.osrm.baseUrl)
                || "https://crf-rutas.crf-granja-saler.workers.dev",
        rutaEndpoint:
            (configGlobal.osrm && configGlobal.osrm.rutaEndpoint)
                || "/api/ruta"
    };

    function validarCoordenada(punto, nombre) {

        if (
            !punto ||
            typeof punto !== "object"
        ) {
            throw new Error(
                nombre + " no es válido."
            );
        }

        const lat = Number(punto.lat);
        const lng = Number(punto.lng);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            throw new Error(
                nombre + " requiere lat y lng numéricos."
            );
        }

        if (
            lat < -90 ||
            lat > 90
        ) {
            throw new Error(
                nombre + ".lat está fuera de rango."
            );
        }

        if (
            lng < -180 ||
            lng > 180
        ) {
            throw new Error(
                nombre + ".lng está fuera de rango."
            );
        }

        return {
            lat,
            lng
        };
    }

    function construirUrlRuta(origen, destino) {

        const origenValido = validarCoordenada(
            origen,
            "origen"
        );

        const destinoValido = validarCoordenada(
            destino,
            "destino"
        );

        const url = new URL(
            SERVICIO_OSRM.rutaEndpoint,
            SERVICIO_OSRM.baseUrl
        );

        url.searchParams.set(
            "origen",
            `${origenValido.lng},${origenValido.lat}`
        );

        url.searchParams.set(
            "destino",
            `${destinoValido.lng},${destinoValido.lat}`
        );

        return url.toString();
    }

    async function obtenerRutaOSRM(origen, destino) {

        try {

            const origenValido = validarCoordenada(
                origen,
                "origen"
            );

            const destinoValido = validarCoordenada(
                destino,
                "destino"
            );

            const url = construirUrlRuta(
                origenValido,
                destinoValido
            );

            const respuesta = await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!respuesta.ok) {
                let detalle = "";

                try {
                    detalle = await respuesta.text();
                } catch (error) {
                    detalle = "";
                }

                const mensaje = detalle
                    ? `: ${detalle}`
                    : "";

                throw new Error(
                    "Error HTTP " + respuesta.status + mensaje
                );
            }

            const datos = await respuesta.json();

            if (!datos || datos.code !== "Ok") {
                const detalle =
                    datos &&
                    datos.message
                        ? datos.message
                        : "Respuesta no válida";

                throw new Error(
                    "Respuesta OSRM no válida: " + detalle
                );
            }

            const rutas = Array.isArray(datos.routes)
                ? datos.routes
                : [];

            if (!rutas.length) {
                throw new Error(
                    "La respuesta de OSRM no incluye rutas."
                );
            }

            const ruta = rutas[0];

            const distanciaMetros = Number(ruta.distance);
            const duracionSegundos = Number(ruta.duration);

            if (
                !Number.isFinite(distanciaMetros) ||
                !Number.isFinite(duracionSegundos)
            ) {
                throw new Error(
                    "La ruta no incluye distance o duration válidos."
                );
            }

            return {
                distanciaMetros,
                duracionSegundos,
                ruta
            };

        } catch (error) {

            if (
                error &&
                error.name === "TypeError" &&
                /Failed to fetch|fetch/i.test(
                    error.message || ""
                )
            ) {
                throw new Error(
                    "Error de red al consultar OSRM."
                );
            }

            throw error;
        }
    }

    async function probarObtenerRutaOSRM() {

        const origen = {
            lat: 39.341839,
            lng: -0.320019
        };

        const destino = {
            lat: 39.4,
            lng: -0.3
        };

        const resultado = await obtenerRutaOSRM(
            origen,
            destino
        );

        if (
            !Number.isFinite(resultado.distanciaMetros) ||
            !Number.isFinite(resultado.duracionSegundos)
        ) {
            throw new Error(
                "La prueba no devolvió distancia o duración válidas."
            );
        }

        return resultado;
    }

    if (typeof window !== "undefined") {
        window.obtenerRutaOSRM = obtenerRutaOSRM;
        window.probarObtenerRutaOSRM = probarObtenerRutaOSRM;
        window.OSRM_SERVICIO = {
            baseUrl: SERVICIO_OSRM.baseUrl,
            rutaEndpoint: SERVICIO_OSRM.rutaEndpoint,
            obtenerRutaOSRM: obtenerRutaOSRM
        };
    }

    if (typeof globalThis !== "undefined") {
        globalThis.obtenerRutaOSRM = obtenerRutaOSRM;
        globalThis.probarObtenerRutaOSRM = probarObtenerRutaOSRM;
        globalThis.OSRM_SERVICIO = {
            baseUrl: SERVICIO_OSRM.baseUrl,
            rutaEndpoint: SERVICIO_OSRM.rutaEndpoint,
            obtenerRutaOSRM: obtenerRutaOSRM
        };
    }

})();
