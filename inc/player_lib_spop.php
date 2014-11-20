<?php
/*
 *      PlayerUI Copyright (C) 201 Volumio
 *      http://www.volumio.org
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
 *	Authors:     Ning-yu
 * 
 *  file:        player_lib_spop.php
 */


// Spotify daemon communication functions
function openSpopSocket($host, $portSpop) {
	$sock = stream_socket_client('tcp://'.$host.':'.$portSpop.'', $errorno, $errorstr, 30 );

	if ($sock) {
		// First response is typically "spop [version]"
		$response = fgets($sock);
	}

	return $sock;
}

function closeSpopSocket($sock) {
	sendSpopCommand($sock,"bye");
	fclose($sock);
}

function sendSpopCommand($sock, $cmd) {
	if ($sock) {
		$cmd = $cmd."\n";
		fputs($sock, $cmd);

		while(!feof($sock)) {
			// fgets() may time out during the wait for response from commands like 'idle'.
			// This loop will keep reading until a response is received, or until the socket closes.
			$output = fgets($sock);

			if ($output) {
				break;
			}
		}
		return _parseSpopResponse($output);
	}
}

// Return state array for spop daemon.
function getSpopState($sock, $mode) {
	$arrayReturn = array();

	if (strcmp($mode, "CurrentState") == 0) {
	// Return the current state array
		$arrayResponse = sendSpopCommand($sock, "status");

	} else if (strcmp($mode, "NextState") == 0) {
	// Return a state array when a change has occured
		$arrayResponse = sendSpopCommand($sock, "idle");

	}

	// Format the response to be understandable by Volumio
	if (array_key_exists("status", $arrayResponse) == TRUE) {
		if (strcmp($arrayResponse["status"], "stopped") == 0) {
			$arrayReturn["state"] = "stop";

		} else if (strcmp($arrayResponse["status"], "playing") == 0) {
			$arrayReturn["state"] = "play";

		} else if (strcmp($arrayResponse["status"], "paused") == 0) {
			$arrayReturn["state"] = "pause";

		} else {
			$arrayReturn["state"] = $arrayResponse["status"];

		}

	}

	if (array_key_exists("title", $arrayResponse) == TRUE) {
		$arrayReturn["title"] = $arrayResponse["title"];

	}

	if (array_key_exists("artist", $arrayResponse) == TRUE) {
		$arrayReturn["artist"] = $arrayResponse["artist"];

	}

	if (array_key_exists("album", $arrayResponse) == TRUE) {
		$arrayReturn["album"] = $arrayResponse["album"] . "<br />[Spotify Temporary Playback Queue]</b>";

	}

	if (array_key_exists("repeat", $arrayResponse) == TRUE) {
		if ($arrayResponse["repeat"] == TRUE) {
			$arrayReturn["repeat"] = 1;

		} else {
			$arrayReturn["repeat"] = 0;

		}

	}

	if (array_key_exists("shuffle", $arrayResponse) == TRUE) {
		if ($arrayResponse["shuffle"] == TRUE) {
			$arrayReturn["random"] = 1;

		} else {
			$arrayReturn["random"] = 0;

		}

	}

	if (array_key_exists("position", $arrayResponse) == TRUE && array_key_exists("duration", $arrayResponse) == TRUE) {
		$nTimeElapsed = round($arrayResponse["position"]);
		$nTimeTotal = round($arrayResponse["duration"] / 1000);

		$arrayReturn["elapsed"] = $nTimeElapsed;
		$arrayReturn["time"] = $nTimeTotal;

	}

	if (array_key_exists("current_track", $arrayResponse) == TRUE && array_key_exists("total_tracks", $arrayResponse) == TRUE) {
		$arrayReturn["song"] = $arrayResponse["current_track"] - 1;
		$arrayReturn["playlistlength"] = $arrayResponse["total_tracks"];

	}

	$arrayReturn["single"] = 0;
	$arrayReturn["consume"] = 0;

	return $arrayReturn;
}

// Perform Spotify database query/search
function querySpopDB($sock, $queryType, $queryString) {

	if (strcmp($queryType, "filepath") == 0) {
		return _getSpopListing($sock, $queryString);

	} else if (strcmp($queryType, "file") == 0) {
		return _searchSpopTracks($sock, $queryString);

	}

	return array();
}

function _parseSpopResponse($resp) {
	return json_decode($resp, true);
}

// Perform a Spotify search
function _searchSpopTracks($sock, $queryString) {
	$arrayReturn = array();
	$arrayResponse = sendSpopCommand($sock,"search \"" . $queryString . "\"");

	$i = 0;
	$nItems = sizeof($arrayResponse["tracks"]);
	while ($i < $nItems) {
		$arrayCurrentEntry = array();
		$arrayCurrentEntry["type"] = "spopTrack";
		$arrayCurrentEntry["spopTrackUri"] = (string)$arrayResponse["tracks"][$i]["uri"];
		$arrayCurrentEntry["title"] = $arrayResponse["tracks"][$i]["title"];
		$arrayCurrentEntry["artist"] = $arrayResponse["tracks"][$i]["artist"];
		$arrayCurrentEntry["album"] = $arrayResponse["tracks"][$i]["album"];

		array_push($arrayReturn, $arrayCurrentEntry);

		$i++;
	}

	return $arrayReturn;
}

// Make an array describing the requested level of the Spop database
function _getSpopListing($sock, $queryString) {
	$arrayReturn = array();

	if (strcmp($queryString, "") == 0) {
	// The SPOTIFY root item is requested
		$arrayRootItem = array();
		$arrayRootItem["directory"] = "SPOTIFY";
		$arrayRootItem["type"] = "spopDirectory";
		$arrayRoot = array(0 => $arrayRootItem);
		$arrayReturn = $arrayRoot;

	} else if (strncmp($queryString, "SPOTIFY", 7) == 0) {
	// Looking into the SPOTIFY folder
		$arrayResponse = sendSpopCommand($sock,"ls");
		$arrayQueryStringParts = preg_split( "(@|/)", $queryString);
		$nQueryStringParts = count($arrayQueryStringParts);
		$sCurrentDirectory = "SPOTIFY";
		$sCurrentDisplayPath = "SPOTIFY";

		$i = 1;
		while ($i < $nQueryStringParts) {
			$sCurrentDirectory = $sCurrentDirectory . "/" . $arrayQueryStringParts[$i];
			if (isset($arrayResponse["playlists"][$arrayQueryStringParts[$i]]["index"]) && $arrayResponse["playlists"][$arrayQueryStringParts[$i]]["index"] == 0) {
				$sCurrentDisplayPath = $sCurrentDisplayPath . "/" . "Starred";

			} else {
				$sCurrentDisplayPath = $sCurrentDisplayPath . "/" . $arrayResponse["playlists"][$arrayQueryStringParts[$i]]["name"];

			}

			if (strcmp($arrayResponse["playlists"][$arrayQueryStringParts[$i]]["type"], "playlist") == 0) { 
			// This is a playlist, navigate into it and stop
				$arrayResponse = sendSpopCommand($sock,"ls " . $arrayResponse["playlists"][$arrayQueryStringParts[$i]]["index"]);
				break;

			} else {
			// Index further into the directory listing
				$arrayResponse = $arrayResponse["playlists"][$arrayQueryStringParts[$i]];

			}

			$i++;
		}

		$arrayCurrentEntry = array();
		$arrayCurrentEntry["DisplayPath"] = $sCurrentDisplayPath;
		array_push($arrayReturn, $arrayCurrentEntry);

		$i = 0;
		if (isset($arrayResponse["tracks"])) { 
		// This is a tracklist within a playlist
			$nItems = sizeof($arrayResponse["tracks"]);
			while ($i < $nItems) {
				$arrayCurrentEntry = array();
				$arrayCurrentEntry["type"] = "spopTrack";
				$arrayCurrentEntry["spopTrackUri"] = (string)$arrayResponse["tracks"][$i]["uri"];
				$arrayCurrentEntry["title"] = $arrayResponse["tracks"][$i]["title"];
				$arrayCurrentEntry["artist"] = $arrayResponse["tracks"][$i]["artist"];
				$arrayCurrentEntry["album"] = $arrayResponse["tracks"][$i]["album"];
				
				array_push($arrayReturn, $arrayCurrentEntry);

				$i++;
			}

		} else if (isset($arrayResponse["playlists"])) {
		// This is a browsable listing
			$nItems = sizeof($arrayResponse["playlists"]);
			while ($i < $nItems) {
				$arrayCurrentEntry = array();
				$arrayCurrentEntry["type"] = "spopDirectory";
				$sItemDisplayName = $arrayResponse["playlists"][$i]["name"];

				if (strcmp($arrayResponse["playlists"][$i]["type"], "playlist") == 0) {
				// This is a browsable playlist
					$arrayCurrentEntry["SpopPlaylistIndex"] = $arrayResponse["playlists"][$i]["index"];
					$sItemDirectory = $sCurrentDirectory . "/" . $i . "@" . $arrayResponse["playlists"][$i]["index"];

					if ($arrayResponse["playlists"][$i]["index"] == 0) {
						$sItemDisplayName = "Starred";

					}

				} else {
				// This is a Spotify folder
					$sItemDirectory = $sCurrentDirectory . "/" . $i;

				}

				$arrayCurrentEntry["directory"] = $sItemDirectory;
				$arrayCurrentEntry["displayName"] = $sItemDisplayName;
				array_push($arrayReturn, $arrayCurrentEntry);

				$i++;
			}

		}

	}

	return $arrayReturn;
}

