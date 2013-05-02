/**
 * The state of the chat form
 */

/*jslint browser: true */
/*global $, io */

// Set the status of the chat window
function ChatRoom() {
    'use strict';

    var self = this;

    this.username = "";
    this.disconnected = false;
    this.retrying = false;

    // Read the action from the button's name
    this.action = function () {
        return $("#btn_action").val();
    };

    this.input_message = function () {
        return $("#chat_message_input").val();
    };

    // Form initialization.  Set it to Login status
    this.login = function () {
        if (!self.disconnected) {
            $("#chat_title").text("Login:");
            $("#chat_log").text("Please enter a user name to login");
            $("#btn_action").val("Login");
            $("#chat_status").attr("class", "chat_status");
            $("#chat_online_users").text("");
            $("#chat_message_input").val('');
        }
    };

    // Connect
    this.connect = function (in_username) {
        $("#chat_title").text("User: " + self.username);
        $("#btn_action").val("Send");
        $("#chat_status").attr("class", "chat_status status_connected");
        // Clear the log only if not retrying
        if (!self.retrying) {
            $("#chat_log").text("");
        }
        $("#chat_message_input").val('');
        self.retrying = false;
    };

    // Retrying Connection
    this.reconnect = function (message) {
        if (!self.disconnected) {
            $("#chat_title").text(message);
            $("#btn_action").val("Wait");
            $("#chat_status").attr("class", "chat_status status_disconnected");
            self.retrying = true;
        }
    };

    // Disconnect
    this.disconnect = function () {
        $("#chat_title").text("Server Disconnected.");
        $("#chat_log").text("Please refresh the browser and connect again.");
        $("#btn_action").val("Close");
        $("#chat_status").attr("class", "chat_status status_disconnected");
        $("#chat_online_users").text("");
        self.disconnected = true;
    };

    // Adding message to chat_log
    this.add_message = function (message, class_name) {
        var m = $("<div class='" + class_name + "' />");
        m.text(message);
        $("#chat_log").append(m);
        $("#chat_message_input").val('');
    };

    // Refresh the #chat_online_users with list of connected users
    this.update_users_list = function (users) {
        var i, m, length, cur_user, class_name;
        $("#chat_online_users").text("");
        for (i = 0, length = users.length; i < length; i += 1) {
            cur_user = users[i];
            class_name = "";
            if (cur_user === this.username) {
                class_name = "message_self";
            } else {
                class_name = "message_other";
            }
            m = $("<div class='" + class_name + "' />");
            m.text(users[i]);
            $("#chat_online_users").append(m);
        }
    };
}

function ChatServer(in_username) {
    'use strict';

    var socket, chatroom, MAX_RECONNECT_RETRY = 6;

    // Initialization code
    chatroom.username = in_username;
    socket = io.connect(document.location, {'max reconnection attempts': MAX_RECONNECT_RETRY, 'connect timeout': 2000 });

    // Exposed methods
    this.emit = function (event, data) {
        socket.emit(event, data);
    };

    // Listen to socket events
    socket.on('connect', function (data) {
        // See Issue652
        // Note: connect event get fired upon connect and also upon reconnect.
        if (chatroom.disconnected) {
            socket.disconnect();
        } else {
            socket.emit('login', chatroom.username);
            chatroom.connect();
        }
    });

    socket.on('joining', function (users_string) {
        var users = users_string.split(":"), cur_user = users.shift();
        if (cur_user !== chatroom.username) {
            chatroom.add_message('- ' + cur_user + ' joined.', "message_system");
        }
        chatroom.update_users_list(users);
    });

    socket.on('exiting', function (users_string) {
        var users = users_string.split(":"), cur_user = users.shift();
        if (cur_user !== chatroom.username) {
            chatroom.add_message('- ' + cur_user + ' left.', "message_system");
        }
        chatroom.update_users_list(users);
    });

    socket.on('message', function (data) {
        chatroom.add_message(data, "message_other");
    });

    socket.on('reconnect', function (data) {
        // Set the connection's username
        chatroom.reconnect();
    });

    socket.on('reconnecting', function (reconnectionDelay, reconnectionAttempts) {
        var secs = reconnectionDelay / 1000;

        if (reconnectionAttempts >= MAX_RECONNECT_RETRY) {
            socket.disconnect();
            chatroom.disconnect();
        } else {
            chatroom.reconnect("Reconnecting in " + secs + " seconds...");
        }
    });

    socket.on('error', function (reason) {
        if (reason === "") {
            chatroom.add_message('# Socket Error.  Make sure server is running.', "message_system");
        } else {
            chatroom.add_message('# Socket Error: ' + reason, "message_system");
        }
        socket.disconnect();
    });

    socket.on('connect_failed', function (reason) {
        if (reason === "") {
            chatroom.add_message('# Connection Failed.  Make sure server is running.', "message_system");
        } else {
            chatroom.add_message('# Connection Failed: ' + reason, "message_system");
        }
    });



/*
NOTE:
    * Issue652
    There is a bug in socket.io where reconnect essentially continues after max retry.
    As result, when the form is set to disconnected after max retry, it will again
    get set to reconnect if the server comes backup.  A disconnected flag is introduced
    to deal with this problem, so that the form stays as disconnected.  This flag is
    also used to once for all kill the socket when it comes back from the death.

    * Issue375
    It does not seem to be consistant the behaiviour of the connect_failed.  The error
    event doesn't really help as it does not provide a proper reason.  This lead to an
    interesting problem where if the server goes down before login, you will get an
    error event and not further error.

REF:
    Issue652: https://github.com/LearnBoost/socket.io/issues/652
    Issue375: https://github.com/LearnBoost/socket.io-client/issues/375

*/

}

var chatserver, chatroom = new ChatRoom();

// Action to perform when use click on a button
function run_action() {
    'use strict';
    var user_entered, data = chatroom.input_message(), action = chatroom.action();
    if (action === "Login") {
        // Set the username when login is pressed
        user_entered = data.match(/\S+/);
        if (user_entered === undefined || user_entered[0] === undefined) {
            chatroom.add_message("Error: User name cannot be blank.", "message_system");
        } else {
            chatserver = new ChatServer(user_entered[0]);
        }
    } else if (action === "Send") {
        chatserver.emit('message', data);
        chatroom.add_message(data, "message_self");
    } else if (action === "Close") {
        location.reload();
    } else if (action === "Wait") {
        window.alert("Please wait for server to reconnect.");
    }
}

// Setup the elements
$(document).ready(function () {
    'use strict';
    $("#chat_message_input").keypress(function (event) {
        if (event.which === '13') {
            run_action();
            event.preventDefault();
        }
    });

    $("#chat_window_handle").draggable({ handle: "#chat_window_title_handle" });
});
