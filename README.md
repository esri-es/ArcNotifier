#arc-notifier
Arc-Notifier es un script escrito en NodeJS que permite enviar notificaciones vía email cuando un registro cambia de estado. El principal propósito de este script es ayudar a crear un sistema de notificaciones para flujos de trabajo como veremos más adelante.

# Instalación
Para instalar este script es necesario tener [Node.js](https://nodejs.org/en/) con [NPM](http://blog.npmjs.org/post/85484771375/how-to-install-npm) instalado. A continuación tan solo hace falta descargar el código y hacer:

```bash
npm install
```

# Configuración

## Configuración del servicio

Para el correcto funcionamiento el servicio alojado en *ArcGIS Online* o *ArcGIS server* tiene que:

1. Estar protegido (no accesible públicamente)
2. Tener habilitado la opción *[editor tracking](http://server.arcgis.com/en/server/10.3/publish-services/windows/editor-tracking-for-feature-services.htm)*.
3. Y contener estos tres campos editables:
  * **Estado** de tipo *esriFieldTypeString*
  * **last_emailed_user** de tipo *esriFieldTypeString*
  * **last_emailed_date** de tipo *esriFieldTypeDate*

## Fichero de configuración

Para configurar el servicio tendremos que crear un fichero llamado **config.json** en la carpeta raíz. Para facilitar esta tarea se han creado dos ficheros de ejemplo **[config_agol.sample.json](https://github.com/esri-es/ArcNotifier/blob/master/config_agol.sample.json)** y **[config_portal.sample.json](https://github.com/esri-es/ArcNotifier/blob/master/config_portal.sample.json)**	que contienen un esqueleto de la estructura del fichero para configurar el servicio contra *ArcGIS Online* y *Portal for ArcGIS* respectivamente.

Veamos a continuación cada uno de los parámetros que incluyen estos ficheros.

* **organization**: contiene 

  * **username**: nombre de usuario con permisos de edición sobre el servicio (recomendado: administrador)
  * **password**: contraseña del mismo
  * **acount_id** (sólo necesario en ArcGIS Online): ID de la cuenta, si la URL del servicio es ```http://services.arcgis.com/Q6ZFRRvMTlsTTFuP/arcgis/rest/services/...``` el ID sería **"Q6ZFRRvMTlsTTFuP"** 
  * **root_url**: en caso de usar ArcGIS Online sería **"www.arcgis.com"**, sino el dominio donde se encuentra alojado su Portal.
  * **services_url**: en caso de usar ArcGIS Online sería **"services.arcgis.com"**, sino el dominio donde se encuentra alojado su Portal.
  * **arcgisPath** (sólo necesario en Portal for ArcGIS): **"arcgis"** 
  * **portalPath** (sólo necesario en Portal for ArcGIS): **"portal"** 
  * **port**: en caso de usar ArcGIS Online **443**, en caso de Portal **7443**
  * **allowSelfSigned**: si el Portal está firmado con un certificado SSL de una autoridad no certificada (sólo necesario en Portal for ArcGIS)
  * **groups**: objeto con tantos pares clave/valor como grupos haya en nuestro flujo de trabajo. Esta asociación se realiza para facilitar la lectura del flujo que crearemos posteriormente y al mismo tiempo garantizar que aunque cambie el nombre del grupo el flujo seguirá funcionando correctamente. Puede usar la siguiente herramienta para obtener los [identificadores de los grupos a los que pertenece un usuario](https://esri-es.github.io/ArcNotifier/get-group-id.html).

* **timeScheduler**: especifica la frecuencia con la que se comprobarán las actualizaciones en [formato Cron](https://en.wikipedia.org/wiki/Cron). Por ejemplo: ```"*/15 * * * * *"``` representa cada 15 segundos.
  
* **portal_item**: ID del item donde se encuentra el servicio

* **layer**: número entero que representa el índice de la capa del servicio que contiene los registros/incidencias
  
* **smtp_server**: servidor SMTP que se usará para el envío de correos
  * **user**: usuario de correo
  * **password**: password del usuario
  * **host**: direción del servidor SMTP (IP/Dominio)
  * **port**: puerto
  * **tls**: booleano indicando si usa TLS o no.
  
* **flow**: este objeto define qué cambios de estado provocarán el envío de notificaciones, a quién, y qué se enviará.

### Definición de un flujo de trabajo
La configuración del flujo se hace a través del objeto **flow**, este objeto contiene por cada grupo de la organización los estados que servirán de disparadores del siguiente modo:
````javascript
"flow":{
 "nombre_grupo_1":{
  "estado_disparador_1":{
   ... detalles de la notificación...
  },
  "estado_disparador_2":{
   ... detalles de la notificación...
  }
 }
````
De este modo se indica que cuando un usuario perteneciente al *nombre_grupo_1* añada o modifique un registro en el servicio que tenga alguno de los estados indicados (*estado_disparador_1* o *estado_disparador_2*) se lanzará la notificación correspondiente.

Veamos un ejemplo real:

````javascript
"flow":{
 "policia": {
   "INICIADO": {
     "from": "Sistema automático de notificaciones <script@arcnotifier.es>",
     "to": "Departamento de mantenimiento <personal@mantenimiento.es>",
     "subject": "Aviso: Nuevo expediente abierto",
     "text": "Se ha abierto un nuevo expediente con el nº asignado ${OBJECTID}.\nhttp://www.myapp.com/app/index.html?id=${OBJECTID}"
   },
   "PENDIENTE OIT": {
     "from": "Sistema automático de notificaciones <script@arcnotifier.es>",
     "to": "Oficina de Información Territorial <personal@oit.es>",
     "subject": "Aviso: Expediente validado",
     "text": "Policia confirma que el expediente ${OBJECTID} ha sido subsanado correctamente por mantenimiento \nhttp://www.myapp.com/app/index.html?id=${OBJECTID}"
   }
 },
 "mantenimiento": {
   "SUBSANADO": {  
     "from": "Sistema automático de notificaciones <script@arcnotifier.es>",
     "to": "Departamento de policía <personal@policia.es>",
     "subject": "Aviso: Expediente subsanado",
     "text": "El expediente ${CODIGO} ha sido subsanado por mantenimiento ver enlace http://www.myapp.com/app/index.html?id=${OBJECTID}"
   }
 }
}
```
En este ejemplo vemos que el sistema enviará las siguientes notificaciones:
* Cuando un usuario del grupo **policia** añada o modifique un registro y lo deje en estado **INICIADO** o **PENDIENTE OIT**, en función del estado la notificación irá dirigido a un destinatario distinto:
 * **INICIADO**: se le enviará a **personal@mantenimiento.es** (que podría ser una lista de correo) de forma que todo el departamento de mantenimiento tenga constancia de la incidencia. El correo tendría el título y el cuerpo indicados en las propiedades del objeto.
 * **PENDIENTE OIT**: se le enviará a **personal@oit.es** con el título y el cuerpo indicados.
* Cuando un usuario del grupo **mantenimiento** añada o modifique un registro y lo deje en estado **SUBSANADO** se le enviará una notificación a **personal@policia.es**.

> **IMPORTANTE**: el nombre de los estados debe coincidir exáctamente con el valor que aloje el servicio (mayúsculas, minúsculas y espacios incluido), al igual que los grupos de los grupos con los especificados en el campo **groups**.

# Ejecución y reinicio
Accedemos al directorio donde se encuentra el script y ejecutamos:
```
node index.js
```

En caso de que fuese necesario reiniciarlo tan sólo tenemos que para el script con Ctrl + C y volver a ejecutarlo.
Ctrl

# FAQ

Para dudas y sugerencias puede dirigirse a los [issues del proyecto](https://github.com/esri-es/ArcNotifier/issues).

Si al hacer ```npm install``` se produce en error ```Error: ENOENT, stat 'C:\Users\<user>\AppData\Roaming\npm'``` puedes resolverlo [como se indica en este enlace](https://github.com/npm/npm/wiki/Troubleshooting#error-enoent-stat-cusersuserappdataroamingnpm-on-windows-7).

