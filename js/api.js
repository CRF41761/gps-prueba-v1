/* =========================================================
   API
========================================================= */

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
    }

};
