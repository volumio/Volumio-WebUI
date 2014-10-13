/*
 *  PlayerUI Copyright (C) 2014 Volumio
 *  http://www.volumio.org
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
 *  along with RaspyFi; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 *  Authors:
 *  - v1, 1.1: Andrea Coiutti (aka ACX)
 *  - v1, 1.1: Simone De Gregori (aka Orion)
 *  - v2: Michelangelo Guarise
 *  - v2: Joel Takvorian
 * 
 *  file:                    volumio.common-ctrl.js
 *  version:                 2
 */

jQuery(document).ready(function($){ 'use strict';

    // first connection with MPD and SPOP daemons
    mpdNotifyLoop(onMpdRefreshed, onCurrentRefreshed);
	backendRequestSpop();

    // hide "connecting" layer
    if (GUI.state !== 'disconnected') {
        $('#loader').hide();
    }

    // BUTTONS
    // ----------------------------------------------------------------------------------------------------
    // playback
    $("#play").mouseenter(function() {
        if (GUI.state == "play") {
            $("#play i").removeClass("fa fa-play").addClass("fa fa-pause");
        } else if (GUI.state == "pause") {
            $("#play i").removeClass("fa fa-pause").addClass("fa fa-play");
        }
    }).mouseleave(function() {
        if (GUI.state == "play") {
            $("#play i").removeClass("fa fa-pause").addClass("fa fa-play");
        } else if (GUI.state == "pause") {
            $("#play i").removeClass("fa fa-play").addClass("fa fa-pause");
        }
    }).click(function() {
        // Play / pause
        window.clearInterval(GUI.currentKnob);
        if (GUI.state == 'play') {
            mpdPause();
            $('#countdown-display').countdown('pause');
        } else if (GUI.state == 'pause') {
            mpdPlay();
            $('#countdown-display').countdown('resume');
        } else if (GUI.state == 'stop') {
            mpdPlay();
            $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
        }
    });

    $("#stop").click(function() {
        $(this).addClass('btn-primary');
        $('#play').removeClass('btn-primary');
        refreshTimer(0, 0, 'stop')
        window.clearInterval(GUI.currentKnob);
        $('.playlist li').removeClass('active');
        $('#total').html('');
        mpdStop();
    });

    $("#previous").click(function() {
        $('#countdown-display').countdown('pause');
        window.clearInterval(GUI.currentKnob);
        mpdPrev();
    });

    $("#next").click(function() {
        $('#countdown-display').countdown('pause');
        window.clearInterval(GUI.currentKnob);
        mpdNext();
    });
});
