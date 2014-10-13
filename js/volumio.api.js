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
 *  Authors:
 *  - v1, 1.1: Andrea Coiutti (aka ACX)
 *  - v1, 1.1: Simone De Gregori (aka Orion)
 *  - v2: Michelangelo Guarise
 *  - v2: Joel Takvorian
 * 
 *  file:                    volumio.api.js
 *  version:                 2
 */

 // Global GUI object
 GUI = {
    mpd: {
        state: "",
        elapsed: "0",
        time: "0",
        playlist: ""
    },
	spop: {
        state: ""
    },
    current: {
        artist: "",
        album: "",
        title: ""
    },
    state: "",
    cmd: 'status',
    playlist: null,
    currentknob: null,
    currentpath: '',
    volume: null,
    currentDBpos: new Array(0,0,0,0,0,0,0,0,0,0,0),
    menuClicked: {
        path: '',
        title: '',
        artist: '',
        album: ''
    },
    visibility: 'visible'
};

bootstrapContext = {
    left: '',
    top: ''
};


// FUNZIONI
// ----------------------------------------------------------------------------------------------------

function onMpdRefreshed(state) {
    GUI.mpd = state;
}

function onCurrentRefreshed(current) {
    var previousSong = GUI.current.title;
    GUI.current = current.song || {
        artist: "",
        album: "",
        title: ""
    };
    renderUI(previousSong);
}

function backendRequestSpop() {
    $.ajax({
        type : 'GET',
        url : '_player_engine_spop.php?state=' + GUI.spop.state,
        async : true,
        cache : false,
        success : function(data) {
			if (data != '') {
				GUI.spop = eval('(' + data + ')');
                var previousSong = GUI.current.title;
                GUI.current.artist = GUI.spop.artist;
                GUI.current.album = GUI.spop.album;
                GUI.current.title = GUI.spop.title;
				renderUI(previousSong);
	            backendRequestSpop();
			} else {
				setTimeout(function() {
					backendRequestSpop();
				}, 5000);
			}
        },
        error : function() {
            setTimeout(function() {
                backendRequestSpop();
            }, 5000);
        }
    });
}

function renderUI(previousSong) {
	if (GUI.spop.state === 'play' || GUI.spop.state === 'pause') {
        // If Spop is playing, temporarily redirect button control and title display to Spop
        GUI.state = GUI.spop.state;

		// Combine the Spop state array with the Mpd state array - any state variable defined by Spop will overwrite the corresponding Mpd state variable
		var objectCombinedState = $.extend({}, GUI.mpd, GUI.spop);
	    updateGUI(objectCombinedState, previousSong);
		refreshTimer(parseInt(objectCombinedState['elapsed']), parseInt(objectCombinedState['time']), objectCombinedState['state']);
		refreshKnob(objectCombinedState);

	} else {
        // Else UI should be connected to MPD status
	    GUI.state = GUI.mpd.state;
	    updateGUI(GUI.mpd, previousSong);
		refreshTimer(parseInt(GUI.mpd.elapsed), parseInt(GUI.mpd.time), GUI.mpd.state);
		refreshKnob(GUI.mpd);
	}

    if (GUI.state !== 'disconnected') {
        $('#loader').hide();
    }

    if (GUI.mpd.playlist !== GUI.playlist) {
        getPlaylist(GUI.mpd);
        GUI.playlist = GUI.mpd.playlist;
    }
}

function getPlaylist(json){
    $.getJSON('db/?cmd=playlist', function(data) {
        // We wait for playlist to be loaded before loading the library, which is much more time-consumming
        loadLibraryIfNeeded();

        // Read received data for playlist
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
                content += '<div class="pl-action"><a class="btn" href="#notarget" title="Remove song from playlist"><i class="fa fa-remove"></i></a></div>';
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
                    songpath = retrieveParentPath(data[i].file);
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

function retrieveParentPath(str) {
	var cutpos=str.lastIndexOf("/");
	//-- verify this switch! (Orion)
    var parentPath = "";
	if (cutpos != -1) {
        parentPath = str.slice(0, cutpos);
	}
	return parentPath;
}

// update interface
function updateGUI(stateObj, previousSong){
    // check MPD status
    if (stateObj.state === 'play') {
        $('#play').addClass('btn-primary');
        $('#play i').removeClass('fa fa-pause').addClass('fa fa-play');
        $('#stop').removeClass('btn-primary');

    } else if (stateObj.state === 'pause') {
        $('#playlist-position').html('Not playing');
        $('#play').addClass('btn-primary');
        $('#play i').removeClass('fa fa-play').addClass('fa fa-pause');
        $('#stop').removeClass('btn-primary');

    } else if (stateObj.state === 'stop') {
        $('#play').removeClass('btn-primary');
        $('#play i').removeClass('fa fa-pause').addClass('fa fa-play');
        $('#stop').addClass('btn-primary');
        $('#countdown-display').countdown('destroy');
        $('#elapsed').html('00:00');
        $('#total').html('');
        $('#time').val(0).trigger('change');
        $('#format-bitrate').html('&nbsp;');
        $('.playlist li').removeClass('active');
    }

    $('#elapsed').html(timeConvert(stateObj.elapsed));
	$('#total').html(timeConvert(stateObj.time));

	var fileinfo = (stateObj.audioChannels && stateObj.audioSampleDepth && stateObj.audioSampleRate) ? (stateObj.audioChannels + ' - ' + stateObj.audioSampleDepth + ' bit - ' + stateObj.audioSampleRate +' kHz ') : '&nbsp;';
	$('#format-bitrate').html(fileinfo);

	$('#playlist-position').html('Playlist position ' + (parseInt(stateObj.song) + 1) +'/'+stateObj.playlistlength);
	$('.playlist li').removeClass('active');
	var current = parseInt(stateObj.song) + 1;
	if (!isNaN(current)) {
		$('.playlist li:nth-child(' + current + ')').addClass('active');
	}

    // show UpdateDB icon
	if (typeof GUI.mpd.updating_db != 'undefined') {
		$('.open-panel-sx').html('<i class="fa fa-refresh fa-spin"></i> Updating');
	} else {
		$('.open-panel-sx').html('<i class="fa fa-music sx"></i> Browse');
	}

    // check song update
    if (previousSong !== GUI.current.title) {
        countdownRestart(0);
        if ($('#panel-dx').hasClass('active')) {
            var current = parseInt(stateObj.song);
            customScroll('pl', current);
        }
    }

    // common actions
    // Don't update the knob if it's currently being changed
    var volume = $('#volume');
    if (volume[0] && (volume[0].knobEvents === undefined || !volume[0].knobEvents.isSliding)) {
        volume.val((stateObj.volume == '-1') ? 100 : stateObj.volume).trigger('change');
    }
    $('#currentartist').html(GUI.current.artist);
    $('#currentsong').html(GUI.current.title);
    $('#currentalbum').html(GUI.current.album);
    if (stateObj.repeat) {
        $('#repeat').addClass('btn-primary');
    } else {
        $('#repeat').removeClass('btn-primary');
    }
    if (stateObj.random) {
        $('#random').addClass('btn-primary');
    } else {
        $('#random').removeClass('btn-primary');
    }
    if (stateObj.consume) {
        $('#consume').addClass('btn-primary');
    } else {
        $('#consume').removeClass('btn-primary');
    }
    if (stateObj.single) {
        $('#single').addClass('btn-primary');
    } else {
        $('#single').removeClass('btn-primary');
    }

	//Change Name according to Now Playing
	if (GUI.current.artist != null && GUI.current.title != null) {
        document.title = GUI.current.title + ' - ' + GUI.current.artist + ' - ' + 'Volumio';
	} else {
        document.title = 'Volumio - Audiophile Music Player';
    }
}

// update countdown
function refreshTimer(startFrom, stopTo, state){
    if (state == 'play') {
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
    } else if (state == 'pause') {
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
    var initTime = 100 * json['elapsed'] / json['time'];
    var delta = json['time'] / 1000;
    $('#time').val(initTime*10).trigger('change');
    if (GUI.state == 'play') {
        GUI.currentKnob = setInterval(function() {
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
function setVolume(val) {
    GUI.volume = val;
    $('#volumemute').removeClass('btn-primary');
    mpdVolume(val);
}

// adjust knob with volume
function adjustKnobVolume(val) {
    $('#volume').val(val);
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

//Social Sharing
$('a.tweet').click(function(e){
    var urlTwitter = 'https://twitter.com/home?status=%E2%99%AB%20%23NowPlaying+' + GUI.current.artist.replace(/\s+/g, '+') + '+-+' + GUI.current.title.replace(/\s+/g, '+') + '+with+%40Volumio+http%3A%2F%2Fvolumio.org%2F+';
    $('a.tweet').attr('href', urlTwitter);
});
$('a.facebook').click(function(e){
    var urlFacebook = 'https://www.facebook.com/sharer.php?u=http%3A%2F%2Fvolumio.org%2F&display=popup';
    $('a.facebook').attr('href', urlFacebook);
});
$('a.googleplus').click(function(e){
    var urlGooglePlus = 'https://plus.google.com/share?url=http%3A%2F%2Fvolumio.org%2F';;
    $('a.googleplus').attr('href', urlGooglePlus);
});
