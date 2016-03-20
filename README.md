#arc-notifier

# Instalación
Para instalar este script es necesario tener [Node.js](https://nodejs.org/en/) con NPM instalado. A continuación tan solo hace falta descargar el código y hacer:

```bash
npm install
node index.js
```

> **Nota**: Si al hacer ```npm install``` te produce un error ```Error: ENOENT, stat 'C:\Users\<user>\AppData\Roaming\npm'``` puedes resolverlo [como se indica en este enlace](https://github.com/npm/npm/wiki/Troubleshooting#error-enoent-stat-cusersuserappdataroamingnpm-on-windows-7).

# Configuración

## Configuración del servicio
**Importante**: este servicio debe estar protegido (no accesible públicamente) y tener habilitado la opción *[editor traking](http://server.arcgis.com/en/server/10.3/publish-services/windows/editor-tracking-for-feature-services.htm)*.

Además de esto debe contener otros 3 campos: 
* Estado (type: esriFieldTypeString, alias: Estado, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
* last_emailed_user (type: esriFieldTypeString, alias: last_emailed_user, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
* last_emailed_date (type: esriFieldTypeDate, alias: last_emailed_date, SQL Type: sqlTypeOther, length: 8, nullable: true, editable: true)

## Fichero: config.json


```javascript
{
  "organization": {
    "username":         "<Your username>",
    "password":         "<Your password>",
    "account_id":       "",
    "root_url":         "<Your Portal's domain>",
    "services_url":     "<Your Portal's domain>",
    "arcgisPath":       "<If using Arcgis Online leave it empty, if not default is: arcgis>",
    "portalPath":       "<If using Arcgis Online leave it empty, if not default is: portal>",
    "port":             <Default: 443, portal uses 7443>,
    "allowSelfSigned":  <Default: false; true if self signed certificates are valid>,
    "groups": {
      "2821ddd9e6144df7a6f2ae4f0d85387c": "policia",
      "2f90abf3e0b448a6ab5e2308a5b2df7e": "mantenimiento",
      "7bd2c9f1d77f44308aae39535d505b39": "oitr"
    }
  },

  "timeScheduler": "*/15 * * * * *",
  
  "portal_item": "33579f7b887440dfa5fca9df0d6c365f",
  "layer": 0,
  
  "smtp_server": {
     "user":    "<Your username>",
     "password":"<Your password>",
     "host":    "<Your smtp server>", 
     "port":    587,
     "tls":     true
  }, 
   
  "flow": {
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
        "text": "Policia confirma que el expediente ${OBJECTID} ha sido subsanado correctamente por mantenimiento\nhttp://maps.arcgis.com/home/webmap/viewer.html?webmap=fde068e009db4102ab757581fb48ec9d&marker=#{X},#{Y},25830&level=17"
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
  }
}

```

# Ejecución y reinicio
Accedemos al directorio donde se encuentra el script y ejecutamos:
```
node index.js
```

En caso de que fuese necesario reiniciarlo tan sólo tenemos que para el script con Ctrl + C y volver a ejecutarlo.
Ctrl