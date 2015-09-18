var flag = false;
var PROVIDER, USSD_MTN = "ussd_mtn", USSD_TG = "ussd_tg", USSD_AIR = "ussd_air";

if( process.argv[2] == "mtn" ){
	flag = true;
	PROVIDER = USSD_MTN;
}

if( process.argv[2] == "tg" ){
	flag = true;
	PROVIDER = USSD_TG;
}

if( process.argv[2] == "air" ){
	flag = true;
	PROVIDER = USSD_AIR;
}

if(!flag) {
	console.log("You have not set the provider (mtn, tg or air)\nExiting...");
	process.exit();
}

/////////////////
// HTTP Server //
/////////////////

var express = require('express');
var app =  express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));

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


/*
* The following code implements a Hole Punching Tehnique.
* It is basicly a client connectinh to a public server that manages traffic forewarding.
*/

var net = require('net');
var exec = require('child_process').exec;
var client = new net.Socket();

var HP_HOST = "52.21.130.230", HP_PORT = 12321;
var ORIGIN_SERVER_CONNECTION = "this_is_ussd_server_connecting", ORIGIN_SERVER_RESPONSE = "this_is_ussd_server_respons";


var Datastore = require('nedb')
	, db = new Datastore({filename:__dirname + '/database.db', autoload: true});

// Queue Processing
var queue = [], shellInProgress = false;
setInterval(function(){
	io.emit('counter', queue.length);
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


// Connects to Hole Punching Server
client.connect(HP_PORT, HP_HOST, function(){
	var hp_server_handshake = {
		origin: ORIGIN_SERVER_CONNECTION,
		provider: PROVIDER,
	};
	client.write( JSON.stringify(hp_server_handshake) );
});

// Processes data from the Hole Punching Server
client.on('data', function(data){
	var json_data = JSON.parse(data);
	
	queue.push({
		data: json_data.phone + " " + json_data.amount,
		callback: function(code){
			var hp_server_response = {
				origin: ORIGIN_SERVER_RESPONSE,
				response: code,
				shortid: json_data.shortid,
			};
			client.write( JSON.stringify(hp_server_response) );
		},
	});

});