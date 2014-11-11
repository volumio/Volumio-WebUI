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

library = {
    isEnabled: false,
    shouldLoad: false,
    displayAsTab: false,
    lazyLoading: true,
    fullData: [],
    allGenres: [],
    allArtists: [],
    allAlbums: [],
    allSongs: [],
    filters: {
        artists: [],
        genres: [],
        albums: []
    },
    containerArtist: undefined,
    containerAlbums: undefined,
    containerSongs: undefined,
    viewSize: ""
};

function setLibOptions(isEnabled, displayAsTab, shouldLoad) {
    // The library will be enabled according to settings
    library.isEnabled = isEnabled;
    library.displayAsTab = displayAsTab;
    library.shouldLoad = library.isEnabled && shouldLoad;
}

function loadLibraryIfNeeded() {
    if (library.isEnabled && library.shouldLoad) {
        // Load it once only
        library.shouldLoad = false;
        // Load MPD content
        decideViewLayout();
        $("#lib-loader").show();
        $.post('db/?cmd=loadlib', {}, function(data) {
            $("#lib-loader").hide();
            $("#lib-content").show();
            onLoadedLibData(data);
        }, 'json');
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
    $("#lib-loader").show();
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
    library.fullData.length = 0;
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

function onLoadedLibData(data) {
//    genFakeData(data, 30000, 10);
    library.fullData = data;
    filterLib();
    // Insert data in DOM
    renderGenres();
}

function hasActiveFilters() {
    return library.filters.genres.length > 0
        || library.filters.artists.length > 0
        || library.filters.albums.length > 0;
}

function showAllSongs() {
    // Reset filters
    library.filters.genres.length = 0;
    library.filters.artists.length = 0;
    library.filters.albums.length = 0;
    filterLib(true);
    renderSongs();
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

function filterLib(forceShowAll) {
    library.allGenres = [];
    library.allArtists = [];
    library.allAlbums = [];
    library.allSongs = [];
    var albumsMap = {};
    var needReload = false;
    for (var genre in library.fullData) {
        library.allGenres.push(genre);
        if (library.filters.genres.length == 0 || library.filters.genres.indexOf(genre) >= 0) {
            for (var artist in library.fullData[genre]) {
                library.allArtists.push(artist);
                if (library.filters.artists.length == 0 || library.filters.artists.indexOf(artist) >= 0) {
                    for (var album in library.fullData[genre][artist]) {
                        var objAlbum = {"album": album, "artist": artist};
                        checkMergeAlbums(objAlbum, albumsMap);
                        if (!forceShowAll && !hasActiveFilters()) {
                            // Don't display all songs, let the browser breath!
                            continue;
                        }
                        if (library.filters.albums.length == 0 || library.filters.albums.indexOf(keyAlbum(objAlbum)) >= 0) {
                            for (var i in library.fullData[genre][artist][album]) {
                                var song = library.fullData[genre][artist][album][i];
                                song.album = album;
                                song.artist = artist;
                                library.allSongs.push(song);
                            }
                        }
                    }
                }
            }
        }
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
        filterLib(forceShowAll);
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
        library.containerArtist = new LazyLoader("#lib-artist", "#artistsList", 1000, library.allArtists.length, 100, getArtistHtml);
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
           + '">' + library.allAlbums[i].album + (i > 0 ? ' <span> (' + library.allAlbums[i].artist + ')</span>' : '') + '</div></li>';
    }
    return html;
}

var renderAlbums = function() {
    if (library.lazyLoading) {
        if (library.containerAlbums) {
            library.containerAlbums.destroy();
        }
        library.containerAlbums = new LazyLoader("#lib-album", "#albumsList", 1000, library.allAlbums.length, 100, getAlbumHtml);
    } else {
        $('#albumsList').html(getAlbumHtml(0, library.allAlbums.length-1));
    }
    renderSongs();
}

var getSongHtml = function(from, to) {
    var html = "";
    for (var i = from; i <= to; i++) {
        html += '<li id="lib-song-' + (i + 1) + '" class="clearfix" title="' + library.allSongs[i].file + '"><div class="lib-entry">' + library.allSongs[i].display
            + ' <span> (' + library.allSongs[i].artist + ', ' + library.allSongs[i].album
            + ')<div class="lib-play"><a title="Play" href="#notarget" class="btn"><i class="fa fa-play"></i></a></div>'
            + '<div class="lib-add"><a title="Enqueue" href="#notarget" class="btn"><i class="fa fa-plus"></i></a></div></div></li>';
    }
    return html;
}

var renderSongs = function() {
    if (library.allSongs.length == 0 && !hasActiveFilters()) {
        // There's no song because no filter is active, so display a button instead
        // Clicking on this button would force display all
        $('.lib-showall').show();
    } else {
        $('.lib-showall').hide();
    }

    if (library.lazyLoading) {
        if (library.containerSongs) {
            library.containerSongs.destroy();
        }
        library.containerSongs = new LazyLoader("#lib-file", "#songsList", 1000, library.allSongs.length, 100, getSongHtml);
    } else {
        $('#songsList').html(getSongHtml(0, library.allSongs.length-1));
    }
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

// On ready, register callbacks
jQuery(document).ready(function($) {

    // Tabs initialization
    if (library.isEnabled) {
        enableLibrary();
    } else {
        disableLibrary();
    }

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
        getDB('addreplaceplay', library.allSongs[pos].file);
        notify('addreplaceplay', library.allSongs[pos].display);
    });

    //click on ENQUEUE
    $('#songsList').on('click', '.lib-add', function(e) {
        var pos = $('#songsList .lib-add').index(this);
        if (library.containerSongs) {
            pos += library.containerSongs.getOffset();
        }
        getDB('add', library.allSongs[pos].file);
        notify('add', library.allSongs[pos].display);
    });

    //click on SHOW ALL SONGS
    $('.lib-showall').click(function(e) {
        showAllSongs();
    });

    //click on PLAY ALL
    $('.lib-playall').click(function(e) {
        getDB('playall', library.allSongs);
    });

    //click on ADD ALL
    $('.lib-addall').click(function(e) {
        getDB('addall', library.allSongs);
    });

    // Resize event
    $(window).resize(function() {
        decideViewLayout();
    });
});
