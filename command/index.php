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
 * file:							command/index.php
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
			$sRawCommand = $_GET['cmd'];
			$sSpopCommand = NULL;

			if ($spop) {
			// If Spop daemon connected
				$stringSpopState = getSpopState($spop,"CurrentState")['state'];

				if (strcmp($stringSpopState, 'play') == 0 || strcmp($stringSpopState, 'pause') == 0) {
				// If spotify playback mode
					if (strcmp($sRawCommand, "previous") == 0) {
						$sSpopCommand = "prev";

					} else if (strcmp($sRawCommand, "pause") == 0) {
						$sSpopCommand = "toggle";

					} else if (strcmp(substr($sRawCommand,0,6), "random") == 0) {
						$sSpopCommand = "shuffle";

					} else if (strcmp(substr($sRawCommand,0,6), "repeat") == 0) {
						$sSpopCommand = "repeat";

					} else if (strcmp(substr($sRawCommand,0,6), "single") == 0 || strcmp(substr($sRawCommand,0,7), "consume") == 0) {
						// Ignore command since spop does not support
						$sSpopCommand = "";

					} else if (strcmp($sRawCommand, "play") == 0 || strcmp($sRawCommand, "next") == 0 || strcmp($sRawCommand, "stop") == 0 || strcmp(substr($sRawCommand,0,4), "seek") == 0) {
						$sSpopCommand = $sRawCommand;

					}

				}

			}

			if (isset($sSpopCommand)) {
			// If command is to be passed to spop
				if (strcmp($sSpopCommand,"") != 0) {
					sendSpopCommand($spop,$sSpopCommand);

				}

			} else {
			// Else pass command to MPD
				sendMpdCommand($mpd,$sRawCommand);

			}

        }

} else {
	echo 'MPD COMMAND INTERFACE<br>';
	echo 'INTERNAL USE ONLY<br>';
	echo 'hosted on raspyfi.local:82';

}

if ($mpd) {
	closeMpdSocket($mpd);

}

if ($spop) {
	closeSpopSocket($spop);

}

?>

