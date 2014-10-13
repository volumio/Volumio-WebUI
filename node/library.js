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
 *  file:                    library.js
 *  version:                 1
 */
var fs = require('fs');
var q = require('q');
var Constants = require('./constants.js');

function readFile(dir, filename) {
    var deferred = q.defer();
    fs.readFile(dir + "/" + filename, {encoding: "utf8"}, function(err, data) {
        deferred.resolve({filename: filename, error: err, content: data});
    });
    return deferred.promise;
}

function loadFavorites() {
    var deferred = q.defer();
    var dir = Constants.WEBUI_PATH + "/favorites";

    fs.readdir(dir, function(err, files) {
        if (files && files.length > 0) {
            var promises = files.map(function(filename) {
                return readFile(dir, filename);
            });
            var json = [];
            q.allSettled(promises).then(function(results) {
                results.forEach(function(result) {
                    if (result.state === 'fulfilled') {
                        if (!result.value.error) {
                            json.push({name: result.value.filename.slice(0, -5), filters: eval('(' + result.value.content + ')')});
                        } else {
                            console.log(result.value.error);
                        }
                    } else {
                        console.log(result.reason);
                    }
                });
                deferred.resolve(json);
            });
        }
    });

    return deferred.promise;
}

function saveFavorite(name, json) {
    var deferred = q.defer();
    var dir = Constants.WEBUI_PATH + "/favorites";

    fs.mkdir(dir, function() {
        fs.writeFile(dir + "/" + name + ".json", JSON.stringify(json) + "\n", function(err) {
            if (err) {
                deferred.reject(new Error(err.code));
            } else {
                deferred.resolve();
            }
        });
    });

    return deferred.promise;
}

function deleteFavorite(name) {
    var deferred = q.defer();
    var path = Constants.WEBUI_PATH + "/favorites/" + name + ".json";

    fs.unlink(path, function(err) {
        if (err) {
            deferred.reject(new Error(err.code));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

module.exports.loadFavorites = loadFavorites;
module.exports.saveFavorite = saveFavorite;
module.exports.deleteFavorite = deleteFavorite;
