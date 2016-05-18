/**
 * Created by Raul.Jimenez on 18/05/2016.
 */
'use strict';

var emailjs = require('./node_modules/emailjs/email');

module.exports = function Utils(config){
  var that = this;
  this.config = config;
  
  // Gets an ID and returns a human-readable-string
  this.getGroupName= function(str){
    if(config.organization.groups.hasOwnProperty(str)){
      return config.organization.groups[str];
    }else{
      return null;
    }
  };
  
  // Replace ${attribute_name} for its value in object f
  this.parseMail = function(email, f, geo){
    var tmp = email;
    for(var property in f){
      if (f.hasOwnProperty(property)) { tmp = tmp.replace('${'+property+'}', f[property]); }
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

    var userGroup, last_user_group_name, email, n, updateFeature;

    var f = obj.res.features[obj.i].attributes;
    var geo = obj.res.features[obj.i].geometry;
    userGroup = config.flow;

    // Get user info
    obj.service.getUserInfo({
      username: f.last_edited_user
    }).then(function(res){
      var hasTrigger = false;
      
      for(var g in res.groups){
        last_user_group_name = that.getGroupName(res.groups[g].id);
        
        // Is a group with triggers
        if(last_user_group_name){

          if(userGroup[last_user_group_name].hasOwnProperty(f['Estado'])){
            console.log('\nInfo: '.yellow + 'Entity ' + f.OBJECTID + ': ' + f.last_edited_user + ' belongs '.green +'to group ' + last_user_group_name + ' which has a trigger for the state ' + f['Estado']);
            hasTrigger = true;
            break;
          }
        }
      }
          
      // If user belongs to a group which has a trigger for current state
      if(hasTrigger){
        var toField = that.extractEmails(userGroup[last_user_group_name][f['Estado']].to);
            
        //TODO: toFiled is not an email is the name of an attributes which should contain an username of this organization
        //if (toField.indexOf('@') === -1){
        //  toField = getOwnerEmail('owner');
        //}
            
        if(toField !== f.last_emailed_user){

          email = userGroup[last_user_group_name][f['Estado']];
          email.attachment = [{ data: that.parseMail(email.text, f, geo), alternative: true}];
          
          // send the message and get a callback with an error or details of the message that was sent
          var server  = emailjs.server.connect(obj.config.smtp_server);
          
          server.send(email, function(err, message) { 
            
            if(err){ 
              console.log("\nError:".red, err); 
            }else{
              f.last_emailed_date = Date.now();
              f.last_emailed_user = toField;

              updateFeature = { 'attributes': f };

              console.log('\nEmail sent to:'.green, f.last_emailed_user);

              obj.service.updateFeatures({
                serviceUrl: obj.feature_service,
                features: [updateFeature]
              }).then(function(response){
                if(response.updateResults[0].success){
                  console.log('\nUpdated:'.green, "true");
                }else{
                  console.log('\nFeature not updated:'.red, JSON.stringify(response, null, 2));
                }
              });
            } // endif

          });              
        }else{
          console.log('\nInfo:'.yellow + ' The notification was already sent to: ' + f.last_emailed_user);  
        }
      }else{
        console.log('\nInfo: '.yellow + 'Entity ' + f.OBJECTID + ': ' + f.last_edited_user + ' does not belongs '.red + 'to a group with the state: ' + f['Estado']);
      }
      
    });
  }; 
}