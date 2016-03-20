#arc-notifier

[<img src="https://i.ytimg.com/vi/OCW77kQ1974/hqdefault.jpg">](https://www.youtube.com/watch?v=OCW77kQ1974&feature=youtu.be)

# Instalación
Para instalar este script es necesario tener [Node.js](https://nodejs.org/en/) con NPM instalado. A continuación tan solo hace falta descargar el código y hacer:

```bash
npm install
node index.js
```

> **Nota**: Si al hacer ```npm install``` te produce un error ```Error: ENOENT, stat 'C:\Users\<user>\AppData\Roaming\npm'``` puedes resolverlo [como se indica en este enlace](https://github.com/npm/npm/wiki/Troubleshooting#error-enoent-stat-cusersuserappdataroamingnpm-on-windows-7).

> **Nota:** el script usa actualmente la versión de ArcNode de la [rama update-entities](https://github.com/esri-es/ArcNode/tree/update-entities), por lo que después de correr npm install deberás sobreescribir la carpeta ```node_modules/arc-node``` con el código de esta rama.

# Configuración

## Configuración del servicio
**Importante**: este servicio debe estar protegido (no accesible públicamente) y tener habilitado la opción *[editor traking](http://server.arcgis.com/en/server/10.3/publish-services/windows/editor-tracking-for-feature-services.htm)*.

Además de esto debe contener otros 3 campos: 
* Estado (type: esriFieldTypeString, alias: Estado, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
* last_emailed_user (type: esriFieldTypeString, alias: last_emailed_user, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
* last_emailed_date (type: esriFieldTypeDate, alias: last_emailed_date, SQL Type: sqlTypeOther, length: 8, nullable: true, editable: true)

## Fichero: arcnode_config.json
En arcnode_config.json hay que introducir las credenciales de un admin de la organización

```javascript
{
    "username":       "",
    "password":       "",
    "account_id":     "",
    "root_url":       "",
    "services_url":   ""
}
```

## Fichero: arcnotifier_config.json

```javascript
{
  "timeScheduler": "*/20 * * * * *",
  
  "feature_service": "http://services.arcgis.com/K99CvydNYkQGvDRu/arcgis/rest/services/se%C3%B1ales_rivas/FeatureServer/0",
  
  "smtp_server": {
     "user":    "", 
     "password":"", 
     "host":    "", 
     "port":    587,
     "tls":     true
  },
  
  "groups": {
    "e00413ab07364c18a55612becb3c4938": "policia",
    "87b21076793c49c88617aa31dd0e4734": "mantenimiento",
    "78030d9d11b446f5ba59281fdb1fee8a": "oitr"
  },
   
  "flow": {
    "policia": {
      "INICIADO": {
        "from": "Raul Jimenez <raul.jimenez@esri.es>",
        "to": "Departamento de mantenimiento <hhkaos+mto@gmail.com>",
        "subject": "Aviso: Nuevo expediente abierto",
        "text": "Se ha abierto un nuevo expediente, nº asignado ${OBJECTID}\nhttp://admonlocal.maps.arcgis.com/home/webmap/viewer.html?webmap=ffcdb618d1914de0a0376aa810a6511f"
      },
      "PENDIENTE OITR": {
        "from": "Raul Jimenez <raul.jimenez@esri.es>",
        "to": "OITR Rivas <hhkaos+oitr@gmail.com>",
        "subject": "Aviso: Expediente validado",
        "text": "Policia confirma que el expediente ${OBJECTID} ha sido subsanado correctamente por mantenimiento\nhttp://admonlocal.maps.arcgis.com/home/webmap/viewer.html?webmap=fde068e009db4102ab757581fb48ec9d"
      }
    },
    "mantenimiento": {
      "SUBSANADO": {
        "from": "Raul Jimenez <raul.jimenez@esri.es>",
        "to": "Departamento de policía - Unidad de tráfico <hhkaos+policia@gmail.com>",
        "subject": "Aviso: Expediente subsanado",
        "text": "El expediente ${OBJECTID} ha sido subsanado por mantenimiento\nhttp://admonlocal.maps.arcgis.com/home/webmap/viewer.html?webmap=ec04ebede96b4a38a9512b3e5cfe7676"
      }
    },
    "oitr": {

    }
  }
}
```

# Ejecución y reinicio
Accedemos al directorio donde se encuentra el script (en el caso del piloto de rivas: ```C:\inetpub\wwwroot\flujo-rivas\arc-notifier\```)

Y ejecutamos:
```
node index.js
```

En caso de que fuese necesario reiniciarlo tan sólo tenemos que para el script con Ctrl + C y volver a ejecutarlo.
Ctrl