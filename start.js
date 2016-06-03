const exec = require('child_process').exec,
      colors = require('colors');

var configs = [
    "config/_config_bolardos",
    "config/_config_senal_codigo",
    "config/_config_senal_pintura_lineal"
], child;
//console.log("config=",config)
configs.forEach(function(elem, index, array){
  console.log('Running'.green, 'node index.js ' + elem);
  child = exec('node index.js ' + elem);
  child.stdout.on('data', function(data) {
      console.log(elem + ': ' + data);
  });
  child.stderr.on('data', function(data) {
      console.log(elem + ': ' + data);
  });
  child.on('close', function(code) {
      console.log('closing code: ' + code);
  });


});
