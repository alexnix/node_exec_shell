var express = require('express');
var app =  express();

// HTTP Server

app.get('/', function(req, res){

});

var HTTPserver = app.listen(3000, function () {
  console.log('Example app running.');
});



// TCP Server

var net = require('net');
var util  = require('util');
var spwan = require('child_process').spawn;
var exec = require('child_process').exec;

// Creates a basic datastore
var Datastore = require('nedb')
	, db = new Datastore({filename:'database.db', autoload: true})

// Creates a TCP server that will accept Socket connections from the 
// Python script
net.createServer(function(socket){ 
	
	// Function to execute when python sends data over the socket
	socket.on('data', function(data){
		
		// Arguments are sent as a single string so I have to process it
		var args = data.toString('ascii').split(' ');

		// exec("./script.sh " + data.toString('ascii'), function(err, stdout, stderr){
		// 	socket.write(stdout);
		// 	socket.destroy();
		// });

		var child = exec("./script.sh " + data.toString('ascii'));
		child.on('close', function(code) {
		    socket.write(code+'');
		    socket.destroy();
		});

	});

}).listen(9000, "localhost");