/**
 * Created by Raul.Jimenez on 18/05/2016.
 */
'use strict';

var emailjs = require('./node_modules/emailjs/email');

module.exports = function Utils(config){
  var that = this;
  this.config = config;
  this.emailsInProgress = [];

  // Gets an ID and returns a human-readable-string
  this.getGroupName= function(str){
    if(config.organization.groups.hasOwnProperty(str)){
      return config.organization.groups[str];
    }else{
      return null;
    }
  };

  // Replace ${attribute_name} for its value in object f
  this.parseMail = function(email, f, geo, extent){
    var tmp = email;
    for(var property in f){
      if (f.hasOwnProperty(property)) {
        do{
          tmp = tmp.replace('${'+property+'}', f[property]);
        }while(tmp.indexOf('${'+property+'}') !== -1);
      }
    }
    for(var extents in extent){
      if(extent.hasOwnProperty(extents)){
        do{
          tmp = tmp.replace('${'+extents+'}', extent[extents]);
        }while(tmp.indexOf('${'+extents+'}') !== -1);
      }
      if(extents == "spatialReference"){
        var wkid = String(extent[extents]['wkid']);
        tmp = tmp.replace('${wkid}', wkid);
      }
    }
    tmp = tmp.replace('#{X}', geo['x']);
    tmp = tmp.replace('#{Y}', geo['y']);

    return tmp;
  };

  // Extract email from a string
  this.extractEmails = function(text){
    return text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi).join(',');
  };

  this.processFeature = function (obj){

    var userGroup, last_user_group_name, email, n, updateFeature, f, geo, extent;

    f = objToCase(obj.res.features[obj.i].attributes, 'upper');

    geo = obj.res.features[obj.i].geometry;
    extent = obj.extents.extent;
    userGroup = config.flow;
    // Get user info
    obj.service.getUserInfo({
      username: f.LAST_EDITED_USER
    }).then(function(res){
      var hasTrigger = false;
      for(var g in res.groups){
        last_user_group_name = that.getGroupName(res.groups[g].id);

        // Is a group with triggers
        if(last_user_group_name){
          if(userGroup[last_user_group_name].hasOwnProperty(f['ESTADO'])){
            console.log('\nInfo: '.yellow + 'Entity ' + f.OBJECTID + ': ' + f.LAST_EDITED_USER + ' belongs '.green +'to group ' + last_user_group_name + ' which has a trigger for the state ' + f['ESTADO']);
            hasTrigger = true;
            break;
          }
        }
      }

      // If user belongs to a group which has a trigger for current state
      if(hasTrigger){
        var toField = that.extractEmails(userGroup[last_user_group_name][f['ESTADO']].to);

        //TODO: toFiled is not an email is the name of an attributes which should contain an username of this organization
        //if (toField.indexOf('@') === -1){
        //  toField = getOwnerEmail('owner');
        //}

        if(toField !== f.LAST_EMAILED_USER && that.emailsInProgress.indexOf(f.OBJECTID) === -1){

          // Avoid send emails twice because of the async. calls
          that.emailsInProgress.push(f.OBJECTID);
          console.log("Block: ",f.OBJECTID)
          console.log("Blocked: ",that.emailsInProgress)

          email = userGroup[last_user_group_name][f['ESTADO']];
          email.attachment = [{ data: that.parseMail(email.text, f, geo, extent), alternative: true}];

          // send the message and get a callback with an error or details of the message that was sent
          var server  = emailjs.server.connect(obj.config.smtp_server);

          server.send(email, function(err, message) {

            if(err){
              console.log("\nError:".red, err);
            }else{
              f.LAST_EMAILED_DATE = Date.now();
              f.LAST_EMAILED_USER = toField;

              updateFeature = { 'attributes': f };

              console.log('\nEmail sent to:'.green, f.LAST_EMAILED_USER);

              obj.service.updateFeatures({
                serviceUrl: obj.feature_service,
                features: [updateFeature]
              }).then(function(response){
                if(response.error){
                  console.log('\nFeature not updated:'.red, response.error.message);
                }else if(response.updateResults[0].success){
                  console.log('\nUpdated:'.green, "true");
                }else{
                  console.log('\nFeature not updated:'.red, JSON.stringify(response, null, 2));
                }
              });
            } // endif
            var pos = that.emailsInProgress.indexOf(f.OBJECTID);
            if(pos !== -1){
              try{
                (setTimeout(function(pos){
                  that.emailsInProgress.splice(pos, 1);
                  console.log("Unblock: ",f.OBJECTID)
                  console.log("Blocked: ",that.emailsInProgress)
                }, 10000))(pos);
              }catch(e){
                console.log("Error:".red, e);
              }


            }

          });
        }else{
          console.log('\nInfo:'.yellow + ' The notification was already sent to: ' + f.LAST_EMAILED_USER);
        }
      }else{
        console.log('\nInfo: '.yellow + 'Entity ' + f.OBJECTID + ': ' + f.LAST_EDITED_USER + ' does not belongs '.red + 'to a group with the state: ' + f['ESTADO']);
      }

    });
  };
}

function objToCase(obj, type){
  var key, keys = Object.keys(obj);
  var n = keys.length;
  var newobj={}
  while (n--) {
    key = keys[n];
    if(type === 'lower'){
      newobj[key.toLowerCase()] = obj[key];
    }else if (type === 'upper') {
      newobj[key.toUpperCase()] = obj[key];
    }
  }

  return newobj;
}
