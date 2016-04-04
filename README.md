#arc-notifier

# Instalación
Para instalar este script es necesario tener [Node.js](https://nodejs.org/en/) con NPM instalado. A continuación tan solo hace falta descargar el código y hacer:

```bash
npm install
node index.js
```

# Configuración

## Configuración del servicio
**Importante**: 

Para el correcto funcionamiento el servicio tiene que:

1. Que estar protegido (no accesible públicamente)
2. Tener habilitado la opción *[editor traking](http://server.arcgis.com/en/server/10.3/publish-services/windows/editor-tracking-for-feature-services.htm)*.
3. Y contener estos tres campos editables:
  * **Estado** de tipo esriFieldTypeString
  * **last_emailed_user** de tipo esriFieldTypeString
  * **last_emailed_date** de tipo esriFieldTypeDate

## Fichero de configuración

Para configurar el servicio tendremos que crear un fichero config.json en la carpeta raíz. Para facilitar esta tarea se han creado dos ficheros de ejemplo **[config_agol.sample.json](https://github.com/esri-es/ArcNotifier/blob/master/config_agol.sample.json)** y **[config_portal.sample.json](https://github.com/esri-es/ArcNotifier/blob/master/config_portal.sample.json)**	que contienen un esqueleto de la estructura del fichero para configurar el servicio contra *ArcGIS Online* y *Portal for ArcGIS* respectivamente.

Veamos a continuación cada uno de los parámetros que incluyen estos ficheros.

* **organization**: contiene 

  * **username**: nombre de usuario con permisos de edición sobre el servicio (recomendado: administrador)
  * **password**: contraseña del mismo
  * **acount_id** (sólo necesario en ArcGIS Online): ID de la cuenta, si la URL del servicio es ```http://services.arcgis.com/Q6ZFRRvMTlsTTFuP/arcgis/rest/services/...``` el ID sería **Q6ZFRRvMTlsTTFuP** 
  * **root_url**: en caso de usar ArcGIS Online sería **www.arcgis.com**, sino el dominio donde se encuentra alojado su Portal.
  * **services_url**: en caso de usar ArcGIS Online sería **services.arcgis.com**, sino el dominio donde se encuentra alojado su Portal.
  * **arcgisPath** (sólo necesario en Portal for ArcGIS): **arcgis** 
  * **portalPath** (sólo necesario en Portal for ArcGIS): **portal** 
  * **port**: en caso de usar ArcGIS Online **443**, en caso de Portal **7443**
  * **allowSelfSigned**: si el Portal está firmado con un certificado SSL de una autoridad no certificada (sólo necesario en Portal for ArcGIS)
  * **groups**: objeto con tantos pares clave/valor como grupos haya en nuestro flujo de trabajo. Puede usar la siguiente herramienta para obtener los [identificadores de los grupos a los que pertenece un usuario](https://esri-es.github.io/ArcNotifier/get-group-id.html).

* **timeScheduler**: especifica la frecuencia con la que se comprobarán las actualizaciones en [formato Cron](https://en.wikipedia.org/wiki/Cron). Por ejemplo: ```"*/15 * * * * *"``` representa cada 15 segundos.
  
* **portal_item**: ID del item donde se encuentra el servicio

* **layer**: capa del servicio que contiene los registros/incidencias
  
* **smtp_server**: servidor SMTP que se usará para el envío de correos
  * **user**: usuario de correo
  * **password**: password del usuario
  * **host**: direción del servidor SMTP (IP/Dominio)
  * **port**: puerto
  * **tls**: booleano indicando si usa TLS o no.
  
* **flow**: este objeto define qué cambios de estado provocarán el envío de notificaciones, a quién, y qué se enviará.

### Definición de un flujo

````
"policia": {
      "INICIADO": {
        "from": "Esteban Armas <esteban.armas@esri.es>",
        "to": "Departamento de mantenimiento <raul.jimenez@esri.es>",
        "subject": "Aviso: Nuevo expediente abierto",
        "text": "Se ha abierto un nuevo expediente, nº asignado \nhttp://www.myapp.com/app/index.html?id=${OBJECTID}"
      },
      "PENDIENTE OITR": {
        "from": "Esteban Armas <esteban.armas@esri.es>",
        "to": "OITR Rivas <raul.jimenez@esri.es>",
        "subject": "Aviso: Expediente validado",
        "text": "Policia confirma que el expediente ${OBJECTID} ha sido subsanado correctamente por mantenimiento\nhttp://admonlocal.maps.arcgis.com/home/webmap/viewer.html?webmap=fde068e009db4102ab757581fb48ec9d&marker=#{X},#{Y},25830&level=17"
      }
    },
    "mantenimiento": {
      "SUBSANADO": {  
        "from": "Esteban Armas <esteban.armas@esri.es>",
        "to": "Departamento de policía - Unidad de tráfico <raul.jimenez@esri.es>",
        "subject": "Aviso: Expediente subsanado",
        "text": "El expediente ${CODIGO} ha sido subsanado por mantenimiento ver enlace http://www.myapp.com/app/index.html?id=${OBJECTID}"
      }
    },
    "oitr": {

    }
```


# Ejecución y reinicio
Accedemos al directorio donde se encuentra el script y ejecutamos:
```
node index.js
```

En caso de que fuese necesario reiniciarlo tan sólo tenemos que para el script con Ctrl + C y volver a ejecutarlo.
Ctrl

# FAQ

1. Si al hacer ```npm install``` se produce en error ```Error: ENOENT, stat 'C:\Users\<user>\AppData\Roaming\npm'``` puedes resolverlo [como se indica en este enlace](https://github.com/npm/npm/wiki/Troubleshooting#error-enoent-stat-cusersuserappdataroamingnpm-on-windows-7).
