/**
 * Class used to manage clients connection to the web server
 */

/*jslint node: true */

module.exports = function () {
    'use strict';

    var Clients = function () {
        /*
         Clients stores sockets based on socket.id.  It creates an internal
         associative array with socket.id as key and [name, socket] as value.
         */
        var self = this;

        this.all = {};
        this.client_count = 0;
        // Added a new client
        this.add = function (name, socket) {
            var id = socket.id;
            this.all[id] = [name, socket];
            this.client_count += 1;
            console.log("Added new client ", name, " [count:", this.client_count, "]");
        };

        // Remove the client with socket id passed
        this.remove = function (id) {
            var name = this.get_name(id);
            if (name === undefined) {
                // NOTE: This happens as socket.io reconnect logic continue even after max retry.
                console.log("No client removed as id ", id, " not found. [count:", this.client_count, "]");
            } else {
                delete this.all[id];
                this.client_count -= 1;
                console.log("Removed client ", name, " [count:", this.client_count, "]");
            }
        };

        // Return the name of the given socket id
        this.get_name = function (id) {
            if (self.all[id] !== undefined) {
                return self.all[id][0];
            }
        };

        // Return the socket given the id
        this.get_socket = function (id) {
            return self.all[id][1];
        };

        // Send message to all client, special formatting for sender
        this.send_message = function (sender_id, message) {
            var id, target, sender_name = self.get_name(sender_id);
            for (id in self.all) {
                if (self.all.hasOwnProperty(id)) {
                    console.log("Sending to client id %s", id);
                    if (sender_id !== id) {
                        target = self.get_socket(id);
                        target.send(sender_name + ": " + message);
                    }
                }
            }
        };

        // Broadcast event to all clients
        this.send_event = function (sender_id, event, message) {
            var id, target;
            for (id in self.all) {
                if (self.all.hasOwnProperty(id)) {
                    console.log("Sending event %s to client id %s", event, id);
                    target = self.get_socket(id);
                    target.emit(event, message);
                }
            }
        };

        /*
         Get a list of the username, with the caller_name id as the first item.
         caller_name

         caller_name is entered twice intentionally.  User is expected to shift
         the first item out to serve as caller's name and pass the rest of array
         as users in the room.
         */
        this.users = function (caller_name) {
            var id, users_string, u = [];
            for (id in self.all) {
                if (self.all.hasOwnProperty(id)) {
                    u.push(self.get_name(id));
                }
            }
            u.sort();
            u.unshift(caller_name);
            users_string = u.join(":");
            console.log("users: ", users_string);
            return users_string;
        };

    };

    return new Clients();
}

