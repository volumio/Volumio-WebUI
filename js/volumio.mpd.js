/*
 *      PlayerUI Copyright (C) 2014 Volumio
 *      http://www.volumio.org
 *
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
 *  You should have received a copy of the GNU General Public License
 *  along with TsunAMP; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 *  Authors:
 *  - v1: Joel Takvorian
 * 
 *  file:                    volumio.mpd.js
 *  version:                 1
 */

var socket = io();

function logSockErr(body) {
    if (body.failure && console && typeof console.error === 'function') {
        console.error(body.failure);
    }
}

var tokenClbks = [];
var token = 0;
function tokenizedEmit(word, params, clbk) {
    tokenClbks[token] = clbk;
    params.token = token;
    socket.emit(word, params);
    token++;
    token %= 10;
}
function tokenizedListen(word) {
    socket.on(word, function(response) {
        tokenClbks[response.token](response.content);
        tokenClbks[response.token] = undefined;
    });
}

function mpdPlay(path) {
    if (path === undefined) {
        socket.emit("play");
    } else {
        socket.emit("play-entry", {entry: path});
    }
}
socket.on("play", logSockErr);
socket.on("play-entry", logSockErr);

function mpdPlayIdx(idx) {
    socket.emit("play-idx", {idx: idx});
}
socket.on("play-idx", logSockErr);

function mpdAdd(path) {
    socket.emit("add", {entry: path});
}
socket.on("add", logSockErr);

function mpdPause() {
    socket.emit("pause");
}
socket.on("pause", logSockErr);

function mpdStop() {
    socket.emit("stop");
}
socket.on("stop", logSockErr);

function mpdPrev() {
    socket.emit("prev");
}
socket.on("prev", logSockErr);

function mpdNext() {
    socket.emit("next");
}
socket.on("next", logSockErr);

function mpdSeek(songIdx, posInSong) {
    socket.emit("seek", {songIdx: +songIdx, posInSong: +posInSong});
}
socket.on("seek", logSockErr);

function mpdVolume(volume) {
    socket.emit("volume", {value: +volume});
}
socket.on("volume", logSockErr);

function mpdRepeat(enabled) {
    socket.emit("repeat", {enabled: enabled});
}
socket.on("repeat", logSockErr);

function mpdRandom(enabled) {
    socket.emit("random", {enabled: enabled});
}
socket.on("random", logSockErr);

function mpdSingle(enabled) {
    socket.emit("single", {enabled: enabled});
}
socket.on("single", logSockErr);

function mpdConsume(enabled) {
    socket.emit("consume", {enabled: enabled});
}
socket.on("consume", logSockErr);

function mpdRemoveFromQueue(songIdx) {
    socket.emit("rmqueue", {songIdx: +songIdx});
}
socket.on("rmqueue", logSockErr);

function mpdDeletePlaylist(name) {
    socket.emit("deletelist", {name: name});
}
socket.on("deletelist", logSockErr);

function mpdSavePlaylist(name) {
    socket.emit("savelist", {name: name});
}
socket.on("savelist", logSockErr);

function mpdPlayAll(allPaths) {
    socket.emit("playall", {entries: allPaths});
}
socket.on("playall", logSockErr);

function mpdAddAll(allPaths) {
    socket.emit("addall", {entries: allPaths});
}
socket.on("addall", logSockErr);

function mpdUpdate(path) {
    socket.emit("update", {path: path});
}
socket.on("update", logSockErr);

function mpdLsInfo(path, clbk) {
    tokenizedEmit("lsinfo", {path: path, leafDesc: ["file","directory","playlist","title","artist","album","time"]}, clbk);
}
tokenizedListen("lsinfo");

function mpdSearch(search, clbk) {
    tokenizedEmit("search", {mode: "file", search: search}, clbk);
}
tokenizedListen("search");

function mpdNotifyLoop(notifyClbk, currentClbk) {
    socket.on("notify", function(body) {
        logSockErr(body);
        notifyClbk(body.success);
        socket.emit("current");
    });
    socket.on("current", function(body) {
        logSockErr(body);
        if (body.success) {
            currentClbk(body.success);
        }
    });
    socket.emit("notify");
}
