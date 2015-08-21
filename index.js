// HTTP Server

var express = require('express');
var app =  express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/api/transactions', function(req, res){
	db.find({}, function(err, doc){
		res.status(200).send(doc);
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
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

		    var transaction = {
		    	'First_Argument': args[0],
		    	'Second_Argument': args[1],
		    	'Date': new Date().getTime(),
		    	'Status': code + '',
		    };

		    io.emit('transaction', transaction);
		    db.insert(transaction);

		});

	});

}).listen(9000, "localhost");