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
 *  file:                    volumio.library.js
 *  version:                 1
 */

"use strict";
window.library = {
    socket: io(),
    isEnabled: false,
    shouldLoad: false,
    displayAsTab: false,
    lazyLoading: true,
    fullData: {},
    allGenres: [],
    allArtists: [],
    allAlbums: [],
    allSongs: [],
    filters: {
        raw: [],
        artists: [],
        genres: [],
        albums: [],
        advanced: []
    },
    searchTimeout: null,
    containerArtist: undefined,
    containerAlbums: undefined,
    containerSongs: undefined,
    viewSize: "",
    favorites: {}
};

function setLibOptions(isEnabled, displayAsTab, shouldLoad) {
    // The library will be enabled according to settings
    library.isEnabled = isEnabled;
    library.displayAsTab = displayAsTab;
    library.shouldLoad = library.isEnabled && shouldLoad;
}

function defaultStatus() {
    // Show current selected filters
    if (hasActiveFilters()) {
        var filters = [
            library.filters.genres.join(", "),
            library.filters.artists.join(", "),
            library.filters.albums.map(function(key) {
                return albumFromKey(key).album;
            }).join(", ")
        ].filter(function(str) {
            return str !== "";
        });
        return "Filters: " + filters.join(", ");
    } else {
        return "";
    }
}

function status(text) {
    $("#lib-status-text").html(text || defaultStatus());
}

var pageParams = {
    start: 0,
    count: 1000,
    treeDesc: ["genre", "albumArtist|artist", "album"],
    leafDesc: ["file","track","title"]
};
function loadLibraryIfNeeded(forceReload) {
    if (forceReload || (library.isEnabled && library.shouldLoad)) {
        // Load it once only
        library.shouldLoad = false;
        // Load MPD content
        decideViewLayout();
        $("#lib-refresh i").addClass("fa-spin");

        library.socket.emit("lib-push", {maxBatchSize: 500, treeDesc: ["genre", "albumArtist|artist", "album"], leafDesc: ["file","track","title"]});
        library.socket.emit(forceReload ? "lib-reload" : "lib-loadonce");
        $("#lib-content").show();
        pageParams.start = 0;
        library.socket.emit("lib-get", pageParams);
    }
}

function enableLibrary() {
    // Update DOM
    // Force display block, not just "show"
    if (library.displayAsTab) {
        $("#open-panel-lib").css("display", "block");
    } else {
        $("#open-panel-lib").hide();
    }
    $("#lib-refresh i").addClass("fa-spin");
    updatePanelsTabs();
}

function disableLibrary() {
    $("#open-panel-lib").hide();
    $("#db-plug-lib").hide();
    updatePanelsTabs();

    // Some memory can be released
    library.filters.genres.length = 0;
    library.filters.artists.length = 0;
    library.filters.albums.length = 0;
    library.fullData = {};
    library.allGenres.length = 0;
    library.allArtists.length = 0;
    library.allAlbums.length = 0;
    library.allSongs.length = 0;
}

// Update CSS of panels tabs according to what is displayed and what isn't
function updatePanelsTabs() {
    var visiblePanels = $("#menu-bottom li:visible");
    if (visiblePanels.length > 0) {
        var panelWidth = Math.round(100000 / visiblePanels.length) / 1000;
        $("#menu-bottom a").width(panelWidth + "%");
        $("#menu-bottom a:visible").filter(":odd").addClass("odd");
        $("#menu-bottom a:visible").filter(":even").removeClass("odd");
    }
}

function showLibraryView() {
    $(".tab-content div.active").removeClass("active");
    $(".tab-content #panel-lib").addClass("active");
    $("#menu-bottom li.active").removeClass("active");
    $("#menu-bottom #open-panel-lib").addClass("active");
}

function toggleLazyLoading() {
    library.lazyLoading = !library.lazyLoading;
    if (library.containerArtist) {
        library.containerArtist.destroy();
        library.containerArtist = undefined;
    }
    if (library.containerAlbums) {
        library.containerAlbums.destroy();
        library.containerAlbums = undefined;
    }
    if (library.containerSongs) {
        library.containerSongs.destroy();
        library.containerSongs = undefined;
    }
}

function randomString(size) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < size; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function genFakeData(data, nbFakes, songsPerArtist) {
    // Genre "fake"
    var fakeGenre = {};
    data["fake"] = fakeGenre;
    var nbArtists = Math.floor(nbFakes / songsPerArtist);
    for (var i = 0; i < nbFakes; i++) {
        var artist = "" + (i % nbArtists);
        if (!fakeGenre[artist]) {
            fakeGenre[artist] = {};
        }
        var album = randomString(10);
        var song = {
            file: randomString(10),
            display: randomString(10)
        };
        fakeGenre[artist][album] = [song];
    }
}

function onPageReceived(data) {
//    genFakeData(data, 30000, 10);
    mergeTree(data);
    filterLib();
    // Insert data in DOM
    renderGenres();
}

function mergeTree(tree) {
    for (var genre in tree) {
        if (!library.fullData[genre]) {
            library.fullData[genre] = tree[genre];
        } else {
            for (var artist in tree[genre].mpd) {
                if (!library.fullData[genre].mpd[artist]) {
                    library.fullData[genre].mpd[artist] = tree[genre].mpd[artist];
                } else {
                    for (var album in tree[genre].mpd[artist].mpd) {
                        if (!library.fullData[genre].mpd[artist].mpd[album]) {
                            library.fullData[genre].mpd[artist].mpd[album] = tree[genre].mpd[artist].mpd[album];
                        } else {
                            library.fullData[genre].mpd[artist].mpd[album].mpd = library.fullData[genre].mpd[artist].mpd[album].mpd.concat(tree[genre].mpd[artist].mpd[album].mpd);
                        }
                    }
                }
            }
        }
    }
}

function hasActiveFilters() {
    return library.filters.genres.length > 0
        || library.filters.artists.length > 0
        || library.filters.albums.length > 0;
}

function rawSearchMatch(str) {
    return (library.filters.raw.length === 0)
            || library.filters.raw.some(function(word) {
        return str.toLowerCase().indexOf(word) >= 0;
    });
}

function advancedFilterTextMatch(key, value) {
    for (var i in library.filters.advanced) {
        var filter = library.filters.advanced[i];
        if (filter.key === key) {
            if ((filter.op === "=" && filter.val !== value.toLowerCase())
                    || (filter.op === "!=" && filter.val === value.toLowerCase())
                    || (filter.op === "~" && value.toLowerCase().indexOf(filter.val) < 0)) {
                return false;
            }
        }
    }
    return true;
}

function advancedFilterNumericMatch(key, value) {
    for (var i in library.filters.advanced) {
        var filter = library.filters.advanced[i];
        if (filter.key === key && !isNaN(+filter.val)) {
            if ((filter.op === "=" && +filter.val != value)
                    || (filter.op === "!=" && +filter.val == value)
                    || (filter.op === "<" && +filter.val <= value)
                    || (filter.op === ">" && +filter.val >= value)
                    || (filter.op === "<=" && +filter.val < value)
                    || (filter.op === ">=" && +filter.val > value)) {
                return false;
            }
        }
    }
    return true;
}

function checkMergeAlbums(objAlbum, albumsMap) {
    if (albumsMap.hasOwnProperty(objAlbum.album)) {
        if (albumsMap[objAlbum.album].ptr.artist !== objAlbum.artist) {
            albumsMap[objAlbum.album].ptr.artist = "Several artists";
            objAlbum.artist = "Several artists";
        }
    } else {
        library.allAlbums.push(objAlbum);
        albumsMap[objAlbum.album] = {
            ptr: objAlbum
        };
    }
}

function filterLib() {
    library.allGenres = [];
    library.allArtists = [];
    library.allAlbums = [];
    library.allSongs = [];
    var albumsMap = {};
    var needReload = false;
    for (var genre in library.fullData) {
        if ((library.filters.genres.length == 0 || library.filters.genres.indexOf(genre) >= 0)
                && advancedFilterTextMatch("genre", genre)) {
            for (var artist in library.fullData[genre].mpd) {
                var advFilterArtist = advancedFilterTextMatch("artist", artist);
                var searchArtistMatch = advFilterArtist && rawSearchMatch(artist);
                var searchOneMatchUnderArtist = false;
                if ((library.filters.artists.length == 0 || library.filters.artists.indexOf(artist) >= 0)
                        && advFilterArtist) {
                    for (var album in library.fullData[genre].mpd[artist].mpd) {
                        var advFilterAlbum = advancedFilterTextMatch("album", album);
                        var searchAlbumMatch = advFilterAlbum && (searchArtistMatch || rawSearchMatch(album));
                        var searchOneMatchUnderAlbum = false;
                        var objAlbum = {"album": album, "artist": artist};
                        if ((library.filters.albums.length == 0 || library.filters.albums.indexOf(keyAlbum(objAlbum)) >= 0)
                                && advFilterAlbum) {
                            for (var i in library.fullData[genre].mpd[artist].mpd[album].mpd) {
                                var song = library.fullData[genre].mpd[artist].mpd[album].mpd[i];
                                song.album = album;
                                song.artist = artist;
                                if (song.display === undefined) {
                                    if (song.title) {
                                        song.display = song.track ? song.track + " - " + song.title : song.title;
                                    } else {
                                        song.display = song.file.substr(song.file.lastIndexOf("/") + 1);
                                    }
                                    delete song.title;
                                    delete song.track;
                                }
                                if ((searchAlbumMatch || rawSearchMatch(song.display))
                                        && advancedFilterTextMatch("song", song.display)
                                        && advancedFilterTextMatch("file", song.file)
                                        && advancedFilterNumericMatch("rate", song.tags && song.tags["rating"] ? +song.tags["rating"] : 0)) {
                                    library.allSongs.push(song);
                                    searchOneMatchUnderAlbum = true;
                                }
                            }
                        }
                        if (searchAlbumMatch || searchOneMatchUnderAlbum) {
                            checkMergeAlbums(objAlbum, albumsMap);
                            searchOneMatchUnderArtist = true;
                        }
                    }
                }
                if (searchArtistMatch || searchOneMatchUnderArtist) {
                    library.allArtists.push(artist);
                }
            }
        }
        library.allGenres.push(genre);
    }

    // Check filters validity
    var newFilters = checkFilters(library.filters.albums, library.allAlbums, function(o) { return keyAlbum(o); });
    if (newFilters.length != library.filters.albums.length) {
        needReload = true;
        library.filters.albums = newFilters;
    }
    newFilters = checkFilters(library.filters.artists, library.allArtists, function(o) { return o; });
    if (newFilters.length != library.filters.artists.length) {
        needReload = true;
        library.filters.artists = newFilters;
    }

    if (needReload) {
        filterLib();
    } else {
        // Sort lists
        library.allGenres.sort();
        library.allGenres = removeDuplicate(["All genres"].concat(library.allGenres),
                                            function(a, b) { return a === b; });
        library.allArtists.sort();
        library.allArtists = removeDuplicate(["All artists"].concat(library.allArtists),
                                            function(a, b) { return a === b; });
        library.allAlbums.sort(function(a, b) { return a.album.toLowerCase() > b.album.toLowerCase() ? 1 : -1; });
        library.allAlbums = removeDuplicate([{"album": "All albums", "artist": ""}].concat(library.allAlbums),
                                            function(a, b) { return a.album === b.album && a.artist === b.artist; });

        // Show rating only if there are active filters
        if (hasActiveFilters() || library.filters.raw.length > 0) {
            $("#lib-rating").show();
        } else {
            $("#lib-rating").hide();
        }
    }
}

// Assumes input array is sorted => method operates in o(n)
function removeDuplicate(arr, fequals) {
    // Initialize with first
    var nodup = [arr[0]];
    for (var i = 1; i < arr.length; i++) {
        if (!fequals(arr[i], nodup[nodup.length-1])) {
            nodup.push(arr[i]);
        }
    }
    return nodup;
}

function checkFilters(filters, collection, func) {
    // Check for invalid filters
    var newFilters = [];
    for (var filter in filters) {
        for (var obj in collection) {
            if (filters[filter] == func(collection[obj])) {
                newFilters.push(filters[filter]);
                break;
            }
        }
    }
    return newFilters;
}

function keyAlbum(objAlbum) {
    return objAlbum.album + "@" + objAlbum.artist;
}

function albumFromKey(key) {
    var idx = key.indexOf("@");
    return {
        album: key.slice(0, idx),
        artist: key.slice(idx+1)
    };
}

var renderGenres = function() {
    var output = '';
    for (var i = 0; i < library.allGenres.length; i++) {
        output += '<li class="clearfix"><div class="lib-entry'
               + (library.filters.genres.indexOf(library.allGenres[i]) >= 0 ? ' active' : '')
               + '">' + library.allGenres[i] + '</div></li>';
    }
    $('#genresList').html(output);
    renderArtists();
}

var getArtistHtml = function(from, to) {
    var html = "";
    for (var i = from; i <= to; i++) {
        html += '<li class="clearfix"><div class="lib-entry'
           + (library.filters.artists.indexOf(library.allArtists[i]) >= 0 ? ' active' : '')
           + '">' + library.allArtists[i] + '</div></li>';
    }
    return html;
}

var renderArtists = function() {
    if (library.lazyLoading) {
        if (library.containerArtist) {
            library.containerArtist.destroy();
        }
        library.containerArtist = new LazyLoader("#lib-artist", "#artistsList", 400, library.allArtists.length, 100, getArtistHtml);
    } else {
        $('#artistsList').html(getArtistHtml(0, library.allArtists.length-1));
    }
    renderAlbums();
}

var getAlbumHtml = function(from, to) {
    var html = "";
    for (var i = from; i <= to; i++) {
        html += '<li class="clearfix"><div class="lib-entry'
           + (library.filters.albums.indexOf(keyAlbum(library.allAlbums[i])) >= 0 ? ' active' : '')
           + '">' + (library.allAlbums[i].album ? library.allAlbums[i].album : "?") + (i > 0 ? ' <span> (' + library.allAlbums[i].artist + ')</span>' : '') + '</div></li>';
    }
    return html;
}

var renderAlbums = function() {
    if (library.lazyLoading) {
        if (library.containerAlbums) {
            library.containerAlbums.destroy();
        }
        library.containerAlbums = new LazyLoader("#lib-album", "#albumsList", 400, library.allAlbums.length, 100, getAlbumHtml);
    } else {
        $('#albumsList').html(getAlbumHtml(0, library.allAlbums.length-1));
    }
    renderSongs();
}

var getSongHtml = function(from, to) {
    var html = "";
    for (var i = from; i <= to; i++) {
        var rating = 0;
        if (library.allSongs[i].tags && library.allSongs[i].tags["rating"]) {
            rating = +(library.allSongs[i].tags["rating"]);
        }
        html += '<li id="lib-song-' + (i + 1) + '" class="clearfix" title="' + library.allSongs[i].file + '"><div class="lib-entry">' + library.allSongs[i].display
            + ' <span> (' + library.allSongs[i].artist + ', ' + library.allSongs[i].album
            + ')</span>';
        if (library.viewSize === "large") {
            html += '<span class="lib-rating">'
            + '<i class="lib-rating-i fa fa-ban" title="Unrate"></i>'
            + '<i class="lib-rating-i fa ' + (rating > 0 ? 'fa-star' : 'fa-star-o') + '" title="Rate 1 star"></i>'
            + '<i class="lib-rating-i fa ' + (rating > 1 ? 'fa-star' : 'fa-star-o') + '" title="Rate 2 stars"></i>'
            + '<i class="lib-rating-i fa ' + (rating > 2 ? 'fa-star' : 'fa-star-o') + '" title="Rate 3 stars"></i>'
            + '<i class="lib-rating-i fa ' + (rating > 3 ? 'fa-star' : 'fa-star-o') + '" title="Rate 4 stars"></i>'
            + '<i class="lib-rating-i fa ' + (rating > 4 ? 'fa-star' : 'fa-star-o') + '" title="Rate 5 stars"></i>'
            + '</span>';
        }
        html += '<div class="lib-play"><a title="Play" href="#" class="btn"><i class="fa fa-play"></i></a></div>'
            + '<div class="lib-add"><a title="Enqueue" href="#" class="btn"><i class="fa fa-plus"></i></a></div></div></li>';
    }
    return html;
}

var renderSongs = function() {
    if (library.lazyLoading) {
        if (library.containerSongs) {
            library.containerSongs.destroy();
        }
        library.containerSongs = new LazyLoader("#lib-file", "#songsList", 400, library.allSongs.length, 100, getSongHtml);
    } else {
        $('#songsList').html(getSongHtml(0, library.allSongs.length-1));
    }
    registerRateHandlers();
}

function registerRateHandlers() {
    // Rating events
    $('#songsList .lib-rating').on('click', '.lib-rating-i', function(e) {
        var pos = $('#songsList .lib-rating .lib-rating-i').index(this);
        var songId = Math.floor(pos/6);
        var rating = pos % 6;
        if (library.containerSongs) {
            songId += library.containerSongs.getOffset();
        }
        rate(songId, rating);
    });
    $('.lib-rating-i').mouseenter(function(e) {
        status(e.target.title);
        // fa-ban (unrate)
        var elt = this.parentNode.children[0];
        var filledStar = (elt !== this);
        for (var i = 0; i < 5; i++) {
            elt = elt.nextSibling;
            if (filledStar) {
                $(elt).removeClass("fa-star-o").addClass("fa-star");
            } else {
                $(elt).removeClass("fa-star").addClass("fa-star-o");
            }
            if (elt === this) {
                filledStar = false;
            }
        }
    });
    $('.lib-rating').mouseleave(function(e) {
        status();
        // display actual rating
        var songId = $('#songsList .lib-rating').index(this);
        if (library.containerSongs) {
            songId += library.containerSongs.getOffset();
        }
        var rating = 0;
        if (library.allSongs[songId].tags && library.allSongs[songId].tags["rating"]) {
            rating = +(library.allSongs[songId].tags["rating"]);
        }
        // fa-ban (unrate)
        var elt = this.children[0];
        for (var i = 0; i < 5; i++) {
            elt = elt.nextSibling;
            if (rating > i) {
                $(elt).removeClass("fa-star-o").addClass("fa-star");
            } else {
                $(elt).removeClass("fa-star").addClass("fa-star-o");
            }
        }
    });
}

function clickedLibItem(event, container, domElt, libItem, currentFilter, renderFunc) {
    if (libItem == undefined) {
        // All
        currentFilter.length = 0;
        $(container + " .lib-entry.active").removeClass("active");
    } else if (event.ctrlKey) {
        var currentIndex = currentFilter.indexOf(libItem);
        if (currentIndex >= 0) {
            currentFilter.splice(currentIndex, 1);
            $(domElt).removeClass("active");
        } else {
            currentFilter.push(libItem);
            $(domElt).addClass("active");
        }
    } else {
        currentFilter.length = 0;
        currentFilter.push(libItem);
        $(container + " .lib-entry.active").removeClass("active");
        $(domElt).addClass("active");
    }
    // Updated filters
    filterLib();
    // Render
    renderFunc();
    status();
}

function decideViewLayout() {
    var viewSize = ($(window).width() < 640) ? "small" : "large";
    if (viewSize !== library.viewSize) {
        library.viewSize = viewSize;
        if (viewSize === "large") {
            showLargeView();
        } else {
            showSmallView();
        }
    }
}

// Enable the full-sized view
function showLargeView() {
    library.viewSize = "large";
    $("#lib-toolbar span.rel").show();
    $("#lib-tabs").hide();
    $("#lib-genre").css({
        "position": "absolute",
        "overflow": "auto",
        "width": "25%",
        "height": "25%",
        "border-bottom": "3px solid #212D39",
        "border-right": "3px solid #212D39",
        "z-index": "12"
    }).removeClass("tab-pane");
    $("#lib-artist").css({
        "position": "absolute",
        "overflow": "auto",
        "top": "25%",
        "width": "25%",
        "height": "75%",
        "margin-top": "3px",
        "border-right": "3px solid #212D39",
        "z-index": "12"
    }).removeClass("tab-pane");
    $("#lib-album").css({
        "position": "absolute",
        "overflow": "auto",
        "left": "25%",
        "width": "25%",
        "height": "100%",
        "border-right": "3px solid #212D39",
        "z-index": "11"
    }).removeClass("tab-pane");
    $("#lib-file").css({
        "position": "absolute",
        "overflow": "auto",
        "left": "50%",
        "width": "50%",
        "height": "100%",
        "z-index": "10"
    }).removeClass("tab-pane");
}

// Enable the tabs-styled view
function showSmallView() {
    library.viewSize = "small";
    $("#lib-toolbar span.rel").hide();
    $("#lib-tabs").show();
    $("#lib-genre").css({
        "position": "relative",
        "top": "0px",
        "left": "0px",
        "width": "100%",
        "height": "auto",
        "border-bottom": "0px",
        "border-right": "0px"
    }).addClass("tab-pane");
    $("#lib-artist").css({
        "position": "relative",
        "top": "0px",
        "left": "0px",
        "width": "100%",
        "height": "auto",
        "border-bottom": "0px",
        "border-right": "0px"
    }).addClass("tab-pane");
    $("#lib-album").css({
        "position": "relative",
        "top": "0px",
        "left": "0px",
        "width": "100%",
        "height": "auto",
        "border-bottom": "0px",
        "border-right": "0px"
    }).addClass("tab-pane");
    $("#lib-file").css({
        "position": "relative",
        "top": "0px",
        "left": "0px",
        "width": "100%",
        "height": "auto",
        "border-bottom": "0px",
        "border-right": "0px"
    }).addClass("tab-pane");
}

function checkPattern(str) {
    // Check for pattern such as "{rate>3}"
    var matches = str.match(/(.*){(\w+)(<=|>=|!=|==|=|<|>|~)([^}]+)}(.*)/);
    if (matches) {
        library.filters.advanced.push({
            key: matches[2],
            op: (matches[3] === '==' ? '=' : matches[3]),
            val: matches[4]
        });
        var strBefore = matches[1];
        var strAfter = matches[5];
        if (strBefore) {
            if (!checkPattern(strBefore)) {
                library.filters.raw = library.filters.raw.concat(strBefore.split(" "))
                    .filter(function(str) { return str !== ""; });
            }
        }
        if (strAfter) {
            if (!checkPattern(strAfter)) {
                library.filters.raw = library.filters.raw.concat(strAfter.split(" "))
                    .filter(function(str) { return str !== ""; });
            }
        }
        return true;
    } else {
        return false;
    }
}

function onSearch(event) {
    if (library.searchTimeout !== null) {
        clearTimeout(library.searchTimeout);
    }
    library.searchTimeout = setTimeout(function() {
        library.searchTimeout = null;
        var searchStr = $("#lib-search").val().trim().toLowerCase();
        library.filters.raw = [];
        library.filters.advanced = [];
        var inQuote = false;
        searchStr.split('"').forEach(function(words) {
            if (inQuote) {
                library.filters.raw.push(words);
            } else {
                if (!checkPattern(words)) {
                    library.filters.raw = library.filters.raw.concat(words.split(" "))
                        .filter(function(str) { return str !== ""; });
                }
            }
            inQuote = !inQuote;
        });
        filterLib();
        renderGenres();
        status(library.allSongs.length + " songs filtered");
    }, 500);
}

function addFavoriteToList(favorite) {
    if (!library.favorites.hasOwnProperty(favorite.name)) {
        $("#lib-favorites ul").append("<li name='" + favorite.name + "'><a href='javascript:setActiveFavorite(\"" + favorite.name + "\")'><i class='fa fa-upload'></i> " + favorite.name + "</a><span class='btn trash' onclick='deleteFavorite(\"" + favorite.name + "\")'><i class='fa fa-trash'></i></span></li>");
    }
    library.favorites[favorite.name] = favorite.filters;
}

function setActiveFavorite(name) {
    if (library.favorites[name]) {
        $("#lib-favorites-name").val(name);
        // deep copy
        library.filters = $.extend(true, {}, library.favorites[name]);
        var search = library.filters.raw.join(" ") + library.filters.advanced.map(function(o) {
            return "{" + o.key + o.op + o.val + "}";
        }).join();
        $("#lib-search").val(search);
        filterLib();
        renderGenres();
    }
}

function deleteFavorite(name) {
    if (confirm("About to delete '" + name + "', are you sure?")) {
        library.socket.emit("lib-delfav", {name: name});
    }
}

function rate(songId, rating) {
    var song = library.allSongs[songId];
    var targets = [{targetType: "song", target: song.file}];
    if (rating === 0) {
        library.socket.emit("deltag", {tagName: "rating", targets: targets});
    } else {
        library.socket.emit("tag", {tagName: "rating", tagValue: String(rating), targets: targets});
    }
    if (!song.tags) {
        song.tags = {};
    }
    song.tags["rating"] = String(rating);
}

// Register websocket listeners
library.socket.on("lib-getfavs", function(body) {
    if (body.failure) {
        logSockErr(body);
    } else {
        library.favorites = {};
        body.success.forEach(function(favorite) {
            addFavoriteToList(favorite);
        });
    }
});

library.socket.on("lib-delfav", function(body) {
    if (body.failure) {
        logSockErr(body);
        notify('custom', body.failure, 'Could not delete favorite');
    } else {
        notify('custom', '', "'" + body.name + "' has been deleted");
        $("#lib-favorites li[name=" + body.name + "]").remove();
    }
});

library.socket.on("lib-savefav", function(body) {
    if (body.failure) {
        logSockErr(body);
        notify('custom', body.failure, 'Could not save favorites');
    } else {
        notify('custom', '', 'Current filters saved as a favorite');
        addFavoriteToList({
            name: body.name,
            // deep copy
            filters: $.extend(true, {}, library.filters)
        });
    }
});

library.socket.on("tag", function(body) {
    if (body.failure) {
        logSockErr(body);
        notify('custom', body.failure, 'Could not rate items');
    }
});

library.socket.on("deltag", function(body) {
    if (body.failure) {
        logSockErr(body);
        notify('custom', body.failure, 'Could not unrate items');
    }
});

library.socket.on("lib-reload", logSockErr);
library.socket.on("lib-loadonce", logSockErr);
library.socket.on("lib-finished-loading", function(body) {
    console.log("Received lib-finished-loading");
    $("#lib-refresh i").removeClass("fa-spin");
    $("#lib-content").show();
    status("Finished to scan " + body.nbItems + " items");
});

library.socket.on("lib-push", function(body) {
    console.log("Received lib-push");
    onPageReceived(body.data);
    status("Scanned " + body.progress + " items");
});

// On ready, register callbacks
jQuery(document).ready(function($) {

    // Tabs initialization
    if (library.isEnabled) {
        enableLibrary();
    } else {
        disableLibrary();
    }

    $("#lib-search-help-dlg").dialog({
        width: 700,
        height: 500,
        autoOpen: false,
        buttons: [{
            text: "Ok",
            click: function() { $( this ).dialog("close"); }
        }]
    });

    //click on SEARCH HELP
    $('#lib-search-help').click(function(e) {
        $("#lib-search-help-dlg").dialog("open");
    });

    //click on GENRE
    $('#genresList').on('click', '.lib-entry', function(e) {
        var pos = $('#genresList .lib-entry').index(this);
        clickedLibItem(e, '#genresList', this, pos == 0 ? undefined : library.allGenres[pos], library.filters.genres, renderArtists);
    });

    //click on ARTIST
    $('#artistsList').on('click', '.lib-entry', function(e) {
        var pos = $('#artistsList .lib-entry').index(this);
        if (library.containerArtist) {
            pos += library.containerArtist.getOffset();
        }
        clickedLibItem(e, '#artistsList', this, pos == 0 ? undefined : library.allArtists[pos], library.filters.artists, renderAlbums);
    });

    //click on ALBUM
    $('#albumsList').on('click', '.lib-entry', function(e) {
        var pos = $('#albumsList .lib-entry').index(this);
        if (library.containerAlbums) {
            pos += library.containerAlbums.getOffset();
        }
        clickedLibItem(e, '#albumsList', this, pos == 0 ? undefined : keyAlbum(library.allAlbums[pos]), library.filters.albums, renderSongs);
    });

    //click on PLAY
    $('#songsList').on('click', '.lib-play', function(e) {
        var pos = $('#songsList .lib-play').index(this);
        if (library.containerSongs) {
            pos += library.containerSongs.getOffset();
        }
        mpdPlay(library.allSongs[pos].file);
        notify('addreplaceplay', library.allSongs[pos].display);
    });

    //click on ENQUEUE
    $('#songsList').on('click', '.lib-add', function(e) {
        var pos = $('#songsList .lib-add').index(this);
        if (library.containerSongs) {
            pos += library.containerSongs.getOffset();
        }
        mpdAdd(library.allSongs[pos].file);
        notify('add', library.allSongs[pos].display);
    });

    //click on PLAY ALL
    $('#lib-playall').click(function(e) {
        mpdPlayAll(library.allSongs.map(function(song) {
            return song.file;
        }));
    });

    //click on ADD ALL
    $('#lib-addall').click(function(e) {
        mpdAddAll(library.allSongs.map(function(song) {
            return song.file;
        }));
    });

    //click on FORCE RELOAD
    $('#lib-refresh').click(function(e) {
        // Reset all
        library.fullData = {};
        loadLibraryIfNeeded(true);
        renderGenres();
    });

    $("#lib-toolbar .btn").mouseenter(function(e) {
        status(e.target.title);
    }).mouseleave(function(e) {
        status();
    });

    $("#lib-toolbar input").mouseenter(function(e) {
        status(e.target.title);
    }).mouseleave(function(e) {
        status();
    });

    $("#lib-clear-search").click(function(e) {
        $("#lib-search").val("");
        onSearch();
    });

    $("#lib-search").change(onSearch).keypress(onSearch);

    library.socket.emit("lib-getfavs");

    $("#lib-favorites-save").click(function(e) {
        var name = $("#lib-favorites-name").val().trim();
        if (!name || name.indexOf("\\") >= 0 || name.indexOf("/") >= 0
                || name.indexOf("*") >= 0 || name.indexOf("'") >= 0
                || name.indexOf("\"") >= 0) {
            notify('custom', "The name must not contain any of /, \\, ', \" or *", 'Invalid name');
        } else {
            library.socket.emit("lib-savefav", {name: name, json: library.filters});
        }
    });

    $("#lib-search").val(library.filters.raw.join(" "));

    // Resize event
    $(window).resize(function() {
        decideViewLayout();
    });
});
