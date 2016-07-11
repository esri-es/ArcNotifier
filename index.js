'use strict';

//var config  = require('./config/_config'),
var config = require("./"+process.argv[2]),
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

  arcgis.item(config.portal_item.trim()).then(function (item) {
    // Checking if feature service is public (if so -> error)

    if(item.access === 'public'){
      var itemURL = 'http://' + config.organization.root_url + '/' + config.organization.portalPath + '/home/item.html?id=' + config.portal_item;
      console.log('\nThe item can not public:'.red, itemURL);
    }else if(item.type !== 'Feature Service'){
      console.log('\nThe item type is not "Feature service" it is:'.red, item.type);
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

        try{
          res.body = JSON.parse(res.body);
        }catch(error){
          console.log("\nError:".red, error);
          console.log("res.body=",res.body);
        }
        var fields = res.body.layers[config.layer].fields;
        do{
          if(requiredFields.indexOf(fields[i].name.toLowerCase()) !== -1){
            requiredFieldsPresent++;
          }
          i++;
        }while(requiredFieldsPresent < 3 && i < fields.length);

        // Checking that exists all fields in the service to fill the emailtemplates
        var regexp = /.*(\${.*}).*/i,
            emailTemplate, ocurrence,
            unExistingFields = [],
            validTemplate = true;

        for(var f in config.flow){
          if(config.flow.hasOwnProperty(f)){
            for(var t in config.flow[f]){
              if(config.flow[f].hasOwnProperty(t)){
                emailTemplate = config.flow[f][t].text;

                for(var property in fields){
                  // Remove multiple ocurrences
                  emailTemplate = emailTemplate.split('${'+fields[property].name+'}').join('')
                }

                do{
                  ocurrence = regexp.exec(emailTemplate);
                  if(ocurrence){
                    emailTemplate = emailTemplate.replace(ocurrence[1], '');
                    if(unExistingFields.indexOf(ocurrence[1]) === -1){
                      unExistingFields.push(ocurrence[1]);
                    }
                  }
                }while(ocurrence);
              }
            }
          }
        }
        if (unExistingFields.length > 0){
            validTemplate = false;
        }
        // End of <Check email templates>


        //
        /*
        var unExistingVars = [], tmpVar;

        regexp.exec("Policia confirma que el expediente ${OBJECTID} ha sido subsanado c")
        if()
        Policia confirma que el expediente ${OBJECTID} ha sido subsanado ${OBJECTIDasdasd}  c
        */
        if(requiredFieldsPresent !== 3){
          console.log("\nError: ".red, 'Some required fields are not present -> ' + requiredFields.join(', '));
        }else if(res.body.editorTrackingInfo.enableEditorTracking !== true){
          console.log("\nError: ".red, 'Editor tracking is not enabled');
        //}else if(!validTemplate){

        }else{
          if(!validTemplate){
            console.log(('\nWarning: Some fields at the email template does not exist in the service -> ' + unExistingFields.join(', ')).bgYellow.black);
          }

          console.log('\nService is properly configured'.cyan);
          cronStart();
        }
      });
    }
  },function(reason){
    console.log("\nError getting item: ".red, reason);
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
            returnExtentOnly: false,
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
          var arrayPromises = [];
          // Process every pending feature
          for(var i in res.features){
            //console.log(response.token);
            var options = {
              serviceUrl: feature_service,
              query: {
                f: 'json',
                where:  'OBJECTID = '+res.features[i].attributes['OBJECTID'],
                outFields: '*',
                returnExtentOnly: true,
                token: response.token,
              }
            };
            arrayPromises.push(service.getFeatures(options));
          }
          Promise.all(arrayPromises).then(function(datos){
            //console.log(datos);
            util.processFeature({
              config: config,
              service: service,
              feature_service: feature_service,
              res: res,
              i: i,
              extents: datos
            });
          });
        });
      });
    }, null, true, 'Europe/Madrid');
  } catch(ex) {
    console.log('Cron pattern not valid: ', ex);
  }
}
