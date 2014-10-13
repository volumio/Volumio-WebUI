<?php
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
 *  along with RaspyFi; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 *
 *	UI-design/JS code by: 	Andrea Coiutti (aka ACX)
 * PHP/JS code by:			Simone De Gregori (aka Orion)
 * 
 * file:							db/index.php
 * version:						1.0
 *
 */

// common include
include('../inc/connection.php');
error_reporting(ERRORLEVEL);

if (isset($_GET['cmd']) && $_GET['cmd'] != '') {

    if ( !$mpd ) {
        echo 'Error Connecting to MPD daemon ';
    } else {
        switch ($_GET['cmd']) {
            case 'filepath':
                if ($spop) {
                    $query = "";
                    if (isset($_POST['path']) && $_POST['path'] != ''
                       && strcmp(substr($_POST['path'],0,7),"SPOTIFY") == 0) {
                        $query = $_POST['path'];
                    }
                    $arraySpopSearchResults = querySpopDB($spop, 'filepath', $query);
                    echo json_encode($arraySpopSearchResults);
                }
                break;

            case 'playlist':
                echo json_encode(getPlayQueue($mpd));
                break;

            case 'search':
                if ($spop && isset($_POST['query']) && $_POST['query'] != '' && isset($_GET['querytype']) && $_GET['querytype'] != '') {
                    $arraySpopSearchResults = querySpopDB($spop, 'file', $_POST['query']);
                    echo json_encode($arraySearchResults);
                }
                break;

            case 'spop-playtrackuri':
                if (isset($_POST['path']) && $_POST['path'] != '') {
                    sendMpdCommand($mpd,'stop');
                    echo sendSpopCommand($spop, "uplay " . $_POST['path']);
                }
                break;

            case 'spop-addtrackuri':
                if (isset($_POST['path']) && $_POST['path'] != '') {
                    echo sendSpopCommand($spop, "uadd " . $_POST['path']);
                }
                break;

            case 'spop-playplaylistindex':
                if (isset($_POST['path']) && $_POST['path'] != '') {
                    $sSpopPlaylistIndex = end(explode("@", $_POST['path']));
                    sendMpdCommand($mpd,'stop');
                    echo sendSpopCommand($spop, "play " . $sSpopPlaylistIndex);
                }
                break;

            case 'spop-addplaylistindex':
                if (isset($_POST['path']) && $_POST['path'] != '') {
                    $sSpopPlaylistIndex = end(explode("@", $_POST['path']));
                    echo sendSpopCommand($spop, "add " . $sSpopPlaylistIndex);
                }
                break;
        }
    }
} else {
    echo 'MPD DB INTERFACE<br>';
    echo 'INTERNAL USE ONLY<br>';
    echo 'hosted on raspyfi.local:81';
}

if ($mpd) {
	closeMpdSocket($mpd);
}

if ($spop) {
	closeSpopSocket($spop);
}
?>

