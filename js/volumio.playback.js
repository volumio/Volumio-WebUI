/*
 *  PlayerUI Copyright (C) 2013 Andrea Coiutti & Simone De Gregori
 *	 Tsunamp Team
 *  http://www.tsunamp.com
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
 *  file:                    volumio.playback.js
 *  version:                 2
 */

jQuery(document).ready(function($){ 'use strict';

    // INITIALIZATION
    // ----------------------------------------------------------------------------------------------------
    // first connection with MPD and SPOP daemons
    backendRequest();
	backendRequestSpop();

    // first GUI update
    updateGUI(GUI.MpdState);
    getDB('filepath', GUI.currentpath, 'file');
    $.pnotify.defaults.history = false;

    // hide "connecting" layer
    if (GUI.state != 'disconnected') {
        $('#loader').hide();
    }

    // BUTTONS
    // ----------------------------------------------------------------------------------------------------
    // playback
    $('.btn-cmd').click(function(){
        var cmd;
        // stop
        if ($(this).attr('id') == 'stop') {
            refreshTimer(0, 0, 'stop')
			window.clearInterval(GUI.currentKnob);
            $('.playlist li').removeClass('active');
            $('#total').html('');
        }
        // play/pause
        else if ($(this).attr('id') == 'play') {
            //if (json['currentsong'] != null) {
                if (GUI.state == 'play') {
                    cmd = 'pause';
                    $('#countdown-display').countdown('pause');
                } else if (GUI.state == 'pause') {
                    cmd = 'play';
                    $('#countdown-display').countdown('resume');
                } else if (GUI.state == 'stop') {
                    cmd = 'play';
                    $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
                }
                //$(this).find('i').toggleClass('icon-play').toggleClass('icon-pause');
                window.clearInterval(GUI.currentKnob);
                sendCmd(cmd);
                //console.log('sendCmd(' + cmd + ');');
                return;
            // } else {
                // $(this).addClass('btn-primary');
                // $('#stop').removeClass('btn-primary');
                // $('#time').val(0).trigger('change');
                // $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
            // }
        }
        // previous/next
        else if ($(this).attr('id') == 'previous' || $(this).attr('id') == 'next') {
            GUI.halt = 1;
            // console.log('GUI.halt (next/prev)= ', GUI.halt);
			$('#countdown-display').countdown('pause');
			window.clearInterval(GUI.currentKnob);
        }
        // step volume control
        else if ($(this).hasClass('btn-volume')) {
            if (GUI.volume == null ) {
                GUI.volume = $('#volume').val();
            }
            if ($(this).attr('id') == 'volumedn') {
                var vol = parseInt(GUI.volume) - 1;
                GUI.volume = vol;
                $('#volumemute').removeClass('btn-primary');
            } else if ($(this).attr('id') == 'volumeup') {
                var vol = parseInt(GUI.volume) + 1;
                GUI.volume = vol;
                $('#volumemute').removeClass('btn-primary');
            } else if ($(this).attr('id') == 'volumemute') {
                if ($('#volume').val() != 0 ) {
                    GUI.volume = $('#volume').val();
                    $(this).addClass('btn-primary');
                    var vol = 0;
                } else {
                    $(this).removeClass('btn-primary');
                    var vol = GUI.volume;
                }
            }
            //console.log('volume = ', GUI.volume);
            sendCmd('setvol ' + vol);
            return;
        }

        // toggle buttons
        if ($(this).hasClass('btn-toggle')) {
            if ($(this).hasClass('btn-primary')) {
                cmd = $(this).attr('id') + ' 0';
            } else {
                cmd = $(this).attr('id') + ' 1';
            }
        // send command
        } else {
            cmd = $(this).attr('id');
        }
        sendCmd(cmd);
        //console.log('sendCmd(' + cmd + ');');
    });

    // KNOBS
    // ----------------------------------------------------------------------------------------------------
    // playback progressing
    $('.playbackknob').knob({
        inline: false,
		change : function (value) {
            if (GUI.state != 'stop') {
				// console.log('GUI.halt (Knobs)= ', GUI.halt);
				window.clearInterval(GUI.currentKnob)
				//$('#time').val(value);
				//console.log('click percent = ', value);
				// implementare comando
			} else $('#time').val(0);
        },
        release : function (value) {
			if (GUI.state != 'stop') {
				//console.log('release percent = ', value);
				GUI.halt = 1;
				// console.log('GUI.halt (Knobs2)= ', GUI.halt);
				window.clearInterval(GUI.currentKnob);

				var seekto = 0;
				if (GUI.SpopState['state'] == 'play' || GUI.SpopState['state'] == 'pause') {
					seekto = Math.floor((value * parseInt(GUI.SpopState['time'])) / 1000);
					// Spop expects input to seek in ms
					sendCmd('seek ' + seekto * 1000);
					// Spop idle mode does not detect a seek change, so update UI manually
					$.ajax({
						type : 'GET',
						url : '_player_engine_spop.php?state=manualupdate',
						async : true,
						cache : false,
						success : function(data) {
							if (data != '') {
								GUI.SpopState = data;
								renderUI();
							}
						}
					});

				} else {
					seekto = Math.floor((value * parseInt(GUI.MpdState['time'])) / 1000);
					sendCmd('seek ' + GUI.MpdState['song'] + ' ' + seekto);

				}

				//console.log('seekto = ', seekto);
				$('#time').val(value);
				$('#countdown-display').countdown('destroy');
				$('#countdown-display').countdown({since: -seekto, compact: true, format: 'MS'});
			}
        },
        cancel : function () {
            //console.log('cancel : ', this);
        },
        draw : function () {}
    });

    // volume knob
    var volumeKnob = $('#volume');
    volumeKnob[0].isSliding = function() {
        return volumeKnob[0].knobEvents.isSliding;
    }
    volumeKnob[0].setSliding = function(sliding) {
        volumeKnob[0].knobEvents.isSliding = sliding;
    }
    volumeKnob[0].knobEvents = {
        isSliding: false,
        // on release => set volume
    	release: function (value) {
    	    if (this.hTimeout != null) {
                clearTimeout(this.hTimeout);
                this.hTimeout = null;
    	    }
    	    volumeKnob[0].setSliding(false);
            adjustKnobVolume(value);
    	    setVolume(value);
        },
    	hTimeout: null,
    	// on change => set volume only after a given timeout, to avoid flooding with volume requests
    	change: function (value) {
            volumeKnob[0].setSliding(true);
            var that = this;
            if (this.hTimeout == null) {
                this.hTimeout = setTimeout(function(){
                    clearTimeout(that.hTimeout);
                    that.hTimeout = null;
                    setVolume(value);
                }, 200);
            }
        },
        cancel : function () {
            volumeKnob[0].setSliding(false);
        },
        draw : function () {
            // "tron" case
            if(this.$.data('skin') == 'tron') {

                var a = this.angle(this.cv)  // Angle
                    , sa = this.startAngle          // Previous start angle
                    , sat = this.startAngle         // Start angle
                    , ea                            // Previous end angle
                    , eat = sat + a                 // End angle
                    , r = true;

                this.g.lineWidth = this.lineWidth;

                this.o.cursor
                    && (sat = eat - 0.05)
                    && (eat = eat + 0.05);

                if (this.o.displayPrevious) {
                    ea = this.startAngle + this.angle(this.value);
                    this.o.cursor
                        && (sa = ea - 0.1)
                        && (ea = ea + 0.1);
                    this.g.beginPath();
                    this.g.strokeStyle = this.previousColor;
                    this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sa, ea, false);
                    this.g.stroke();
                }

                this.g.beginPath();
                this.g.strokeStyle = r ? this.o.fgColor : this.fgColor ;
                this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sat, eat, false);
                this.g.stroke();

                this.g.lineWidth = 2;
                this.g.beginPath();
                this.g.strokeStyle = this.o.fgColor;
                this.g.arc(this.xy, this.xy, this.radius - this.lineWidth + 10 + this.lineWidth * 2 / 3, 0, 20 * Math.PI, false);
                this.g.stroke();

                return false;
            }
        }
    };
    volumeKnob.knob(volumeKnob[0].knobEvents);

    // "pulse" effect knob
    /*
    setInterval(function() {
        if (GUI.MpdState['state'] == 'play') {
            if (GUI.MpdState['state'] == 'play') {
                $('#timeflow').toggleClass('pulse');
                setTimeout(function(){
                    $('#timeknob').toggleClass('pulse');
                }, 1000);
            }
        }
    }, 1000);
    */


    // PLAYLIST
    // ----------------------------------------------------------------------------------------------------

    // click on playlist entry
    $('.playlist').on('click', '.pl-entry', function() {
        var pos = $('.playlist .pl-entry').index(this);
        var cmd = 'play ' + pos;
        sendCmd(cmd);
        GUI.halt = 1;
        // console.log('GUI.halt (playlist)= ', GUI.halt);
        $('.playlist li').removeClass('active');
        $(this).parent().addClass('active');
    });

    // click on playlist actions
    $('.playlist').on('click', '.pl-action', function(event) {
        event.preventDefault();
        var pos = $('.playlist .pl-action').index(this);
        var cmd = 'trackremove&songid=' + pos;
        notify('remove', '');
        sendPLCmd(cmd);
    });

    // click on playlist save button
    $('#pl-controls').on('click', '#pl-btnSave', function(event) {
	var plname = $("#pl-saveName").val();
	if (plname) {
	        sendPLCmd('savepl&plname=' + plname);
		notify('savepl', plname);
	} else {
		notify('needplname', '');
	}
    });

    // click on playlist tab
    $('#open-panel-dx a').click(function(){
        var current = parseInt(GUI.MpdState['song']);
        customScroll('pl', current, 200); // runs when tab ready!
    });

    // click on playback tab
    $('#open-playback a').click(function(){
        // do something
        // console.log('JSON = ', GUI.MpdState);
    });


    // DATABASE
    // ----------------------------------------------------------------------------------------------------

    // click on database "back"
    $('#db-back').click(function() {
        --GUI.currentDBpos[10];
        var path = GUI.currentpath;
        var cutpos=path.lastIndexOf("/");
        if (cutpos !=-1) {
            var path = path.slice(0,cutpos);
        }  else {
            path = '';
        }
        getDB('filepath', path, GUI.browsemode, 1);
    });

    // click on database entry
    $('.database').on('click', '.db-browse', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        if (!$(this).hasClass('sx')) {
            if ($(this).hasClass('db-folder')) {
                var path = $(this).parent().data('path');
                var entryID = $(this).parent().attr('id');
                entryID = entryID.replace('db-','');
                GUI.currentDBpos[GUI.currentDBpos[10]] = entryID;
                ++GUI.currentDBpos[10];
                getDB('filepath', path, 'file', 0);
            }
        }
    });
	// Double-click play 
    $('.database').on('dblclick', '.db-song', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        //console.log('doubleclicked path = ', path);
	$.post('db/?cmd=spop-stop', {}, function(data) {}, 'json');
        getDB('addplay', path);
        notify('add', path);
    });
    
    $('.database').on('dblclick', '.db-spop', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        //console.log('doubleclicked path = ', path);
        $.post('db/?cmd=spop-playtrackuri', { 'path': path }, function(data) {}, 'json');
        notify('add', path);
    }); 
    
    $('.database').on('dblclick', '.db-other', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        //console.log('doubleclicked path = ', path);
        $.post('db/?cmd=spop-stop', {}, function(data) {}, 'json');
        getDB('addplay', path);
        notify('add', path);
    });

    // click on ADD button
    $('.database').on('click', '.db-action', function() {
        var path = $(this).parent().attr('data-path');
        var title = $(this).parent().attr('data-title');
        var artist = $(this).parent().attr('data-artist');
        var album = $(this).parent().attr('data-album');
        GUI.DBentry[0] = path;
        GUI.DBentry[3] = title;
        GUI.DBentry[4] = artist;
        GUI.DBentry[5] = album;
        // console.log('getDB path = ', GUI.DBentry);
    });

    // click search results in DB
    $('.database').on('click', '.search-results', function() {
        getDB('filepath', GUI.currentpath);
    });

    $('.context-menu a').click(function(){
        var path = GUI.DBentry[0];
        var title = GUI.DBentry[3];
        var artist = GUI.DBentry[4];
        var album = GUI.DBentry[5];
        GUI.DBentry[0] = '';
        if ($(this).data('cmd') == 'add') {
            getDB('add', path);
            notify('add', path);
        }
        if ($(this).data('cmd') == 'addplay') {
            getDB('addplay', path);
            notify('add', path);
        }
        if ($(this).data('cmd') == 'addreplaceplay') {
            getDB('addreplaceplay', path);
            notify('addreplaceplay', path);
            if (path.indexOf("/") == -1) {
	            $("#pl-saveName").val(path);
            } else {
	            $("#pl-saveName").val("");
			}
        }
        if ($(this).data('cmd') == 'update') {
            getDB('update', path);
            notify('update', path);
        }
        if ($(this).data('cmd') == 'spop-playtrackuri') {
			$.post('db/?cmd=spop-playtrackuri', { 'path': path }, function(data) {}, 'json');

        }
        if ($(this).data('cmd') == 'spop-addtrackuri') {
			$.post('db/?cmd=spop-addtrackuri', { 'path': path }, function(data) {}, 'json');

        }
        if ($(this).data('cmd') == 'spop-playplaylistindex') {
			$.post('db/?cmd=spop-playplaylistindex', { 'path': path }, function(data) {}, 'json');

        }
        if ($(this).data('cmd') == 'spop-addplaylistindex') {
			$.post('db/?cmd=spop-addplaylistindex', { 'path': path }, function(data) {}, 'json');

        }
        if ($(this).data('cmd') == 'spop-searchtitle') {
			$('#db-search-keyword').val('track:' + title);
			getDB('search', '', 'file');

        }
        if ($(this).data('cmd') == 'spop-searchartist') {
			$('#db-search-keyword').val('artist:' + artist);
			getDB('search', '', 'file');

        }
        if ($(this).data('cmd') == 'spop-searchalbum') {
			$('#db-search-keyword').val('album:' + album);
			getDB('search', '', 'file');

        }
        if ($(this).data('cmd') == 'spop-stop') {
			$.post('db/?cmd=spop-stop', {}, function(data) {}, 'json');

        }
    });

    // scroll buttons
    $('.db-firstPage').click(function(){
        $.scrollTo(0 , 500);
    });
    $('.db-prevPage').click(function(){
        var scrolloffset = '-=' + $(window).height() + 'px';
        $.scrollTo(scrolloffset , 500);
    });
    $('.db-nextPage').click(function(){
        var scrolloffset = '+=' + $(window).height() + 'px';
        $.scrollTo(scrolloffset , 500);
    });
    $('.db-lastPage').click(function(){
        $.scrollTo('100%', 500);
    });

    $('.pl-firstPage').click(function(){
        $.scrollTo(0 , 500);
    });
    $('.pl-prevPage').click(function(){
        var scrollTop = $(window).scrollTop();
        var scrolloffset = scrollTop - $(window).height();
        $.scrollTo(scrolloffset , 500);
    });
    $('.pl-nextPage').click(function(){
        var scrollTop = $(window).scrollTop();
        var scrolloffset = scrollTop + $(window).height();
        $.scrollTo(scrolloffset , 500);
    });
    $('.pl-lastPage').click(function(){
        $.scrollTo('100%', 500);
    });

    // multipurpose debug buttons
    $('#db-debug-btn').click(function(){
        var scrollTop = $(window).scrollTop();
        // console.log('scrollTop = ', scrollTop);
    });
    $('#pl-debug-btn').click(function(){
        randomScrollPL();
    });

    // open tab from external link
    var url = document.location.toString();
    if (url.match('#')) {
        $('#menu-bottom a[href=#'+url.split('#')[1]+']').tab('show') ;
    }
    // do not scroll with HTML5 history API
    $('#menu-bottom a').on('shown', function (e) {
        if(history.pushState) {
            history.pushState(null, null, e.target.hash);
        } else {
            window.location.hash = e.target.hash; //Polyfill for old browsers
        }
    });

    // playlist search
    $("#pl-filter").keyup(function(){
        $.scrollTo(0 , 500);
        var filter = $(this).val(), count = 0;
        $(".playlist li").each(function(){
            if ($(this).text().search(new RegExp(filter, "i")) < 0) {
                $(this).hide();
            } else {
                $(this).show();
                count++;
            }
        });
        var numberItems = count;
        var s = (count == 1) ? '' : 's';
        if (filter != '') {
            $('#pl-filter-results').html('<i class="fa fa-search sx"></i> ' + (+count) + ' result' + s + ' for "<em class="keyword">' + filter + '</em>"');
        } else {
            $('#pl-filter-results').html('');
        }
    });

    // tooltips
    if( $('.ttip').length ){
        $('.ttip').tooltip();
    }

});


// check active tab
(function() {
    hidden = 'hidden';
    // Standards:
    if (hidden in document)
        document.addEventListener('visibilitychange', onchange);
    else if ((hidden = 'mozHidden') in document)
        document.addEventListener('mozvisibilitychange', onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener('webkitvisibilitychange', onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener('msvisibilitychange', onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;

    function onchange (evt) {
        var v = 'visible', h = 'hidden',
            evtMap = {
                focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
            };

        evt = evt || window.event;
        if (evt.type in evtMap) {
            document.body.className = evtMap[evt.type];
            // console.log('boh? = ', evtMap[evt.type]);
        } else {
            document.body.className = this[hidden] ? 'hidden' : 'visible';
            if (this[hidden]) {
                GUI.visibility = 'hidden';
                // console.log('focus = hidden');
            } else {
                GUI.visibility = 'visible';
                // console.log('focus = visible');
            }
        }
    }
})();

