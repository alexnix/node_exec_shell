var express = require('express');
var app =  express();

var util  = require('util');
var spwan = require('child_process').spawn;

app.get('/:a/:b', function(req, res){

	var script = spwan('./script.sh', [req.params.a, req.params.b]);
	script.stdout.on('data', function (data) {    
	  res.send("Result: " + data);
	});

});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

