/*
 *      PlayerUI Copyright (C) 2013 Andrea Coiutti & Simone De Gregori
 *		 Tsunamp Team
 *      http://www.tsunamp.com
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
 *
 *	UI-design/JS code by: 	Andrea Coiutti (aka ACX)
 * PHP/JS code by:			Simone De Gregori (aka Orion)
 * 
 * file:							player_lib.js
 * version:						1.1
 *
 */
 
 // Initialize GUI array
 var GUI = {
    json: 0,
    cmd: 'status',
    playlist: null,
    currentsong: null,
    currentknob: null,
    state: '',
    currentpath: '',
    halt: 0,
    volume: null,
    currentDBpos: new Array(0,0,0,0,0,0,0,0,0,0,0),
    DBentry: new Array('', '', ''),
    visibility: 'visible',
    DBupdate: 0
};

filters = {
    artists: [],
    genres: [],
    albums: []
}


// FUNZIONI
// ----------------------------------------------------------------------------------------------------

function sendCmd(inputcmd) {
	$.ajax({
		type: 'GET',
		url: 'command/?cmd=' + inputcmd,
		async: true,
		cache: false,
		success: function(data){
			GUI.halt = 1;
			// console.log('GUI.halt (sendCmd)= ', GUI.halt);
		},
    });
}

function sendPLCmd(inputcmd) {
	$.ajax({
		type: 'GET',
		url: 'db/?cmd=' + inputcmd,
		async: true,
		cache: false,
		success: function(data){
			GUI.halt = 1;
			// console.log('GUI.halt (sendPLcmd)= ', GUI.halt);
		},
    });
}

function backendRequest(){
    $.ajax({
		type: 'GET',
		url: '_player_engine.php?state=' + GUI.state,
		async: true,
		cache: false,
		success: function(data){
			// console.log('GUI.halt (backendRequest)= ', GUI.halt);
			renderUI(data);
			GUI.currentsong = GUI.json['currentsong'];
			// GUI.halt = 1;
			backendRequest(GUI.state);
		},
		error: function(){
			setTimeout(function(){
				GUI.state = 'disconnected';
				// console.log('GUI.state = ', GUI.state);
				// console.log('GUI.halt (disconnected) = ',GUI.halt);
				$('#loader').show();
				$('#countdown-display').countdown('pause');
				window.clearInterval(GUI.currentKnob);
				backendRequest(GUI.state);
			}, 5000);
		}
    });
}

function renderUI(data) {
	// update global GUI array
	GUI.json = eval('(' + data + ')');
	GUI.state = GUI.json['state'];
	// console.log('current song = ', GUI.json['currentsong']);
	// console.log( 'GUI.state = ', GUI.state );
	updateGUI(GUI.json);
		if (GUI.state != 'disconnected') {
	$('#loader').hide();
	}
	refreshTimer(parseInt(GUI.json['elapsed']), parseInt(GUI.json['time']), GUI.json['state']);
	refreshKnob(GUI.json);
	if (GUI.json['playlist'] != GUI.playlist) {
		getPlaylist(GUI.json);
		GUI.playlist = GUI.json['playlist'];
		//console.log('playlist = ', GUI.playlist);
	}
	GUI.halt = 0;
	// console.log('GUI.halt (renderUI)= ', GUI.halt);
}

function getPlaylist(json){
    $.getJSON('db/?cmd=playlist', function(data) {
        var i = 0;
        var content = '';
        var output = '';
        if (data) {
            for (i = 0; i < data.length; i++){
                if (json['state'] != 'stop' && i == parseInt(json['song'])) {
                    content = '<li id="pl-' + (i + 1) + '" class="active clearfix">';
                } else {
                    content = '<li id="pl-' + (i + 1) + '" class="clearfix">';
                }
                content += '<div class="pl-action"><a class="btn" href="#notarget" title="Remove song from playlist"><i class="icon-remove-sign"></i></a></div>';
                if (typeof data[i].Title != 'undefined') {
                    content += '<div class="pl-entry">';
                    content += data[i].Title + ' <em class="songtime">' + timeConvert(data[i].Time) + '</em>';
                    content += ' <span>';
                    content +=  data[i].Artist;
                    content += ' - ';
                    content +=  data[i].Album;
                    content += '</span></div></li>';
                    output = output + content;
                } else {
                    songpath = parsePath(data[i].file);
                    content += '<div class="pl-entry">';
                    content += data[i].file.replace(songpath + '/', '') + ' <em class="songtime">' + timeConvert(data[i].Time) + '</em>';
                    content += ' <span>';
                    content += ' path \: ';
                    content += songpath;
                    content += '</span></div></li>';
                    output = output + content;
                }
            }
        }
        $('ul.playlist').html(output);
    });
}

function parsePath(str) {
	var cutpos=str.lastIndexOf("/");
	//-- verify this switch! (Orion)
	if (cutpos !=-1) {
	//console.log('cutpos = ', cutpos);
	var songpath = str.slice(0,cutpos);
	//console.log('songpath = ', songpath);
	}  else {
	songpath = '';
	}
	return songpath;
}

function parseResponse(inputArr,respType,i,inpath) {		
	switch (respType) {
		case 'playlist':		
			// code placeholder
		break;
		
		case 'db':
			//console.log('inpath= :',inpath);
			//console.log('inputArr[i].file= :',inputArr[i].file);
			if (inpath == '' && typeof inputArr[i].file != 'undefined') {
			inpath = parsePath(inputArr[i].file)
			}
			if (typeof inputArr[i].file != 'undefined') {
				//debug
				//console.log('inputArr[i].file: ', inputArr[i].file);
				//console.log('inputArr[i].Title: ', inputArr[i].Title);
				//console.log('inputArr[i].Artist: ', inputArr[i].Artist);
				//console.log('inputArr[i].Album: ', inputArr[i].Album);
				if (typeof inputArr[i].Title != 'undefined') {
					content = '<li id="db-' + (i + 1) + '" class="clearfix" data-path="';
					content += inputArr[i].file;
					content += '"><div class="db-icon db-song db-browse"><i class="icon-music sx db-browse"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="icon-reorder"></i></a></div><div class="db-entry db-song db-browse">';
					content += inputArr[i].Title + ' <em class="songtime">' + timeConvert(inputArr[i].Time) + '</em>';
					content += ' <span>';
					content +=  inputArr[i].Artist;
					content += ' - ';
					content +=  inputArr[i].Album;
					content += '</span></div></li>';

				} else {
					content = '<li id="db-' + (i + 1) + '" class="clearfix" data-path="';
					content += inputArr[i].file;
					content += '"><div class="db-icon db-song db-browse"><i class="icon-music sx db-browse"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="icon-reorder"></i></a></div><div class="db-entry db-song db-browse">';
					content += inputArr[i].file.replace(inpath + '/', '') + ' <em class="songtime">' + timeConvert(inputArr[i].Time) + '</em>';
					content += ' <span>';
					content += ' path \: ';
					content += inpath;
					content += '</span></div></li>';
				}
			} else {
			//debug
			//console.log('inputArr[i].directory: ', data[i].directory);
				content = '<li id="db-' + (i + 1) + '" class="clearfix" data-path="';
				content += inputArr[i].directory;
				if (inpath != '') {
					content += '"><div class="db-icon db-folder db-browse"><i class="icon-folder-open sx"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="icon-reorder"></i></a></div><div class="db-entry db-folder db-browse">';
				} else {
					content += '"><div class="db-icon db-folder db-browse"><i class="icon-hdd icon-root sx"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu-root"><i class="icon-reorder"></i></a></div><div class="db-entry db-folder db-browse">';
				}
				content += inputArr[i].directory.replace(inpath + '/', '');
				content += '</div></li>';
			}
		break;
		
	}
	return content;
} // end parseResponse()

function getDB(cmd, path, browsemode, uplevel){
	if (cmd == 'filepath') {
		$.post('db/?cmd=filepath', { 'path': path }, function(data) {
			populateDB(data, path, uplevel);
		}, 'json');
	} else if (cmd == 'add') {
		$.post('db/?cmd=add', { 'path': path }, function(path) {
			// console.log('add= ', path);
		}, 'json');
	} else if (cmd == 'addplay') {
		$.post('db/?cmd=addplay', { 'path': path }, function(path) {
			// console.log('addplay= ',path);
		}, 'json');
	} else if (cmd == 'addreplaceplay') {
		$.post('db/?cmd=addreplaceplay', { 'path': path }, function(path) {
			// console.log('addreplaceplay= ',path);
		}, 'json');
	} else if (cmd == 'update') {
		$.post('db/?cmd=update', { 'path': path }, function(path) {
			// console.log('update= ',path);
		}, 'json');
	} else if (cmd == 'search') {
		var keyword = $('#db-search-keyword').val();
		$.post('db/?querytype=' + browsemode + '&cmd=search', { 'query': keyword }, function(data) {
			populateDB(data, path, uplevel, keyword);
		}, 'json');
	} else if (cmd == 'playall') {
                $.post('db/?cmd=playall', { 'path': path }, function(data) {}, 'json');
        } else if (cmd == 'addall') {
                $.post('db/?cmd=addall', { 'path': path }, function(data) {}, 'json');
        }
}

function populateDB(data, path, uplevel, keyword){
	if (path) GUI.currentpath = path;
	// console.log(' new GUI.currentpath = ', GUI.currentpath);
	var DBlist = $('ul.database');
	DBlist.html('');
	if (keyword) {
		var results = (data.length) ? data.length : '0';
		var s = (data.length == 1) ? '' : 's';
		var text = "" + results + ' result' + s + ' for "<em class="keyword">' + keyword + '</em>"';
		$("#db-back").attr("title", "Close search results and go back to the DB");
		$("#db-back-text").html(text);
		$("#db-back").show();
	} else if (path != '') {
		$("#db-back").attr("title", "");
		$("#db-back-text").html("back");
		$("#db-back").show();
	} else {
        	$("#db-back").hide();
	}
	var content = '';
	var i = 0;
	for (i = 0; i < data.length; i++){
		content = parseResponse(data,'db',i,path);
	 	DBlist.append(content);
	}
	$('#db-currentpath span').html(path);
	if (uplevel) {
		// console.log('PREV LEVEL');
		$('#db-' + GUI.currentDBpos[GUI.currentDBpos[10]]).addClass('active');
		customScroll('db', GUI.currentDBpos[GUI.currentDBpos[10]]);
	} else {
		// console.log('NEXT LEVEL');
		customScroll('db', 0, 0);
	}
	// debug
	// console.log('GUI.currentDBpos = ', GUI.currentDBpos);
	// console.log('livello = ', GUI.currentDBpos[10]);
	// console.log('elemento da illuminare = ', GUI.currentDBpos[GUI.currentDBpos[10]]);
}

// update interface
function updateGUI(json){
    // check MPD status
    refreshState(GUI.state);
    // check song update
    //console.log('A = ', json['currentsong']); console.log('B = ', GUI.currentsong);
    if (GUI.currentsong != json['currentsong']) {
        countdownRestart(0);
        if ($('#panel-dx').hasClass('active')) {
            var current = parseInt(json['song']);
            customScroll('pl', current);
        }
    }
    // common actions
    // console.log('GUI.halt (azioni comuni)= ', GUI.halt);
    //if (!GUI.halt) {
        //refreshTimer(parseInt(json['elapsed']), parseInt(json['time']), json['state']);

        $('#volume').val((json['volume'] == '-1') ? 100 : json['volume']).trigger('change');
        $('#currentartist').html(json['currentartist']);
        $('#currentsong').html(json['currentsong']);
        $('#currentalbum').html(json['currentalbum']);
        if (json['repeat'] == 1) {
            $('#repeat').addClass('btn-primary');
        } else {
            $('#repeat').removeClass('btn-primary');
        }
        if (json['random'] == 1) {
            $('#random').addClass('btn-primary');
        } else {
            $('#random').removeClass('btn-primary');
        }
        if (json['consume'] == 1) {
            $('#consume').addClass('btn-primary');
        } else {
            $('#consume').removeClass('btn-primary');
        }
        if (json['single'] == 1) {
            $('#single').addClass('btn-primary');
        } else {
            $('#single').removeClass('btn-primary');
        }

    //}
    GUI.halt = 0;
    // console.log('GUI.halt (azioni comuni2)= ', GUI.halt);
    GUI.currentsong = json['currentsong'];
}

// update status on playback view
function refreshState(state) {
    if (state == 'play') {
        $('#play').addClass('btn-primary');
        $('#play i').removeClass('icon-pause').addClass('icon-play');
        $('#stop').removeClass('btn-primary');
    } else if (state == 'pause') {
        $('#playlist-position').html('Not playing');
        $('#play').addClass('btn-primary');
        $('#play i').removeClass('icon-play').addClass('icon-pause');
        $('#stop').removeClass('btn-primary');
    } else if (state == 'stop') {
        $('#play').removeClass('btn-primary');
        $('#play i').removeClass('icon-pause').addClass('icon-play');
        $('#stop').addClass('btn-primary');
        $('#countdown-display').countdown('destroy');
        $('#elapsed').html('00:00');
        $('#total').html('');
        $('#time').val(0).trigger('change');
        $('#format-bitrate').html('&nbsp;');
        $('.playlist li').removeClass('active');
    }
    if (state == 'play' || state == 'pause') {
        $('#elapsed').html(timeConvert(GUI.json['elapsed']));
        $('#total').html(timeConvert(GUI.json['time']));
        //$('#time').val(json['song_percent']).trigger('change');
        $('#playlist-position').html('Playlist position ' + (parseInt(GUI.json['song']) + 1) +'/'+GUI.json['playlistlength']);
        var fileinfo = (GUI.json['audio_channels'] && GUI.json['audio_sample_depth'] && GUI.json['audio_sample_rate']) ? (GUI.json['audio_channels'] + ', ' + GUI.json['audio_sample_depth'] + ' bit, ' + GUI.json['audio_sample_rate'] +' kHz, '+GUI.json['bitrate']+' kbps') : '&nbsp;';
        $('#format-bitrate').html(fileinfo);
        $('.playlist li').removeClass('active');
        var current = parseInt(GUI.json['song']) + 1;
        $('.playlist li:nth-child(' + current + ')').addClass('active');
    }
	
	// show UpdateDB icon
	// console.log('dbupdate = ', GUI.json['updating_db']);
	if (typeof GUI.json['updating_db'] != 'undefined') {
		$('.open-panel-sx').html('<i class="icon-refresh icon-spin"></i> Updating');
	} else {
		$('.open-panel-sx').html('<i class="icon-folder-open sx"></i> Browse');
	}
}

// update countdown
function refreshTimer(startFrom, stopTo, state){
    //console.log('startFrom = ', startFrom);
    //console.log('state = ', state);
    if (state == 'play') {
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
    } else if (state == 'pause') {
        //console.log('startFrom = ', startFrom);
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
        $('#countdown-display').countdown('pause');
    } else if (state == 'stop') {
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
        $('#countdown-display').countdown('pause');
    }
}

// update right knob
function refreshKnob(json){
    window.clearInterval(GUI.currentKnob)
    var initTime = json['song_percent'];
    //console.log('percent = ', initTime);
    var delta = json['time'] / 1000;
    $('#time').val(initTime*10).trigger('change');
    if (GUI.state == 'play') {
        GUI.currentKnob = setInterval(function() {
            // console.log('initTime = ', initTime);
            // console.log('delta = ', delta);
            if (GUI.visibility == 'visible') {
                initTime = initTime + 0.1;
            } else {
                initTime = initTime + 100/json['time'];
            }
            $('#time').val(initTime*10).trigger('change');
            //document.title = Math.round(initTime*10) + ' - ' + GUI.visibility;
        }, delta * 1000);
    }
}

// time conversion
function timeConvert(seconds) {
    if(isNaN(seconds)) {
    	display = '';
    } else {
    	minutes = Math.floor(seconds / 60);
    	seconds -= minutes * 60;
    	mm = (minutes < 10) ? ('0' + minutes) : minutes;
    	ss = (seconds < 10) ? ('0' + seconds) : seconds;
    	display = mm + ':' + ss;
    }
    return display;
}

// reset countdown
function countdownRestart(startFrom) {
    $('#countdown-display').countdown('destroy');
    $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
}

// set volume with knob
function setvol(val) {
    $('#volume').val(val);
    GUI.volume = val;
    GUI.halt = 1;
    // console.log('GUI.halt (setvol)= ', GUI.halt);
    $('#volumemute').removeClass('btn-primary');
    sendCmd('setvol ' + val);
}

// scrolling
function customScroll(list, destination, speed) {
    if (typeof(speed) === 'undefined') speed = 500;
    var entryheight = parseInt(1 + $('#' + list + '-1').height());
    var centerheight = parseInt($(window).height()/2);
    var scrolltop = $(window).scrollTop();
    if (list == 'db') {
        var scrollcalc = parseInt((destination)*entryheight - centerheight);
        var scrolloffset = scrollcalc;
    } else if (list == 'pl') {
        //var scrolloffset = parseInt((destination + 2)*entryheight - centerheight);
        var scrollcalc = parseInt((destination + 2)*entryheight - centerheight);
        if (scrollcalc > scrolltop) {
            var scrolloffset = '+=' + Math.abs(scrollcalc - scrolltop) + 'px';
        } else {
            var scrolloffset = '-=' + Math.abs(scrollcalc - scrolltop) + 'px';
        }
    }
    // debug
    // console.log('-------------------------------------------');
    // console.log('customScroll parameters = ' + list + ', ' + destination + ', ' + speed);
    // console.log('scrolltop = ', scrolltop);
    // console.log('scrollcalc = ', scrollcalc);
    // console.log('scrolloffset = ', scrolloffset);
    if (scrollcalc > 0) {
        $.scrollTo( scrolloffset , speed );
    } else {
        $.scrollTo( 0 , speed );
    }
    //$('#' + list + '-' + (destination + 1)).addClass('active');
}

function randomScrollPL() {
    var n = $(".playlist li").size();
    var random = 1 + Math.floor(Math.random() * n);
    customScroll('pl', random);
}
function randomScrollDB() {
    var n = $(".database li").size();
    var random = 1 + Math.floor(Math.random() * n);
    customScroll('db', random);
}

function loadLibrary(data) {
    fullLib = data;
    filterLib();
    // Insert data in DOM
    renderGenres();
}

function filterLib() {
    allGenres = [];
    allArtists = [];
    allAlbums = [];
    allSongs = [];
    var needReload = false;
    for (var genre in fullLib) {
        allGenres.push(genre);
        if (filters.genres.length == 0 || filters.genres.indexOf(genre) >= 0) {
            for (var artist in fullLib[genre]) {
                allArtists.push(artist);
                if (filters.artists.length == 0 || filters.artists.indexOf(artist) >= 0) {
                    for (var album in fullLib[genre][artist]) {
                        var objAlbum = {"album": album, "artist": artist};
                        allAlbums.push(objAlbum);
                        if (filters.albums.length == 0 || filters.albums.indexOf(keyAlbum(objAlbum)) >= 0) {
                            for (var i in fullLib[genre][artist][album]) {
                                var song = fullLib[genre][artist][album][i];
                                song.album = album;
                                song.artist = artist;
                                allSongs.push(song);
                            }
                        }
                    }
                }
            }
        }
    }

    // Check filters validity
    var newFilters = checkFilters(filters.albums, allAlbums, function(o) { return keyAlbum(o); });
    if (newFilters.length != filters.albums.length) {
        needReload = true;
        filters.albums = newFilters;
    }
    newFilters = checkFilters(filters.artists, allArtists, function(o) { return o; });
    if (newFilters.length != filters.artists.length) {
        needReload = true;
        filters.artists = newFilters;
    }

    if (needReload) {
        filterLib();
    } else {
        // Sort lists
        allGenres.sort();
        allGenres = ["All genres"].concat(allGenres);
        allArtists.sort();
        allArtists = ["All artists"].concat(allArtists);
        allAlbums.sort(function(a, b) { return a.album.toLowerCase() > b.album.toLowerCase() ? 1 : -1; });
        allAlbums = [{"album": "All albums", "artist": ""}].concat(allAlbums);
    }
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
    for (var i = 0; i < allGenres.length; i++) {
        output += '<li class="clearfix"><div class="lib-entry'
               + (filters.genres.indexOf(allGenres[i]) >= 0 ? ' active' : '')
               + '">' + allGenres[i] + '</div></li>';
    }
    $('#genresList').html(output);
    renderArtists();
}

var renderArtists = function() {
    var output = '';
    for (var i = 0; i < allArtists.length; i++) {
        output += '<li class="clearfix"><div class="lib-entry'
               + (filters.artists.indexOf(allArtists[i]) >= 0 ? ' active' : '')
               + '">' + allArtists[i] + '</div></li>';
    }
    $('#artistsList').html(output);
    renderAlbums();
}

var renderAlbums = function() {
    var output = '';
    for (var i = 0; i < allAlbums.length; i++) {
        output += '<li class="clearfix"><div class="lib-entry'
               + (filters.albums.indexOf(keyAlbum(allAlbums[i])) >= 0 ? ' active' : '')
               + '">' + allAlbums[i].album + (i > 0 ? ' <span> (' + allAlbums[i].artist + ')</span>' : '') + '</div></li>';
    }
    $('#albumsList').html(output);
    renderSongs();
}

var renderSongs = function() {
    var output = '';
    for (var i = 0; i < allSongs.length; i++) {
        output += '<li id="lib-song-' + (i + 1) + '" class="clearfix"><div class="lib-entry">' + allSongs[i].display
                + ' <span> (' + allSongs[i].artist + ', '  + allSongs[i].album
                + ')<div class="lib-play"><a title="Play" href="#notarget" class="btn"><i class="icon-play"></i></a></div>'
                + '<div class="lib-add"><a title="Enqueue" href="#notarget" class="btn"><i class="icon-plus-sign"></i></a></div></div></li>';
    }
    $('#songsList').html(output);
}

function clickedLibItem(event, item, currentFilter, renderFunc) {
    if (item == undefined) {
        // All
        currentFilter.length = 0;
    } else if (event.ctrlKey) {
        currentIndex = currentFilter.indexOf(item);
        if (currentIndex >= 0) {
            currentFilter.splice(currentIndex, 1);
        } else {
            currentFilter.push(item);
        }
    } else {
        currentFilter.length = 0;
        currentFilter.push(item);
    }
    // Updated filters
    filterLib();
    // Render
    renderFunc();
}

// click on GENRE
$('#genresList').on('click', '.lib-entry', function(e) {
    var pos = $('#genresList .lib-entry').index(this);
    clickedLibItem(e, pos == 0 ? undefined : allGenres[pos], filters.genres, renderGenres);
});

// click on ARTIST
$('#artistsList').on('click', '.lib-entry', function(e) {
    var pos = $('#artistsList .lib-entry').index(this);
    clickedLibItem(e, pos == 0 ? undefined : allArtists[pos], filters.artists, renderArtists);
});

// click on ALBUM
$('#albumsList').on('click', '.lib-entry', function(e) {
    var pos = $('#albumsList .lib-entry').index(this);
    clickedLibItem(e, pos == 0 ? undefined : keyAlbum(allAlbums[pos]), filters.albums, renderAlbums);
});

// click on PLAY
$('#songsList').on('click', '.lib-play', function(e) {
    var pos = $('#songsList .lib-play').index(this);
    getDB('addreplaceplay', allSongs[pos].file);
    notify('addreplaceplay', allSongs[pos].display);
});

// click on ENQUEUE
$('#songsList').on('click', '.lib-add', function(e) {
    var pos = $('#songsList .lib-add').index(this);
    getDB('add', allSongs[pos].file);
    notify('add', allSongs[pos].display);
});

// click on PLAY ALL
$('.lib-playall').click(function(e) {
    var res = getDB('playall', allSongs);
console.log(res);
});

// click on ADD ALL
$('.lib-addall').click(function(e) {
    getDB('addall', allSongs);
});


