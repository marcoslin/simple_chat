# simple_chat

Sample code for node.js demonstration how to create a real-time chat over web.

## Prerequisites

* node.js
* socat unix command line tool

## Setup
After cloning this project from github, do:

```
cd simple_chat
npm install
```

## Running server

```
node server.js
```

## Connecting to server console
To connect to the server console, do:

```
socat - GOPEN:/var/tmp/simple_chat_repl_socket
```

Make sure you have client connected and do the following in the
console to see all connected clients.

```
clients.all
```
