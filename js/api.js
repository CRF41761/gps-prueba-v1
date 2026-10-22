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


/*
 * Alta de aviso: si la conexión se corta después de enviar, el
 * resultado es incierto. No se reintenta automáticamente.
 */
const TIMEOUT_CREAR_AVISO_MS = 15000;


/*
 * Consulta de comprobación de un alta incierta: no puede
 * quedarse bloqueada indefinidamente.
 */
const TIMEOUT_OBTENER_AVISOS_MS = 10000;


/*
 * Edición y eliminación de avisos: son operaciones POST con
 * respuesta verificable. Si se pierde la respuesta, el resultado
 * es incierto y no se reintenta automáticamente.
 */
const TIMEOUT_ACTUALIZAR_AVISO_MS = 15000;

const TIMEOUT_ELIMINAR_AVISO_MS = 15000;


/*
 * Normaliza las claves de un aviso recibido por GET para que
 * la comprobación tolere diferencias de mayúsculas/minúsculas
 * en las cabeceras de la hoja.
 *
 * Añade alias para los datos de mock, que usan camelCase.
 */
function normalizarClavesAviso(aviso) {

    if (
        !aviso ||
        typeof aviso !== "object" ||
        Array.isArray(aviso)
    ) {

        return null;
    }


    const normalizado = {};


    Object.keys(aviso).forEach(
        function(clave) {

            const nombre =
                String(clave)
                    .trim()
                    .toLowerCase();


            if (
                nombre &&
                normalizado[nombre] === undefined
            ) {

                normalizado[nombre] =
                    aviso[clave];

            }

        }
    );


    if (
        normalizado.id_aviso === undefined &&
        aviso.id !== undefined
    ) {

        normalizado.id_aviso =
            aviso.id;

    }


    if (
        normalizado.punto_id === undefined &&
        aviso.puntoId !== undefined
    ) {

        normalizado.punto_id =
            aviso.puntoId;

    }


    if (
        normalizado.especie_indicada === undefined
    ) {

        if (aviso.especie !== undefined) {

            normalizado.especie_indicada =
                aviso.especie;

        } else if (
            aviso.especie_reportada !== undefined
        ) {

            normalizado.especie_indicada =
                aviso.especie_reportada;

        }

    }


    if (
        normalizado.numero_animales === undefined &&
        aviso.cantidad !== undefined
    ) {

        normalizado.numero_animales =
            aviso.cantidad;

    }


    return normalizado;
}


/*
 * Envía una acción de gestión de avisos y clasifica la respuesta.
 *
 * - Un fallo de red, timeout, HTTP no 2xx o JSON inválido es
 *   incierto: no se puede afirmar que el servidor no haya escrito.
 * - Un rechazo explícito del backend es definitivo.
 */
async function enviarAccionAvisoGestion(
    payload,
    timeoutMs
) {

    const controladorTimeout =
        typeof AbortController === "function"
            ? new AbortController()
            : null;


    let temporizadorTimeout = null;


    if (controladorTimeout) {

        temporizadorTimeout =
            window.setTimeout(
                function() {
                    controladorTimeout.abort();
                },
                timeoutMs
            );
    }


    let respuesta = null;


    try {

        const opciones = {
            method: "POST",

            headers: {
                "Content-Type": "text/plain"
            },

            body: JSON.stringify(
                payload
            )
        };


        if (controladorTimeout) {

            opciones.signal =
                controladorTimeout.signal;

        }


        respuesta = await fetch(
            CONFIG.api.url,
            opciones
        );

    } catch (error) {

        return {
            ok: false,
            incierto: true,
            error:
                "No se ha podido contactar con el servidor. " +
                "No se puede confirmar si la operación se realizó."
        };

    } finally {

        if (temporizadorTimeout) {

            window.clearTimeout(
                temporizadorTimeout
            );
        }
    }


    if (
        !respuesta ||
        typeof respuesta.json !== "function"
    ) {

        return {
            ok: false,
            incierto: true,
            error:
                "El servidor no ha devuelto una respuesta verificable."
        };
    }


    if (
        respuesta.status < 200 ||
        respuesta.status >= 300
    ) {

        return {
            ok: false,
            incierto: true,
            error:
                "El servidor ha respondido con HTTP " +
                respuesta.status +
                ". No se puede confirmar la operación."
        };
    }


    let resultado = null;


    try {

        resultado =
            await respuesta.json();

    } catch (error) {

        return {
            ok: false,
            incierto: true,
            error:
                "La respuesta del servidor no es válida. " +
                "No se puede confirmar la operación."
        };
    }


    if (
        !resultado ||
        typeof resultado !== "object"
    ) {

        return {
            ok: false,
            incierto: true,
            error:
                "La respuesta del servidor no es válida."
        };
    }


    if (resultado.ok !== true) {

        return {
            ok: false,
            incierto:
                resultado.incierto === true,
            error:
                resultado.error ||
                resultado.mensaje ||
                "El servidor ha rechazado la operación."
        };
    }


    return Object.assign(
        {},
        resultado,
        {
            ok: true,
            incierto: false
        }
    );
}


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


    /*
     * Lectura de AVISOS para comprobar, tras un resultado
     * incierto, si el alta llegó a guardarse.
     *
     * Es una petición GET de solo lectura.
     */

    async obtenerAvisos() {

        if (CONFIG.modo === "mock") {

            var origen = [];


            if (
                typeof window !== "undefined" &&
                window.DATOS_MOCK &&
                Array.isArray(
                    window.DATOS_MOCK.AVISOS
                )
            ) {

                origen =
                    window.DATOS_MOCK.AVISOS;

            } else if (
                typeof MOCK_DATA !== "undefined" &&
                MOCK_DATA &&
                Array.isArray(MOCK_DATA.avisos)
            ) {

                origen =
                    MOCK_DATA.avisos;

            }


            const avisosMock = [];


            origen.forEach(
                function(aviso) {

                    const normalizado =
                        normalizarClavesAviso(
                            aviso
                        );


                    if (normalizado) {

                        avisosMock.push(
                            normalizado
                        );

                    }

                }
            );


            return {
                ok: true,
                avisos: avisosMock
            };
        }


        const controladorTimeout =
            typeof AbortController === "function"
                ? new AbortController()
                : null;


        let temporizadorTimeout = null;


        if (controladorTimeout) {

            temporizadorTimeout =
                window.setTimeout(
                    function() {

                        controladorTimeout.abort();

                    },
                    TIMEOUT_OBTENER_AVISOS_MS
                );

        }


        try {

            const respuesta =
                await fetch(
                    CONFIG.api.url + "?accion=avisos",
                    {
                        cache: "no-store",

                        signal:
                            controladorTimeout
                                ? controladorTimeout.signal
                                : undefined
                    }
                );


            if (
                !respuesta ||
                typeof respuesta.json !== "function"
            ) {

                return {
                    ok: false,
                    error:
                        "La respuesta del servidor no es válida."
                };
            }


            if (
                respuesta.status < 200 ||
                respuesta.status >= 300
            ) {

                return {
                    ok: false,
                    error:
                        "El servidor ha respondido con HTTP " +
                        respuesta.status +
                        " al consultar los avisos."
                };
            }


            const resultado =
                await respuesta.json();


            if (
                !resultado ||
                typeof resultado !== "object"
            ) {

                return {
                    ok: false,
                    error:
                        "La respuesta de avisos no es válida."
                };
            }


            if (resultado.ok !== true) {

                return {
                    ok: false,
                    error:
                        resultado.error ||
                        resultado.mensaje ||
                        "No se han podido consultar los avisos."
                };
            }


            if (!Array.isArray(resultado.datos)) {

                return {
                    ok: false,
                    error:
                        "La respuesta de avisos no contiene una lista válida."
                };
            }


            const avisos = [];


            for (
                let indice = 0;
                indice < resultado.datos.length;
                indice += 1
            ) {

                const normalizado =
                    normalizarClavesAviso(
                        resultado.datos[indice]
                    );


                if (!normalizado) {

                    return {
                        ok: false,
                        error:
                            "La respuesta de avisos contiene registros no válidos."
                    };
                }


                avisos.push(
                    normalizado
                );
            }


            return {
                ok: true,
                avisos: avisos
            };

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
                    ? "Tiempo de espera agotado al consultar los avisos."
                    : "No se han podido consultar los avisos."
            };

        } finally {

            if (temporizadorTimeout) {

                window.clearTimeout(
                    temporizadorTimeout
                );

            }
        }
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
       CREAR AVISO
       ---------------------------------------------------------
       POST con Content-Type text/plain, igual que el guardado
       de planificación, para poder leer la respuesta del
       servidor sin una respuesta opaca.

       Devuelve:
       - { ok:true, aviso } si el servidor confirma el alta.
       - { ok:false, error } si el servidor rechaza o hay un
         error definitivo.
       - { ok:false, incierto:true, error } si no se puede
         saber si el servidor llegó a guardar el aviso.

       En el caso incierto NO se reintenta automáticamente.
    ========================================================= */

    async crearAviso(datos) {

        if (CONFIG.modo === "mock") {

            return {
                ok: true,
                incierto: false,
                guardado: true,
                mock: true,
                aviso: {
                    id_aviso:
                        "AV-MOCK-" +
                        Date.now(),
                    fecha_hora_aviso:
                        new Date().toISOString(),
                    punto_id:
                        datos.punto_id,
                    especie_indicada:
                        datos.especie_indicada,
                    numero_animales:
                        datos.numero_animales,
                    informacion_colaborador:
                        datos.informacion_colaborador || "",
                    observaciones:
                        datos.observaciones || "",
                    estado:
                        "PENDIENTE"
                }
            };
        }


        const payload = {
            accion:
                "crear_aviso",
            punto_id:
                datos.punto_id,
            especie_indicada:
                datos.especie_indicada,
            numero_animales:
                datos.numero_animales,
            informacion_colaborador:
                datos.informacion_colaborador || "",
            observaciones:
                datos.observaciones || ""
        };


        const controladorTimeout =
            typeof AbortController === "function"
                ? new AbortController()
                : null;


        let temporizadorTimeout = null;


        if (controladorTimeout) {

            temporizadorTimeout =
                window.setTimeout(
                    function() {
                        controladorTimeout.abort();
                    },
                    TIMEOUT_CREAR_AVISO_MS
                );
        }


        let respuesta = null;


        try {

            respuesta = await fetch(
                CONFIG.api.url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "text/plain"
                    },

                    body: JSON.stringify(
                        payload
                    ),

                    signal:
                        controladorTimeout
                            ? controladorTimeout.signal
                            : undefined
                }
            );

        } catch (error) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                error:
                    "No se ha podido confirmar si el aviso se guardó. " +
                    "Comprueba si ya existe antes de volver a intentarlo."
            };

        } finally {

            if (temporizadorTimeout) {

                window.clearTimeout(
                    temporizadorTimeout
                );
            }
        }


        if (
            !respuesta ||
            typeof respuesta.json !== "function"
        ) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                error:
                    "El servidor no ha devuelto una respuesta verificable. " +
                    "Comprueba si el aviso ya existe antes de volver a intentarlo."
            };
        }


        /*
         * Un estado HTTP distinto de 2xx no permite saber si el
         * servidor llegó a escribir la fila. No se trata como un
         * rechazo definitivo.
         */
        if (
            respuesta.status < 200 ||
            respuesta.status >= 300
        ) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                error:
                    "El servidor ha respondido con HTTP " +
                    respuesta.status +
                    ". No se ha podido confirmar si el aviso se guardó. " +
                    "Comprueba si ya existe antes de volver a intentarlo."
            };
        }


        let resultado = null;


        try {

            resultado =
                await respuesta.json();

        } catch (error) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                error:
                    "No se ha podido leer la respuesta del servidor. " +
                    "Comprueba si el aviso ya existe antes de volver a intentarlo."
            };
        }


        if (
            !resultado ||
            typeof resultado !== "object"
        ) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                error:
                    "La respuesta del servidor no es válida. " +
                    "Comprueba si el aviso ya existe antes de volver a intentarlo."
            };
        }


        if (resultado.ok !== true) {

            /*
             * El backend puede confirmar que la fila se escribió
             * aunque no haya podido construir una respuesta de éxito
             * completa. En ese caso no se devuelve un rechazo
             * definitivo que invite a repetir el alta.
             */
            if (
                resultado.incierto === true ||
                resultado.guardado === true
            ) {

                return {
                    ok: false,
                    incierto: true,
                    guardado:
                        resultado.guardado === true,
                    aviso:
                        resultado.aviso,
                    error:
                        resultado.error ||
                        resultado.mensaje ||
                        "No se ha podido confirmar el resultado del alta."
                };
            }


            return {
                ok: false,
                incierto: false,
                guardado: false,
                error:
                    resultado.error ||
                    resultado.mensaje ||
                    "No se ha podido crear el aviso."
            };
        }


        if (resultado.guardado === false) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                aviso:
                    resultado.aviso,
                error:
                    "El servidor no ha confirmado la escritura del aviso. " +
                    "Comprueba si ya existe antes de volver a intentarlo."
            };
        }


        if (
            !resultado.aviso ||
            !resultado.aviso.id_aviso
        ) {

            return {
                ok: false,
                incierto: true,
                guardado: false,
                error:
                    "El servidor no ha confirmado el identificador del aviso. " +
                    "Comprueba si ya existe antes de volver a intentarlo."
            };
        }


        return {
            ok: true,
            incierto: false,
            guardado: true,
            aviso:
                resultado.aviso
        };
    },


    /* =========================================================
       ACTUALIZAR AVISO
       ---------------------------------------------------------
       Modifica el aviso existente identificado por id_aviso.
       No crea registros nuevos. Si la respuesta no se puede
       verificar, se devuelve incierto:true.
    ========================================================= */

    async actualizarAviso(idAviso, datos) {

        const id =
            String(
                idAviso || ""
            ).trim();


        if (!id) {

            return {
                ok: false,
                incierto: false,
                actualizado: false,
                error:
                    "El identificador del aviso es obligatorio."
            };
        }


        if (CONFIG.modo === "mock") {

            return {
                ok: true,
                incierto: false,
                actualizado: true,
                aviso: {
                    id_aviso: id,
                    punto_id:
                        datos.punto_id,
                    especie_indicada:
                        datos.especie_indicada,
                    numero_animales:
                        datos.numero_animales,
                    informacion_colaborador:
                        datos.informacion_colaborador || "",
                    observaciones:
                        datos.observaciones || "",
                    estado:
                        "PENDIENTE"
                }
            };
        }


        const resultado =
            await enviarAccionAvisoGestion(
                {
                    accion:
                        "actualizar_aviso",
                    id_aviso:
                        id,
                    punto_id:
                        datos.punto_id,
                    especie_indicada:
                        datos.especie_indicada,
                    numero_animales:
                        datos.numero_animales,
                    informacion_colaborador:
                        datos.informacion_colaborador || "",
                    observaciones:
                        datos.observaciones || ""
                },
                TIMEOUT_ACTUALIZAR_AVISO_MS
            );


        if (!resultado.ok) {

            return {
                ok: false,
                incierto:
                    resultado.incierto === true,
                actualizado: false,
                error:
                    resultado.error ||
                    "No se ha podido actualizar el aviso."
            };
        }


        if (
            resultado.actualizado !== true ||
            !resultado.aviso ||
            String(
                resultado.aviso.id_aviso
            ).trim() !== id
        ) {

            return {
                ok: false,
                incierto: true,
                actualizado: false,
                error:
                    "El servidor no ha confirmado el aviso actualizado. " +
                    "Comprueba la lista antes de volver a intentarlo."
            };
        }


        return {
            ok: true,
            incierto: false,
            actualizado: true,
            aviso:
                resultado.aviso
        };
    },


    /* =========================================================
       ASIGNAR AVISO A UN VEHÍCULO · BLOQUE 12C
       ---------------------------------------------------------
       POST con Content-Type text/plain (transporte legible
       idéntico al de crear/actualizar/eliminar aviso). Solicitud
       "simple" sin cabeceras personalizadas: no dispara
       preflight CORS y la respuesta del servidor se lee
       directamente.

       Devuelve:
       - { ok:true, asignado:true, aviso } cuando el servidor
         confirma con eco de id_aviso y vehiculo_id.
       - { ok:false, error } si el backend rechaza la acción.
       - { ok:false, incierto:true, error } si no se puede saber
         si la asignación se realizó (red, timeout o respuesta
         inválida/no confirmatoria).

       El cumplimiento del fetch NO se interpreta como escritura
       confirmada: solo la respuesta ok:true con aviso de retorno
       lo es. Con mode no-cors la respuesta sería opaca y esto no
       sería comprobable; por eso esta acción no usa no-cors.
    ========================================================= */

    async asignarAviso(idAviso, vehiculoId) {

        const id =
            String(
                idAviso || ""
            ).trim();

        const vehiculo =
            String(
                vehiculoId || ""
            ).trim();


        if (!id) {

            return {
                ok: false,
                incierto: false,
                asignado: false,
                error:
                    "El identificador del aviso es obligatorio."
            };
        }


        if (!vehiculo) {

            return {
                ok: false,
                incierto: false,
                asignado: false,
                error:
                    "El vehículo de destino es obligatorio."
            };
        }


        if (CONFIG.modo === "mock") {

            return {
                ok: true,
                incierto: false,
                asignado: true,
                mock: true,
                aviso: {
                    id_aviso: id,
                    vehiculo_id: vehiculo,
                    estado: "ASIGNADO"
                }
            };
        }


        let resultado = null;

        try {

            resultado =
                await enviarAccionAvisoGestion(
                    {
                        accion:
                            "asignar_aviso",
                        id_aviso:
                            id,
                        vehiculo_id:
                            vehiculo
                    },
                    TIMEOUT_ACTUALIZAR_AVISO_MS
                );

        } catch (error) {

            return {
                ok: false,
                incierto: true,
                asignado: false,
                error:
                    "No se ha podido contactar con el servidor " +
                    "para asignar el aviso. No se puede confirmar " +
                    "si la asignación se realizó."
            };
        }


        if (!resultado.ok) {

            return {
                ok: false,
                incierto:
                    resultado.incierto === true,
                asignado: false,
                error:
                    resultado.error ||
                    "No se ha podido asignar el aviso."
            };
        }


        if (
            resultado.asignado !== true ||
            !resultado.aviso ||
            String(
                resultado.aviso.id_aviso
            ).trim() !== id ||
            String(
                resultado.aviso.vehiculo_id
            ).trim() !== vehiculo
        ) {

            return {
                ok: false,
                incierto: true,
                asignado: false,
                error:
                    "El servidor no ha confirmado la asignación del aviso. " +
                    "Comprueba la lista antes de volver a intentarlo."
            };
        }


        return {
            ok: true,
            incierto: false,
            asignado: true,
            aviso:
                resultado.aviso
        };
    },


    /* =========================================================
       ELIMINAR AVISO
       ---------------------------------------------------------
       Solo elimina el aviso identificado por id_aviso. La lista
       local no debe modificarse hasta recibir confirmación.
    ========================================================= */

    async eliminarAviso(idAviso) {

        const id =
            String(
                idAviso || ""
            ).trim();


        if (!id) {

            return {
                ok: false,
                incierto: false,
                eliminado: false,
                error:
                    "El identificador del aviso es obligatorio."
            };
        }


        if (CONFIG.modo === "mock") {

            return {
                ok: true,
                incierto: false,
                eliminado: true,
                id_aviso: id
            };
        }


        const resultado =
            await enviarAccionAvisoGestion(
                {
                    accion:
                        "eliminar_aviso",
                    id_aviso:
                        id
                },
                TIMEOUT_ELIMINAR_AVISO_MS
            );


        if (!resultado.ok) {

            return {
                ok: false,
                incierto:
                    resultado.incierto === true,
                eliminado: false,
                error:
                    resultado.error ||
                    "No se ha podido eliminar el aviso."
            };
        }


        if (
            resultado.eliminado !== true ||
            resultado.id_aviso === undefined ||
            String(resultado.id_aviso).trim() !== id
        ) {

            return {
                ok: false,
                incierto: true,
                eliminado: false,
                error:
                    "El servidor no ha confirmado la eliminación del aviso " +
                    id +
                    ". Comprueba la lista antes de volver a intentarlo."
            };
        }


        return {
            ok: true,
            incierto: false,
            eliminado: true,
            id_aviso: id
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
