/* =========================================================
   API
========================================================= */

/*
 * FASE 3F.2.1 · Timeout EXCLUSIVO de API.guardarPlanificacion.
 *
 * El autosave utiliza un carril único de POST: un fetch que
 * nunca respondiera bloquearía la cola para siempre. El valor
 * es razonable para una aplicación de campo.
 *
 * No se aplica al resto de peticiones de este fichero.
 */
const TIMEOUT_GUARDADO_PLANIFICACION_MS = 15000;


const API = {

    async obtenerDatos() {

        if (CONFIG.modo === "mock") {

            return JSON.parse(
                JSON.stringify(MOCK_DATA)
            );
        }

        const respuesta = await fetch(
            CONFIG.api.url + "?accion=todo"
        );

        const resultado = await respuesta.json();

        if (!resultado.ok) {

            throw new Error(
                resultado.mensaje ||
                "Error obteniendo datos"
            );
        }

        return resultado.datos;
    },


    async enviarGPS(datos) {

        if (CONFIG.modo === "mock") {

            console.log(
                "GPS simulado:",
                datos
            );

            return {
                ok: true
            };
        }

        const respuesta = await fetch(
            CONFIG.api.url,
            {
                method: "POST",

                headers: {
                    "Content-Type": "text/plain"
                },

                body: JSON.stringify(datos),

                mode: "no-cors"
            }
        );

        return {
            ok: true
        };
    },


    /* =========================================================
       GUARDAR PLANIFICACIÓN · FASE 3D
       ---------------------------------------------------------
       POST con Content-Type text/plain y SIN mode "no-cors":
       con no-cors la respuesta sería opaca y no se podría
       leer ok/error/filas.

       FASE 3F.2.1: incorpora un timeout de 15 segundos
       (AbortController) EXCLUSIVO de esta función. No usa
       reintentos. No lanza excepciones: cualquier fallo,
       incluido el timeout, se devuelve como
       { ok: false, error }.
    ========================================================= */

    async guardarPlanificacion(payload) {

        if (CONFIG.modo === "mock") {

            return {
                ok: true,
                mock: true,
                filas: payload.paradas.length
            };
        }

        let respuesta = null;


        /*
         * FASE 3F.2.1 · controlador de timeout. Solo para
         * guardarPlanificacion. Si AbortController no
         * existiera, se mantiene el comportamiento anterior
         * sin timeout.
         */

        const controladorTimeout =
            typeof AbortController === "function"
                ? new AbortController()
                : null;


        let temporizadorTimeout = null;


        if (controladorTimeout) {

            temporizadorTimeout = window.setTimeout(
                function() {
                    controladorTimeout.abort();
                },
                TIMEOUT_GUARDADO_PLANIFICACION_MS
            );
        }


        try {

            respuesta = await fetch(
                CONFIG.api.url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "text/plain"
                    },

                    body: JSON.stringify(payload),

                    signal:
                        controladorTimeout
                            ? controladorTimeout.signal
                            : undefined
                }
            );

        } catch (error) {

            const haExpirado =
                !!controladorTimeout &&
                !!error &&
                (
                    error.name === "AbortError" ||
                    error.code === 20
                );


            return {
                ok: false,
                error: haExpirado
                    ? "Tiempo de espera agotado guardando la planificación"
                    : "No se ha podido conectar con el servidor"
            };

        } finally {

            if (temporizadorTimeout !== null) {

                window.clearTimeout(temporizadorTimeout);
            }
        }


        if (respuesta.status !== 200) {

            return {
                ok: false,
                error: `HTTP ${respuesta.status}`
            };
        }


        let datos = null;


        try {

            datos = await respuesta.json();

        } catch (error) {

            return {
                ok: false,
                error: "Respuesta no válida del servidor"
            };
        }


        if (
            !datos ||
            typeof datos !== "object"
        ) {

            return {
                ok: false,
                error: "Respuesta no válida del servidor"
            };
        }


        if (datos.ok !== true) {

            return {
                ok: false,
                error:
                    datos.error ||
                    datos.mensaje ||
                    "Error guardando la planificación"
            };
        }


        if (typeof datos.filas !== "number") {

            return {
                ok: false,
                error: "Respuesta incompleta del servidor"
            };
        }


        return {
            ok: true,
            accion: datos.accion,
            fecha: datos.fecha,
            vehiculo_id: datos.vehiculo_id,
            filas: datos.filas
        };
    },


    /* =========================================================
       ELIMINAR PLANIFICACIÓN · FASE 3F.6.7-C2
       ---------------------------------------------------------
       Método independiente del guardado (nunca reutilizar
       guardarPlanificacion para borrar). POST legible con
       timeout, SIN mode "no-cors": con no-cors la respuesta
       sería opaca y un borrado parecería exitoso sin
       evidencia (ver enviarGPS: no apto para eliminaciones).

       Tres resultados posibles, nunca confundidos:
         - ok:true + accion + eliminadas:number → confirmado
           (eliminadas:0 es éxito idempotente válido).
         - ok:false sin timeout → error confirmado.
         - ok:false con timeout:true → resultado DESCONOCIDO
           (el servidor pudo ejecutar el borrado; exige
           reconciliación, nunca reintento ciego).
       ========================================================= */

    async eliminarPlanificacion(payload) {

        if (CONFIG.modo === "mock") {

            return {
                ok: false,
                error: "Borrado no disponible en modo mock"
            };
        }

        let respuesta = null;


        const controladorTimeout =
            typeof AbortController === "function"
                ? new AbortController()
                : null;


        let temporizadorTimeout = null;


        if (controladorTimeout) {

            temporizadorTimeout = window.setTimeout(
                function() {
                    controladorTimeout.abort();
                },
                TIMEOUT_GUARDADO_PLANIFICACION_MS
            );
        }


        try {

            respuesta = await fetch(
                CONFIG.api.url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "text/plain"
                    },

                    body: JSON.stringify(payload),

                    signal:
                        controladorTimeout
                            ? controladorTimeout.signal
                            : undefined
                }
            );

        } catch (error) {

            const haExpirado =
                !!controladorTimeout &&
                !!error &&
                (
                    error.name === "AbortError" ||
                    error.code === 20
                );


            return {
                ok: false,
                error: haExpirado
                    ? "Tiempo de espera agotado eliminando la planificación (resultado desconocido)"
                    : "No se ha podido conectar con el servidor",
                timeout: haExpirado ? true : undefined
            };

        } finally {

            if (temporizadorTimeout !== null) {

                window.clearTimeout(temporizadorTimeout);
            }
        }


        if (respuesta.status !== 200) {

            return {
                ok: false,
                error: `HTTP ${respuesta.status}`
            };
        }


        let datos = null;


        try {

            datos = await respuesta.json();

        } catch (error) {

            return {
                ok: false,
                error: "Respuesta no válida del servidor"
            };
        }


        if (
            !datos ||
            typeof datos !== "object"
        ) {

            return {
                ok: false,
                error: "Respuesta no válida del servidor"
            };
        }


        if (
            datos.ok !== true ||
            datos.accion !== "eliminar_planificacion" ||
            typeof datos.eliminadas !== "number"
        ) {

            return {
                ok: false,
                error:
                    datos.error ||
                    datos.mensaje ||
                    "Error eliminando la planificación"
            };
        }


        return {
            ok: true,
            accion: datos.accion,
            fecha: datos.fecha,
            vehiculo_id: datos.vehiculo_id,
            eliminadas: datos.eliminadas
        };
    }

};
