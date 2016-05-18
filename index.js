'use strict';

var config  = require('./config'),
    ArcGIS  = require('arcgis'),
    Utils  = require('./utils.js'),
    colors = require('colors'),
    ArcNode = require('arc-node'),
    CronJob = require('cron').CronJob,

    service = new ArcNode(config.organization),
    util = new Utils(config),

    oldLog  = console.log,
    DEBUG   = true;

var feature_service, arcgis;

// If DEBUG is true we will show log messages
console.log = function(message,param){
  if(DEBUG === true){
    oldLog.apply(console, arguments);
  }
};

console.log("Starting process...".green);

service.getToken().then(function(response){
  arcgis = ArcGIS({
    'token': response.token,
    'domain': config.organization.root_url + ':' + config.organization.port + '/' + config.organization.arcgisPath
  });
  console.log("\nNew access token:".green, ((response.token)? "done": "error"));
  
  arcgis.item(config.portal_item).then(function (item) {
    // Checking if feature service is public (if so -> error)
    if(item.access === 'public'){
      var itemURL = 'http://' + config.organization.root_url + '/' + config.organization.portalPath + '/home/item.html?id=' + config.portal_item;
      console.log('\nThe item can not public:'.red, itemURL);
      process.exit(1);
    }else{

      //feature_service = item.url.replace('http:','https:') + '/' + config.layer;
      feature_service = item.url + '/' + config.layer;
      console.log("\nFeature service:".green, feature_service);

      try {
        new CronJob(config.timeScheduler, function() {
          console.log('\nCheck for new updates:'.cyan, new Date());

          //Get a token valid for 21600 minutes
          service.getToken().then(function(response){
            
            // Recover new entities which hasn't been closed and has been modified
            var options = {
              serviceUrl: feature_service,
              query: {
                f: 'json',
                where:  '(last_edited_date > last_emailed_date OR last_emailed_date is null) ' +
                        'AND created_date > \'5/18/2016\' ' +
                        'AND Estado <> \'FINALIZADO\'',
                outFields: '*',
              }
            };
            service.getFeatures(options).then(function(res){
              if(res.error && res.error.code === 400){
                console.log("\nError: ".red, res.error.message);
                console.log("\nQuery: ".red, options.query);
                return 0;
              }
                
              console.log("\nEntities unclosed:".yellow, res.features.length);

              // Process every pending feature
              for(var i in res.features){
                util.processFeature({
                  config: config,
                  service: service,
                  feature_service: feature_service,
                  res: res,
                  i: i
                });
              }

            });
          });
        }, null, true, 'Europe/Madrid');
      } catch(ex) {
        console.log('Cron pattern not valid: ', ex);
      }
    }
  });
});