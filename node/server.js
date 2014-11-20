/*
 *  This Program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3, or (at your option)
 *  any later version.
 *
 *  This Program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  See <http://www.gnu.org/licenses/>
 *
 *  Authors:
 *  - v1:                    Joel Takvorian
 * 
 *  file:                    server.js
 *  version:                 1
 */

var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var q = require('q');
var mipod = require('mipod');
var library = require('./library.js');
var Constants = require('./constants.js');

"use strict";
var app = express();
var httpServer = http.createServer(app);
var websock = socketio.listen(httpServer);

websock.on('connection', function(socket){
    mipod.asWebSocket(socket, {
        dataPath: Constants.WEBUI_PATH
    });

    // Other handlers
    socket.on("lib-getfavs", function() {
        library.loadFavorites().then(function(answer) {
            socket.emit("lib-getfavs", {success: answer});
        }).fail(function(reason) {
            console.log("Application error: " + reason.message);
            socket.emit("lib-getfavs", {failure: String(reason)});
        }).done();
    });
    socket.on("lib-savefav", function(body) {
        library.saveFavorite(body.name, body.json).then(function() {
            socket.emit("lib-savefav", {success: "OK", name: body.name});
        }).fail(function(reason) {
            console.log("Application error: " + reason.message);
            socket.emit("lib-savefav", {failure: String(reason)});
        }).done();
    });
    socket.on("lib-delfav", function(body) {
        library.deleteFavorite(body.name).then(function() {
            socket.emit("lib-delfav", {success: "OK", name: body.name});
        }).fail(function(reason) {
            console.log("Application error: " + reason.message);
            socket.emit("lib-delfav", {failure: String(reason)});
        }).done();
    });
});

httpServer.listen(8081, function(){
    console.log('Websocket listening on port 8081');
});
