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

app.post('/api/manualUSSD/:f/:s', function(req, res){

	queue.push({data: req.params.f+' '+req.params.s, callback: function(code){
		res.status(200).send();
	}})
	
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});




// TCP Server

var net = require('net');
var util  = require('util');
var spwan = require('child_process').spawn;
var exec = require('child_process').exec;

var queue = [], shellInProgress = false;
// Checks the queue every 100ms, if it has elements and if another shell si not
// in execution, get the first element in the queue and process it.
setInterval(function(){
	if(queue.length && !shellInProgress){
		shellInProgress = true;
		
		var connection = queue.shift();
		var args = connection.data.split(' ');
		
		var child = exec("./script.sh " + connection.data);
		child.on('close', function(code) {
			connection.callback(code);
		    
		    var transaction = {
		    	'First_Argument': args[0],
		    	'Second_Argument': parseFloat(args[1]),
		    	'Date': new Date().getTime(),
		    	'Status': code + '',
		    };

		    io.emit('transaction', transaction);
		    db.insert(transaction);
		    shellInProgress = false;
		});

	}
}, 100);

// Creates a basic datastore
var Datastore = require('nedb')
	, db = new Datastore({filename:'database.db', autoload: true})

// Creates a TCP server that will accept Socket connections from the 
// Python script
net.createServer(function(socket){ 
	
	// When the socket has data it is added in the queue
	socket.on('data', function(data){
		
		queue.push({data: data.toString('ascii'), callback: function(code){
			socket.write(code+'');
		    socket.destroy();
		}});

	});

}).listen(9000, "localhost");