#arc-notifier
Arc-Notifier es un script escrito en NodeJS que permite enviar notificaciones vía email cuando un registro de un servicio publicado en ArcGIS Online o Portal for ArcGIS cambia de estado. El principal propósito de este script es ayudar a crear un sistema de notificaciones para flujos de trabajo como podemos ver en este vídeo de demostración (~16min):

[<img src="https://i.ytimg.com/vi/reX7ZTi2Alo/hqdefault.jpg">](https://www.youtube.com/watch?v=reX7ZTi2Alo)

> **Nota**: Esta desmotración se ha realizado sobre una organización de ArcGIS Online
> **Nota 2**:

# Video tutorial de instalación y configuración
En este otro vídeo (~19min) podemos ver un ejemplo de cómo configurar el script con una organización de Portal for ArcGIS:

[<img src="https://i.ytimg.com/vi/8Bwt25WbKjM/hqdefault.jpg">](https://www.youtube.com/watch?v=8Bwt25WbKjM)

# Manual

## Instalación

Para instalar este script es necesario tener [Node.js](https://nodejs.org/en/) con [NPM](http://blog.npmjs.org/post/85484771375/how-to-install-npm) instalado. A continuación tan solo hace falta descargar el código y hacer:

```bash
npm install
```

## Configuración

### Configuración del servicio

Para el correcto funcionamiento el servicio alojado en *ArcGIS Online* o *ArcGIS server* tiene que:

1. Estar protegido (no accesible públicamente)
2. Tener habilitado la opción *[editor tracking](http://server.arcgis.com/en/server/10.3/publish-services/windows/editor-tracking-for-feature-services.htm)* (**importante**: para que el tracking funcione correctamente en un servicio alojado en ArcGIS Online el servicio debe de estar publicado en ArcGIS Online, no puede estar en una instancia de ArcGIS Server local).
3. Y contener estos tres campos editables:
  * **Estado** de tipo *esriFieldTypeString*
  * **last_emailed_user** de tipo *esriFieldTypeString*
  * **last_emailed_date** de tipo *esriFieldTypeDate*

Se han compartido en la [carpeta data](https://github.com/esri-es/ArcNotifier/tree/master/data) del repositorio una base de datos de ejemplo en dos formatos: [GDB](https://github.com/esri-es/ArcNotifier/raw/master/data/GDB_SAMPLE.gdb.zip) y [esquema XML](https://raw.githubusercontent.com/esri-es/ArcNotifier/master/data/XML_GDB.XML)

### Fichero de configuración


## Ejecución y reinicio
Accedemos al directorio donde se encuentra el script y ejecutamos:
```
node index.js
```

En caso de que fuese necesario reiniciarlo tan sólo tenemos que para el script con Ctrl + C y volver a ejecutarlo.
Ctrl

## FAQ

Para dudas y sugerencias puede dirigirse a los [issues del proyecto](https://github.com/esri-es/ArcNotifier/issues).

Si al hacer ```npm install``` se produce en error ```Error: ENOENT, stat 'C:\Users\<user>\AppData\Roaming\npm'``` puedes resolverlo [como se indica en este enlace](https://github.com/npm/npm/wiki/Troubleshooting#error-enoent-stat-cusersuserappdataroamingnpm-on-windows-7).
