'use strict';

var config  = require('./config'),
    emailjs = require('./node_modules/emailjs/email'),
    ArcGIS  = require('arcgis'),
    CronJob = require('cron').CronJob,
    ArcNode = require('arc-node'),
    service = new ArcNode(config.organization),
    oldLog  = console.log,
    DEBUG   = true;

// If DEBUG is true we will show log messages
console.log = function(message,param){
  if(DEBUG === true){
    oldLog.apply(console, arguments);
  }
};

// Gets an ID and returns a human-readable-string
var getGroupName = function(str){
  if(config.organization.groups.hasOwnProperty(str)){
    return config.organization.groups[str];
  }else{
    return null;
  }
};

// Replace ${attribute_name} for its value in object f
var parseMail = function(email, f, geo){
  var tmp = email;
  for(var property in f){
    if (f.hasOwnProperty(property)) { tmp = tmp.replace('${'+property+'}', f[property]); }
  }
  tmp = tmp.replace('#{X}', geo['x']);
  tmp = tmp.replace('#{Y}', geo['y']);
  return tmp;
};

// Extract email from a string
var extractEmails = function(text){
    return text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi).join(',');
};

var userGroup = config.flow;

var last_user_group_name, email, n, updateFeature, feature_service;


// Checking if feature service is public (if so -> error)
service.getToken().then(function(response){
  var arcgis = ArcGIS({
    'token': response.token,
    'domain': config.organization.root_url + ':' + config.organization.port + '/' + config.organization.arcgisPath
  });

  arcgis.item(config.portal_item)
    .then(function (item) {
      
      if(item.access === 'public'){
        var itemURL = 'http://' + config.organization.root_url + '/' + config.organization.portalPath + '/home/item.html?id=' + config.portal_item;
        console.log('The item can not public:', itemURL);
        process.exit(1);
      }else{
        
        feature_service = item.url.replace('http:','https:') + '/' + config.layer;

        //console.log('feature_service=',feature_service);
      }
    });
});

try {
  new CronJob(config.timeScheduler, function() {
    console.log('Comprobamos si hay actualizaciones');
    console.log('Date = ', new Date());


  //Get a token valid for 21600 minutes
  service.getToken().then(function(response){

    // Recover new entities which hasn't been closed and has been modified
    service.getFeatures({
      serviceUrl: feature_service,
      query: {
          f: 'json',
          where: '(last_edited_date > last_emailed_date OR last_emailed_date is null) AND created_date > \'3/19/2016\' AND Estado <> \'FINALIZADO\'',
          outFields: '*',
      }
    }).then(function(res){
      
      for(var i in res.features){
          
          (function(i){
            
            var f = res.features[i].attributes;
			var geo = res.features[i].geometry;
            
            // Get user info
            service.getUserInfo({
              username: f.last_edited_user
            }).then(function(res){
              var hasTrigger = false;
              for( var g in res.groups){
                
                last_user_group_name = getGroupName(res.groups[g].id);
                
                // Is a group with triggers
                if(last_user_group_name){
                  
                  if(userGroup[last_user_group_name].hasOwnProperty(f['Estado'])){
                    console.log('Expediente ' + f.OBJECTID + ': ' + f.last_edited_user + ' pertenece al grupo ' + last_user_group_name + ' que tiene un trigger para el estado ' + f['Estado']);
                    hasTrigger = true;
                    break;
                  }
                }
              }
              
              // If user belongs to a group which has a trigger for current state
              if(hasTrigger){
                
                var toField = extractEmails(userGroup[last_user_group_name][f['Estado']].to);
                
                //TODO: toFiled is not an email is the name of an attributes which should contain an username of this organization
                //if (toField.indexOf('@') === -1){
                //  toField = getOwnerEmail('owner');
                //}
                
                if(toField !== f.last_emailed_user){

                  email = userGroup[last_user_group_name][f['Estado']];

                  email.text = parseMail(email.text, f, geo);
                  
                  // send the message and get a callback with an error or details of the message that was sent
                  var server  = emailjs.server.connect(config.smtp_server);
                  server.send(email, function(err, message) { 
                    if(err){ 
                      console.log(err); 
                    }else{
                      f.last_emailed_date = Date.now();
                      f.last_emailed_user = toField;

                      updateFeature = { 'attributes': f };

                      console.log('Notificación enviada a', f.last_emailed_user);

                      service.updateFeatures({
                        serviceUrl: feature_service,
                        features: [updateFeature]
                      }).then(function(response){
                        console.log('Updated = ', response);
                        
                      });
                    }
                  });              
                  
                }else{
                  console.log('Ya se envió la notificación a ' + f.last_emailed_user);  
                }
              }else{
                console.log('Expediente ' + f.OBJECTID + ': ' + f.last_edited_user + ' pertenece a ningún grupo tenga un trigger para el estado ' + f['Estado']);
              }
              
            });
          })(i);
        }
      });
    });

  }, null, true, 'Europe/Madrid');
} catch(ex) {
      console.log('Cron pattern not valid: ', ex);
}
