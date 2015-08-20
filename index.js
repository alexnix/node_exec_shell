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

		// Execute a shell script that uses these arguments
		var script = spwan('./script.sh', [args[0], args[1]]);
		// When the script outputs the result I get 
		script.stdout.on('data', function (data) {
			// Result is written back to the python script    
			socket.write(data.toString('ascii'));
			socket.destroy();

			// Result is also stored in a databse
			db.insert({'First argument': args[0], 'Second argument': args[1], 'Result': data.toString('ascii')});

		});

	});

}).listen(9000, "localhost");