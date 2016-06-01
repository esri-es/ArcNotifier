'use strict';

var config  = require('./config/_config'),
    ArcGIS  = require('arcgis'),
    Utils  = require('./utils.js'),
    colors = require('colors'),
    ArcNode = require('arc-node'),
    CronJob = require('cron').CronJob,
    unirest = require('unirest'),
    qs = require('qs'),


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

console.log("\nChecking configuration...".green);

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

      var admin_service_url = item.url.replace("/rest/","/rest/admin/");
      console.log("\nAdmin service url:".green, admin_service_url);

      var req = unirest("GET", admin_service_url);

      req.query({
        "f": "json",
        "status": "json",
        "token": response.token
      });

      //Checking if editor tracking and fields are properly configured
      req.end(function (res) {
        if (res.error) throw new Error(res.error);
        var i = 0, requiredFieldsPresent = 0, requiredFields = ["estado", "last_emailed_user", "last_emailed_date"];

        res.body = JSON.parse(res.body);

        var fields = res.body.layers[config.layer].fields;
        do{
          if(requiredFields.indexOf(fields[i].name.toLowerCase()) !== -1){
            requiredFieldsPresent++;
          }
          i++;
        }while(requiredFieldsPresent < 3 && i < fields.length);

        if(requiredFieldsPresent !== 3){
          console.log("\nError: ".red, 'Some required fields are not present -> ' + requiredFields.join(', '));
        }else if(res.body.editorTrackingInfo.enableEditorTracking !== true){
          console.log("\nError: ".red, 'Editor tracking is not enabled');
        }else{
          console.log('\nService is properly configured'.cyan);
          cronStart();
        }
      });
    }
  });
});

function cronStart(){
  console.log('\nStarting Cron task:'.cyan, new Date());
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
            where:  '(last_edited_date > last_emailed_date OR last_emailed_date is null) ',
            outFields: '*',
          }
        };

        if(config.whereFilter){
          options.query.where += 'AND ' + config.whereFilter;
        }

        service.getFeatures(options).then(function(res){
          if(res.error && res.error.code === 400){
            console.log("\nError: ".red, res.error.message);
            //console.log("\nQuery: ".red, options.query);
            options.query.f = "html";
            console.log("\nQuery: ".red, options.serviceUrl + "/query?" + qs.stringify(options.query));
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
