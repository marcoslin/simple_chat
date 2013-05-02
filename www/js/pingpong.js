/**
 * Simple Script to send message back and forward to server
 *
 * Known Issues: After ping stopped, starting again will cause server to crash.
 */

/*jslint browser: true */
/*global $, io */

function add_message(message) {
    'use strict';
    var m = $("<div/>");
    m.text(message);
    $('body').append(m);
}


function ChatServer() {
    'use strict';
    var socket, counter = 0;
    socket = io.connect("127.0.0.1:" + document.location.port);

    // Exposed methods
    this.emit = function (event, data) {
        socket.emit(event, data);
    };

    // Listen to socket events
    socket.on('connect', function (data) {
        var username = "ping_client";
        socket.emit("login", username);
        add_message(username + " connected.");
    });

    socket.on('message', function (data) {
        add_message(data);
    });

    socket.on('pong', function (data) {
        if (counter % 1000 === 0) {
            add_message("pong: " + data);
        }
        counter += 1;
        // Stop after 10k ping
        if (counter <= 10001) {
            socket.emit('ping', "Pinging count " + counter);
        } else {
            counter = 0;
            socket.disconnect();
            add_message("=== Pong ended.");
        }
    });

    socket.on('error', function (reason) {
        add_message('# Socket Error: ' + reason);
    });

    socket.on('connect_failed', function (reason) {
        add_message('# Connection Failed: ' + reason);
    });

}

function run_start() {
    'use strict';
    add_message("Connecting to the server...");
    var chatserver = new ChatServer();
    add_message("=== Starting ping...");
    chatserver.emit("ping", "Ping is alive!!!");
}
