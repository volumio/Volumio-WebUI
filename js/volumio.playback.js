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

jQuery(document).ready(function($) {
    'use strict';

    // INITIALIZATION
    // -----------------------------------------------------------------------------------
    // first GUI update
    updateGUI(GUI.mpd);
    mpdLsInfo(GUI.currentpath, function(data) {
        renderDir(GUI.currentpath, data, 0);
    });
    $.pnotify.defaults.history = false;

    // BUTTONS
    // -----------------------------------------------------------------------------------
    $("#repeat").click(function() {
        $(this).toggleClass('btn-primary');
        mpdRepeat($(this).hasClass('btn-primary'));
    });

    $("#random").click(function() {
        $(this).toggleClass('btn-primary');
        mpdRandom($(this).hasClass('btn-primary'));
    });

    $("#single").click(function() {
        $(this).toggleClass('btn-primary');
        mpdSingle($(this).hasClass('btn-primary'));
    });

    $("#consume").click(function() {
        $(this).toggleClass('btn-primary');
        mpdConsume($(this).hasClass('btn-primary'));
    });

    $("#volumedn").click(function() {
        changeVolume(function(vol) { return vol-1; });
    });

    $("#volumeup").click(function() {
        changeVolume(function(vol) { return vol+1; });
    });

    $("#volumemute").click(function() {
        if (GUI.volume == null ) {
            GUI.volume = $('#volume').val();
        }
        if ($('#volume').val() != 0 ) {
            GUI.volume = $('#volume').val();
            $(this).addClass('btn-primary');
            mpdVolume(0);
        } else {
            $(this).removeClass('btn-primary');
            mpdVolume(GUI.volume);
        }
    });

    // KNOBS
    // -----------------------------------------------------------------------------------
    // playback progressing
    $('.playbackknob').knob({
        inline: false,
		change : function (value) {
            if (GUI.state != 'stop') {
				window.clearInterval(GUI.currentKnob)
				//$('#time').val(value);
				// implementare comando
			} else $('#time').val(0);
        },
        release : function (value) {
			if (GUI.state != 'stop') {
				window.clearInterval(GUI.currentKnob);
				var seekto = 0;
                if (GUI.spop.state === 'play' || GUI.spop.state === 'pause') {
                    seekto = Math.floor((value * parseInt(GUI.spop.time)) / 1000);
                    spopSeek(seekto);
                } else {
                    seekto = Math.floor((value * parseInt(GUI.mpd.time)) / 1000);
                    mpdSeek(GUI.mpd.song, seekto);
                }
				$('#time').val(value);
				$('#countdown-display').countdown('destroy');
				$('#countdown-display').countdown({since: -seekto, compact: true, format: 'MS'});
			}
        },
        cancel : function () {},
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

    // PLAYLIST
    // -----------------------------------------------------------------------------------
    // click on playlist entry
    $('.playlist').on('click', '.pl-entry', function() {
        var pos = $('.playlist .pl-entry').index(this);
        mpdPlayIdx(pos);
        $('.playlist li').removeClass('active');
        $(this).parent().addClass('active');
    });

    // click on playlist actions
    $('.playlist').on('click', '.pl-action', function(event) {
        event.preventDefault();
        var pos = $('.playlist .pl-action').index(this);
        notify('remove', '');
        mpdRemoveFromQueue(pos);
    });

    // click on playlist save button
    $('#pl-controls').on('click', '#pl-btnSave', function(event) {
        var plname = $("#pl-saveName").val();
        if (plname) {
            mpdSavePlaylist(plname);
            notify('savepl', plname);
        } else {
            notify('needplname', '');
        }
    });

    // click on playlist tab
    $('#open-panel-dx a').click(function(){
        var current = parseInt(GUI.mpd.song);
        customScroll('pl', current, 200); // da eseguire sul tab ready!
    });

    // click on playback tab
    $('#open-playback a').click(function(){
        // fai qualcosa
    });


    // DATABASE
    // -----------------------------------------------------------------------------------

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
        mpdLsInfo(path, function(data) {
            renderDir(path, data, GUI.currentDBpos[GUI.currentDBpos[10]]);
        });
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
                mpdLsInfo(path, function(data) {
                    renderDir(path, data, 0);
                });
            }
        }
    });

	// Double-click play 
    $('.database').on('dblclick', '.db-song', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        mpdPlay(path);
        notify('add', path);
    });
    
    $('.database').on('dblclick', '.db-browse', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        //console.log('doubleclicked path = ', path);
        $.post('db/?cmd=spop-playtrackuri', { 'path': path }, function(data) {}, 'json');
    });
    
    $('.database').on('dblclick', '.db-other', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        //console.log('doubleclicked path = ', path);
        getDB('addplay', path);
        notify('add', path);
    });

    // click on ADD button
    $('.database').on('click', '.db-action', function() {
        GUI.menuClicked.path = $(this).parent().attr('data-path');
        GUI.menuClicked.title = $(this).parent().attr('data-title');
        GUI.menuClicked.artist = $(this).parent().attr('data-artist');
        GUI.menuClicked.album = $(this).parent().attr('data-album');
    });

    // chiudi i risultati di ricerca nel DB
    $('.database').on('click', '.search-results', function() {
        mpdLsInfo(GUI.currentpath, function(data) {
            renderDir(GUI.currentpath, data, 0);
        });
    });

    $('.context-menu a').click(function(){
        var path = GUI.menuClicked.path;
        var title = GUI.menuClicked.title;
        var artist = GUI.menuClicked.artist;
        var album = GUI.menuClicked.album;
        GUI.menuClicked.path = '';
        GUI.menuClicked.title = '';
        GUI.menuClicked.artist = '';
        GUI.menuClicked.album = '';
        if ($(this).data('cmd') == 'add') {
            mpdAdd(path);
            notify('add', path);
        }
        if ($(this).data('cmd') == 'addreplaceplay') {
            mpdPlay(path);
            notify('addreplaceplay', path);
            if (!path.contains("/")) {
	            $("#pl-saveName").val(path);
            } else {
	            $("#pl-saveName").val("");
            }
        }
        if ($(this).data('cmd') == 'update') {
            mpdUpdate(path);
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
        if ($(this).data('cmd') == 'spop-stop') {
			$.post('db/?cmd=spop-stop', {}, function(data) {}, 'json');

        }
        if ($(this).data('cmd') == 'spop-searchtitle') {
			$('#db-search-keyword').val('track:' + title);
            searchFile();
        }
        if ($(this).data('cmd') == 'spop-searchartist') {
			$('#db-search-keyword').val('artist:' + artist);
            searchFile();
        }
        if ($(this).data('cmd') == 'spop-searchalbum') {
			$('#db-search-keyword').val('album:' + album);
            searchFile();
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
    if (hidden in document) {
        document.addEventListener('visibilitychange', onchange);
    } else if ((hidden = 'mozHidden') in document) {
        document.addEventListener('mozvisibilitychange', onchange);
    } else if ((hidden = "webkitHidden") in document) {
        document.addEventListener('webkitvisibilitychange', onchange);
    } else if ((hidden = "msHidden") in document) {
        document.addEventListener('msvisibilitychange', onchange);
    // IE 9 and lower:
    } else if ('onfocusin' in document) {
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    } else {
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;
    }

    function onchange (evt) {
        var v = 'visible', h = 'hidden',
            evtMap = {
                focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
            };

        evt = evt || window.event;
        if (evt.type in evtMap) {
            document.body.className = evtMap[evt.type];
        } else {
            document.body.className = this[hidden] ? 'hidden' : 'visible';
            if (this[hidden]) {
                GUI.visibility = 'hidden';
            } else {
                GUI.visibility = 'visible';
            }
        }
    }
})();

function spopSeek(seekto) {
    // Spop expects input to seek in ms
    mpdSeek(GUI.mpd.song, seekto * 1000);
    // Spop idle mode does not detect a seek change, so update UI manually
    $.ajax({
        type : 'GET',
        url : '_player_engine_spop.php?state=manualupdate',
        async : true,
        cache : false,
        success : function(data) {
            if (data != '') {
                GUI.spop = eval('(' + data + ')');
                renderUI();
            }
        }
    });
}

function changeVolume(modFunc) {
    if (GUI.volume == null) {
        GUI.volume = $('#volume').val();
    }
    GUI.volume = modFunc(parseInt(GUI.volume));
    $('#volumemute').removeClass('btn-primary');
    mpdVolume(GUI.volume);
}

function searchFile() {
    var keyword = $('#db-search-keyword').val();
    if (keyword) {
        mpdSearch(keyword, function(data) {
            renderDir(GUI.currentpath, data, 0);
        });
    }
}

function renderDir(path, data, scrollTo, searchKeywords) {
    GUI.currentpath = path;
	var $ul = $('ul.database');
	$ul.html('');
    if (searchKeywords) {
		var nbResults = data.length || 0;
		var s = (nbResults < 2) ? '' : 's';
		var text = "" + nbResults + ' result' + s + ' for "<em class="keyword">' + searchKeywords + '</em>"';
		$("#db-back").attr("title", "Close search results and go back to the DB");
		$("#db-back-text").html(text);
		$("#db-back").show();
    } else if (path === '') {
        // Root level
        $("#db-back").hide();
        if (library && library.isEnabled && !library.displayAsTab) {
            $ul.append(pluginListItem("db-plug-lib", "LIBRARY", "fa-columns", "showLibraryView()"));
        }
	} else {
        // Subfolder
		$("#db-back").attr("title", "");
		$("#db-back-text").html("back");
		$("#db-back").show();
    }
    var dataByType = {
        mpdDir: [],
        mpdPL: [],
        mpdFile: [],
        spopRoot: [],
        spopDir: [],
        spopPL: [],
        spopTrack: []
    };
    data.forEach(function(item) {
        if (item.type === "spopTrack") {
            dataByType.spopTrack.push(item);
        } else if (item.type === "spopDirectory") {
            if (path === '') {
                dataByType.spopRoot.push(item);
            } else if (item.SpopPlaylistIndex !== undefined) {
                dataByType.spopPL.push(item);
            } else {
                dataByType.spopDir.push(item);
            }
        } else if (item.directory !== undefined) {
            dataByType.mpdDir.push(item);
        } else if (item.playlist !== undefined) {
            dataByType.mpdPL.push(item);
        } else if (item.file !== undefined) {
            dataByType.mpdFile.push(item);
        }
    });
    var idx = 1;
    dataByType.spopRoot.forEach(function(item) {
        $ul.append(renderSpopRoot(item, path, "db-" + idx));
        idx++;
    });
    dataByType.spopDir.forEach(function(item) {
        $ul.append(renderSpopDirItem(item, path, "db-" + idx));
        idx++;
    });
    dataByType.spopPL.forEach(function(item) {
        $ul.append(renderSpopPLItem(item, path, "db-" + idx));
        idx++;
    });
    dataByType.spopTrack.forEach(function(item) {
        $ul.append(renderSpopTrackItem(item, path, "db-" + idx));
        idx++;
    });
    dataByType.mpdDir.forEach(function(item) {
        $ul.append(renderSubdirItem(item, path, "db-" + idx));
        idx++;
    });
    dataByType.mpdPL.forEach(function(item) {
        item.file = item.playlist;
        $ul.append(renderFileItem(item, path, "db-" + idx));
        idx++;
    });
    dataByType.mpdFile.forEach(function(item) {
        $ul.append(renderFileItem(item, path, "db-" + idx));
        idx++;
    });
	$('#db-currentpath span').html(path);
	if (path.indexOf("WEBRADIO") >= 0) {
        $("#webradio-add").show();
	} else {
        $("#webradio-add").hide();
	}
    if (scrollTo !== 0) {
        $('#db-' + scrollTo).addClass('active');
	}
    customScroll('db', scrollTo);
}

function pluginListItem(id, text, faicon, onclick) {
    return '<li id="#' + id + '" class="db-plugin" onclick="'
        + onclick + '"><div class="db-icon db-other"><i class="fa '
        + faicon + ' icon-root sx"></i></div><div class="db-entry db-other">'
        + text + '</div></li>';
}

function renderSubdirItem(item, parentPath, itemId) {
    var iconClass = "";
    var dataTarget = "#context-menu-root";
    if (parentPath !== '') {
        iconClass = "fa fa-folder-open sx";
        dataTarget = "#context-menu";
    } else if (item.directory === 'WEBRADIO') {
        iconClass = "fa fa-microphone icon-root sx";
    } else if (item.directory === 'NAS') {
        iconClass = "fa fa-code-fork icon-root sx";
    } else if (item.directory === 'USB') {
        iconClass = "fa fa-hdd-o icon-root sx";
    } else if (item.directory === 'RAMPLAY') {
        iconClass = "fa fa-spinner icon-root sx";
    }
    return '<li id="' + itemId + '" class="clearfix" data-path="'
        + item.directory + '">'
        + '<div class="db-icon db-folder db-browse"><i class="'
        + iconClass +'"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="'
        + dataTarget + '"><i class="fa fa-reorder"></i></a></div><div class="db-entry db-folder db-browse">'
        + item.directory.replace(parentPath + '/', '');
        + '</div></li>';
}

function renderFileItem(item, sParentPath, itemId) {
    var parentPath = sParentPath;
    if (parentPath === '') {
        parentPath = retrieveParentPath(item.file)
    }
    var iconClass = "fa fa-music sx db-browse";
    var itemClass = "db-song";
    var songTime = "";
    var text = "";

    if (item.time === undefined) {
        itemClass = "db-other";
    } else {
        songTime = "<em class='songtime'>" + timeConvert(item.time) + "</em>";
    }

    if (parentPath === 'WEBRADIO') {
        iconClass = "fa fa-microphone sx db-browse";
        text = item.file.replace(parentPath + '/', '').replace('.pls', '') + songTime;
    } else if (typeof item.title !== 'undefined') {
        text = item.title + songTime + " <span>" + item.artist
            + " - " + item.album + "</span>";
    } else {
        text = item.file.replace(parentPath + '/', '') + songTime;
    }

    return '<li id="' + itemId + '" class="clearfix" data-path="' + item.file
        + '"><div class="db-icon ' + itemClass + ' db-browse"><i class="'
        + iconClass + '"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="fa fa-reorder"></i></a></div><div class="db-entry ' + itemClass + ' db-browse">'
        + text + '</div></li>';
}

function renderSpopRoot(item, sParentPath, itemId) {
    var parentPath = sParentPath;
    if (parentPath === '') {
        parentPath = retrieveParentPath(item.file)
    }
    return '<li id="' + itemId + '" class="clearfix" data-path="'
        + item.directory + '">'
        + '<div class="db-icon db-folder db-browse"><i class="fa fa-spotify icon-root sx"></i></div><div class="db-entry db-folder db-browse">'
        + item.directory.replace(parentPath + '/', '')
        + '</div></li>';
}

function renderSpopDirItem(item, sParentPath, itemId) {
    var parentPath = sParentPath;
    if (parentPath === '') {
        parentPath = retrieveParentPath(item.file)
    }
    var text = (item.displayName) ? item.displayName : item.directory.replace(parentPath + '/', '');
    return '<li id="' + itemId + '" class="clearfix" data-path="'
        + item.directory + '">'
        + '<div class="db-icon db-folder db-browse"><i class="fa fa-folder-open sx"></i></div><div class="db-entry db-folder db-browse">' + text + '</div></li>';
}

function renderSpopPLItem(item, sParentPath, itemId) {
    var parentPath = sParentPath;
    if (parentPath === '') {
        parentPath = retrieveParentPath(item.file)
    }
    var text = (item.displayName) ? item.displayName : item.directory.replace(parentPath + '/', '');
    return '<li id="' + itemId + '" class="clearfix" data-path="'
        + item.directory + '">'
        + '<div class="db-icon db-folder db-browse"><i class="fa fa-list-ol sx"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu-spotifyplaylist"><i class="fa fa-reorder"></i></a></div><div class="db-entry db-folder db-browse">' + text + '</div></li>';
}

function renderSpopTrackItem(item, sParentPath, itemId) {
    return '<li id="' + itemId + '" class="clearfix" data-path="' + item.spopTrackUri
        + '" data-artist="' + item.artist + '" data-album="' + item.album + '" data-title="' + item.title + '"><div class="db-icon db-browse"><i class="fa fa-spotify sx db-browse"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu-spotifytrack"><i class="fa fa-reorder"></i></a></div><div class="db-entry db-browse">'
        + item.title + ' <em class="songtime">' + timeConvert(item.time) + '</em> <span>'
        + item.artist + ' - ' + item.album + '</span></div></li>';
}
