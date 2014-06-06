/*jslint node: true */

/**
 * The sequence of instantiation is critical for socket.io
 * to correctly work with express.
*/
var fs = require("fs");
var express = require("express");
var socket_io = require("socket.io");
var chat_clients = require("./lib/chat_clients");
var repl = require("repl");
var net = require('net');

var http_port = 8082;
var app = express();

// Static Web Server
app.use(express.static(__dirname + '/www'));
var server = app.listen(http_port);
var io = socket_io.listen(server);
io.set("log level", 2);
console.log("Web server running at port " + http_port);


/*
Capture event from socket
*/
var clients = chat_clients();
// Upon connection
io.on('connection', function (socket){
	//console.log('got socket: %s', socket.id);
	
	// CUSTOM Login event.
	socket.on("login", function (in_username) {
		console.log('Setting client name to %s', in_username);
		clients.add(in_username.match(/\S+/), socket);
		clients.send_event(socket.id, "joining", clients.users(in_username));
	});

	// socket.send event
    socket.on('message', function(data) { 
        console.log('message arrived: %s', data);
        clients.send_message(socket.id, data);
    });

	// socket.emit("ping", message)
    socket.on('ping', function(data) { 
        //console.log('ping event: %s', data);
        try {
            socket.emit('pong', data);
        } catch(err) {
            console.log("# Error emitting 'pong': " + err);
        }

    });

	// client disconnect event
    socket.on('disconnect', function() {
    	var cur_user = clients.get_name(socket.id);
    	clients.remove(socket.id);
    	clients.send_event(socket.id, "exiting", clients.users(cur_user));
        console.log('connection closed');
    });
});


/**
 * Create a REPL exposing app and clients.  Connect to this socket using:
 *     socat - GOPEN:<<socket_file>>
 */
var socket_file = "/var/tmp/simple_chat_repl_socket";
if ( fs.existsSync(socket_file) ) {
    fs.unlinkSync(socket_file);
}
net.createServer(function (socket) {
    var r =repl.start({
        prompt: "simple_chat" + "> ",
        input: socket,
        output: socket
    });
    r.context.app = app;
    r.context.clients = clients;
    r.on('exit', function () {
        socket.end();
    });
}).listen(socket_file);



