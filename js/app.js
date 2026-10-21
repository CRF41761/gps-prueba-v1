Prueba adicional ejecutada:

#	Prueba	Resultado
2-b	El mapa no colorea vehículos sin ruta con R1, R2 o R3	OK
Resultado total de la suite nueva: 11/11 pruebas correctas.

Regresión de bloques anteriores
También se volvieron a ejecutar las suites locales:

Bloque 1: 11/11 correctas.
Bloque 2: 11/11 correctas.
Validación sintáctica
OK node --check js\app.js
OK node --check js\rutas.js
OK node --check js\mapa.js
No queda ninguna generación "R" + ... ni rutaActiva: rutaHabitual en js/.

5. Pruebas no ejecutadas
No se ejecutaron, por estar fuera del alcance y/o prohibidas:

Prueba end-to-end en navegador real.
Validación visual del selector de rutas.
Carga y guardado real contra Google Sheets / Drive / Apps Script.
Recarga real de planes desde backend.
Prueba con datos reales de producción.
OSRM real.
Cloudflare Worker real.
Publicación o despliegue.
Guardado, borrado y gestión del catálogo en entorno real.
6. Punto documentado: selector y guardado sin ruta
El selector actual no tiene una opción vacía. Si un plan nuevo queda con rutaActiva: "":

El navegador puede mostrar visualmente la primera ruta del catálogo.
El plan sigue teniendo rutaActiva vacío hasta que el usuario cambie explícitamente la selección.
El payload de guardado enviaría ruta_id: "".
No se modificó el selector ni el contrato de guardado porque el bloque 3 lo prohíbe expresamente. Queda documentado para un bloque posterior.

También se mantiene sin cambios la semántica existente del plan guardado: si el plan guardado contiene paradas, estas sustituyen a las paradas previas del plan reconstruido. No se ha cambiado esa lógica en este bloque.

7. Hashes SHA-256 antes y después
Archivo	Antes	Después
js\app.js	004CAF71DEE37B1E88D07926C9E9E734BC0A27D670E096149DE04FF111FB1EA8	3D198D621C744CAFCD689FC9FE855F12C9EDA616E1B4716E9FFA9D7CDF537D30
js\rutas.js	0D64326F643F13E350D76B4576615BCAB5FAB59DF4AF57B9153ADFCA53AA6803	6A005CA8FC0563D148A9004DF8FE7A7DF55C46185D2CBCF816F8BBB4BEC69C85
js\mapa.js	7B5FE297C627FF15C52C03D7E445C6A71F8C887FE05BA8DE4C20324EE455A0F3	0F38D1A5640A2AFAE7DA1E297E1AA65A4025515F5BEE8A5A701C537EA374A021
js\vehiculos.js	EF5D64591220FC687E57AE98CEAEC080D6187B6FD04902057E8B420DBB6BC56B	Sin cambios
js\config.js	EBCA83E98A5726E8429D40CA156F1997C437541F38CEEA6ECAFCC82278D55353	Sin cambios
js\mock-data.js	56043CFE3B9B15BA0F6A61C2BFD2213A2BF41E59938A2AED191569562B434A77	Sin cambios
index.html	417C686D56660CC3844B106881F02C1A07BF19BEE982F41B01DDC5E3FD39C6E6	Sin cambios
styles.css	F5E2990638FF59949D16AE88CF96EDA88A9224505C97B1C78CDD05B486AD3B8F	Sin cambios
8. Confirmación de aislamiento
Las pruebas se ejecutaron en un sandbox vm de Node.js.
Se usaron mocks locales de DOM y datos.
fetch estaba bloqueado para lanzar error si se intentaba usar.
No se accedió a Google Sheets, Google Drive, Apps Script, OSRM real, Cloudflare Worker ni producción.
No se publicó ni desplegó nada.
No se inició el bloque 4.
Tests auxiliares y copias de seguridad
No deben copiarse como archivos del proyecto:

C:\Users\Admin\AppData\Local\Temp\opencode\bloque3_rutas\pruebas_bloque3.js
C:\Users\Admin\AppData\Local\Temp\opencode\backup_bloque3_rutas_20261021\
ARCHIVOS QUE DEBES ACTUALIZAR
js/app.js
js/rutas.js
js/mapa.js
