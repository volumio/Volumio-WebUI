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
 *  along with TsunAMP; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 *
 *	UI-design/JS code by: 	Andrea Coiutti (aka ACX)
 * PHP/JS code by:			Simone De Gregori (aka Orion)
 * 
 * file:							player_lib.php
 * version:						1.1
 *
 */
 
// Predefined daemon Response messages
define("MPD_RESPONSE_ERR", "ACK");
define("MPD_RESPONSE_OK",  "OK");

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

// v2
function openMpdSocket($host, $port) {
$sock = stream_socket_client('tcp://'.$host.':'.$port.'', $errorno, $errorstr, 30 );
$response = readMpdResponse($sock);
	if ($response = '') {
	sysCmd('command/shell.sh '.$response);
	exit;
	} else {
	return $sock;
	}
} //end openMpdSocket()

function closeMpdSocket($sock) {
sendMpdCommand($sock,"close");
fclose($sock);
}

// v2
function sendMpdCommand($sock,$cmd) {
	if ($cmd == 'cmediafix') {
		$cmd = "pause\npause\n";
		fputs($sock, $cmd);
	} else {
		$cmd = $cmd."\n";
		fputs($sock, $cmd);	
	}
}

function chainMpdCommands($sock, $commands) {
	foreach ($commands as $command) {
		fputs($sock, $command."\n");
		fflush($sock);
		// MPD seems to be disoriented when it receives several commands chained. Need to sleep a little bit
		// 200 ms
		usleep(200000);
	}
}

// v3
function readMpdResponse($sock) {
$output = "";
			while(!feof($sock)) {
				$response =  fgets($sock,1024);
				$output .= $response;
					if (strncmp(MPD_RESPONSE_OK,$response,strlen(MPD_RESPONSE_OK)) == 0) {
					break;
					}
					if (strncmp(MPD_RESPONSE_ERR,$response,strlen(MPD_RESPONSE_ERR)) == 0) {
					$output = "MPD error: $response";
					break;
					}
			}
return $output;
}

function loadAllLib($sock) {
	$flat = _loadDirForLib($sock, array(), "");
	return json_encode(_organizeJsonLib($flat));
}

function _loadDirForLib($sock, $flat, $dir) {
	sendMpdCommand($sock, "lsinfo \"".html_entity_decode($dir)."\"");
	$resp = readMpdResponse($sock);

	if (!is_null($resp)) {
		$lines = explode("\n", $resp);
		$iItem = 0;
		$skip = true;
		for ($iLine = 0; $iLine < count($lines); $iLine++) {
			list($element, $value) = explode(": ", $lines[$iLine], 2);
			if ($element == "file") {
				$skip = false;
				$iItem = count($flat);
			} else if ($element == "directory") {
				$flat = _loadDirForLib($sock, $flat, $value);
				$skip = true;
			} else if ($element == "playlist") {
				$skip = true;
			}
			if (!$skip) {
				$flat[$iItem][$element] = $value;
			}
		} 
	}
	return $flat;
}

function _organizeJsonLib($flat) {
	// Build json like "{Genre1: {Artist1: {Album1: [{song1}, {song2}], Album2:...}, Artist2:...}, Genre2:...}
	$lib = array();
	foreach ($flat as $songData) {
		$genre = $songData["Genre"] ? $songData["Genre"] : "Unknown";
		$artist = $songData["AlbumArtist"] ? $songData["AlbumArtist"] : ($songData["Artist"] ? $songData["Artist"] : "Unknown");
		$album = $songData["Album"] ? $songData["Album"] : "Unknown";

		if (!$lib[$genre]) {
			$lib[$genre] = array();
		}
		if (!$lib[$genre][$artist]) {
			$lib[$genre][$artist] = array();
		}
                if (!$lib[$genre][$artist][$album]) {
                        $lib[$genre][$artist][$album] = array();
                }
		$songDataLight = array(	"file" => $songData['file'],
					"display" => ($songData['Track'] ? $songData['Track']." - " : "")
						.$songData['Title']);
		array_push($lib[$genre][$artist][$album], $songDataLight);
	}
	return $lib;
}

function playAll($sock, $json) {
	if (count($json) > 0) {
		// Clear, add first file and play
	        $commands = array();
		array_push($commands, "clear");
		array_push($commands, "add \"".html_entity_decode($json[0]['file'])."\"");
		array_push($commands, "play");
	        chainMpdCommands($sock, $commands);

		// Then add remaining
		$commands = array();
		for ($i = 1; $i < count($json); $i++) {
	                array_push($commands, "add \"".html_entity_decode($json[$i]['file'])."\"");
	        }
	        chainMpdCommands($sock, $commands);
	}
}

function enqueueAll($sock, $json) {
	$commands = array();
        foreach ($json as $song) {
                $path = $song["file"];
		array_push($commands, "add \"".html_entity_decode($path)."\"");
        }
	chainMpdCommands($sock, $commands);
}

// v2, Does not return until a change occurs.
function sendMpdIdle($sock) {
	$response = NULL;

	// Keep putting socket into "idle" mode until the response is something other than a mixer update
	// since we don't want to update the GUI for a volume change
	while (strcmp(substr($response, 0, 14), 'changed: mixer') == 0 || $response == NULL) {
		sendMpdCommand($sock,"idle");
		$response = readMpdResponse($sock);

	}

	return true;
}

// Return state array for MPD. Does not return until a change occurs.
function monitorMpdState($sock) {
	if (sendMpdIdle($sock)) {
		$status = _parseStatusResponse(MpdStatus($sock));
		return $status;
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
		$arrayReturn["currentsong"] = $arrayResponse["title"];

	}

	if (array_key_exists("artist", $arrayResponse) == TRUE) {
		$arrayReturn["currentartist"] = $arrayResponse["artist"];

	}

	if (array_key_exists("album", $arrayResponse) == TRUE) {
		$arrayReturn["currentalbum"] = $arrayResponse["album"] . "<br />[Spotify Temporary Playback Queue]</b>";

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

		if ($nTimeElapsed != 0) {
			$nSeekPercent = round(($nTimeElapsed*100)/$nTimeTotal);

		} else {
			$nSeekPercent = 0;

		}

		$arrayReturn["song_percent"] = $nSeekPercent;
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

function getTrackInfo($sock,$songID) {
			// set currentsong, currentartis, currentalbum
			sendMpdCommand($sock,"playlistinfo ".$songID);
			$track = readMpdResponse($sock);
			return _parseFileListResponse($track);
}

function getPlayQueue($sock) {
sendMpdCommand($sock,"playlistinfo");
$playqueue = readMpdResponse($sock);
return _parseFileListResponse($playqueue);
}

function getTemplate($template) {
return str_replace("\"","\\\"",implode("",file($template)));
}

function echoTemplate($template) {
echo $template;
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

function searchDB($sock,$querytype,$query) {
	switch ($querytype) {
	case "filepath":
		if (isset($query) && !empty($query)){
		sendMpdCommand($sock,"lsinfo \"".html_entity_decode($query)."\"");
		break;
		} else {
		sendMpdCommand($sock,"lsinfo");
		break;
		}
	case "album":
	case "artist":
	case "title":
	case "file":
		sendMpdCommand($sock,"search ".$querytype." \"".html_entity_decode($query)."\"");
		//sendMpdCommand($sock,"search any \"".html_entity_decode($query)."\"");
	break;
	
	}
	
	//$response =  htmlentities(readMpdResponse($sock),ENT_XML1,'UTF-8');
	//$response = htmlspecialchars(readMpdResponse($sock));
	$response = readMpdResponse($sock);
	return _parseFileListResponse($response);
}

function remTrackQueue($sock,$songpos) {
	$datapath = findPLposPath($songpos,$sock);
	sendMpdCommand($sock,"delete ".$songpos);
	$response = readMpdResponse($sock);
	return $datapath;

}

function addQueue($sock,$path) {
	$fileext = parseFileStr($path,'.');

	if ($fileext == 'm3u' OR  $fileext == 'cue' OR $fileext == 'pls' OR strpos($path, '/') === false) {
		sendMpdCommand($sock,"load \"".html_entity_decode($path)."\"");
	} else {
		sendMpdCommand($sock,"add \"".html_entity_decode($path)."\"");
	}

	$response = readMpdResponse($sock);
	return $response;

}

function MpdStatus($sock) {
	sendMpdCommand($sock,"status");
	$status= readMpdResponse($sock);
	return $status;
}

// create JS like Timestamp
function jsTimestamp() {
	$timestamp = round(microtime(true) * 1000);
	return $timestamp;
}

function songTime($sec) {
	$minutes = sprintf('%02d', floor($sec / 60));
	$seconds = sprintf(':%02d', (int) $sec % 60);
	return $minutes.$seconds;
}

function phpVer() {
	$version = phpversion();
	return substr($version, 0, 3); 
}

// Fix session environments in PHP 5.3 (the usual WAMP of ACX...)
if (phpVer() == '5.3') {
	function session_status() {
		if (session_id()) {
		return 1;
		} else {
		return 2;
		}
	}
}

function sysCmd($syscmd) {
    exec($syscmd." 2>&1", $output);
    return $output;
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
		$arrayCurrentEntry["Type"] = "SpopTrack";
		$arrayCurrentEntry["SpopTrackUri"] = (string)$arrayResponse["tracks"][$i]["uri"];
		$arrayCurrentEntry["Title"] = $arrayResponse["tracks"][$i]["title"];
		$arrayCurrentEntry["Artist"] = $arrayResponse["tracks"][$i]["artist"];
		$arrayCurrentEntry["Album"] = $arrayResponse["tracks"][$i]["album"];

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
		$arrayRootItem["Type"] = "SpopDirectory";
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
				$arrayCurrentEntry["Type"] = "SpopTrack";
				$arrayCurrentEntry["SpopTrackUri"] = (string)$arrayResponse["tracks"][$i]["uri"];
				$arrayCurrentEntry["Title"] = $arrayResponse["tracks"][$i]["title"];
				$arrayCurrentEntry["Artist"] = $arrayResponse["tracks"][$i]["artist"];
				$arrayCurrentEntry["Album"] = $arrayResponse["tracks"][$i]["album"];
				
				array_push($arrayReturn, $arrayCurrentEntry);

				$i++;
			}

		} else if (isset($arrayResponse["playlists"])) {
		// This is a browsable listing
			$nItems = sizeof($arrayResponse["playlists"]);
			while ($i < $nItems) {
				$arrayCurrentEntry = array();
				$arrayCurrentEntry["Type"] = "SpopDirectory";
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
				$arrayCurrentEntry["DisplayName"] = $sItemDisplayName;
				array_push($arrayReturn, $arrayCurrentEntry);

				$i++;
			}

		}

	}

	return $arrayReturn;
}

// format Output for "playlist"
function _parseFileListResponse($resp) {
	if ( is_null($resp) ) {
		return NULL;

	} else {
		$plistArray = array();
		$dirArray = array();
		$plCounter = -1;
		$dirCounter = 0;
		$plistLine = strtok($resp,"\n");
		$plistFile = "";

		while ( $plistLine ) {
			list ( $element, $value ) = explode(": ",$plistLine,2);

			if ( $element == "file" OR $element == "playlist") {
				$plCounter++;
				$plistFile = $value;
				$plistArray[$plCounter]["file"] = $plistFile;
				$plistArray[$plCounter]["fileext"] = parseFileStr($plistFile,'.');
				$plistArray[$plCounter]["Type"] = "MpdFile";

			} else if ( $element == "directory") {
				$dirCounter++;
				$dirArray[$dirCounter]["directory"] = $value;
				$dirArray[$dirCounter]["Type"] = "MpdDirectory";

			} else {
				$plistArray[$plCounter][$element] = $value;
				$plistArray[$plCounter]["Time2"] = songTime($plistArray[$plCounter]["Time"]);

			}

			$plistLine = strtok("\n");

		}

	}

	return array_merge($dirArray, $plistArray);
}

// format Output for "status"
function _parseStatusResponse($resp) {
	if ( is_null($resp) ) {
		return NULL;

	} else {
		$plistArray = array();
		$plistLine = strtok($resp,"\n");
		$plistFile = "";
		$plCounter = -1;

		while ( $plistLine ) {
			list ( $element, $value ) = explode(": ",$plistLine,2);
			$plistArray[$element] = $value;
			$plistLine = strtok("\n");

		}

		// "elapsed time song_percent" added to output array
		$time = explode(":", $plistArray['time']);

		if ($time[0] != 0) {
			$percent = round(($time[0]*100)/$time[1]);

		} else {
			$percent = 0;

		}

		$plistArray["song_percent"] = $percent;
		$plistArray["elapsed"] = $time[0];
		$plistArray["time"] = $time[1];

		// "audio format" output
		$audio_format = explode(":", $plistArray['audio']);
		switch ($audio_format[0]) {
			case '48000':
			case '96000':
			case '192000':
			$plistArray['audio_sample_rate'] = rtrim(rtrim(number_format($audio_format[0]),0),',');
			break;

			case '44100':
			case '88200':
			case '176400':
			case '352800':
			$plistArray['audio_sample_rate'] = rtrim(number_format($audio_format[0],0,',','.'),0);
			break;
		}

		// format "audio_sample_depth" string
			$plistArray['audio_sample_depth'] = $audio_format[1];

		// format "audio_channels" string
			if ($audio_format[2] == "2") $plistArray['audio_channels'] = "Stereo";
			if ($audio_format[2] == "1") $plistArray['audio_channels'] = "Mono";
			if ($audio_format[2] > 2) $plistArray['audio_channels'] = "Multichannel";

	}

	return $plistArray;
}

// get file extension
function parseFileStr($strFile,$delimiter) {
	$pos = strrpos($strFile, $delimiter);
	$str = substr($strFile, $pos+1);
	return $str;

}

// cfg engine and session management
function playerSession($action,$db,$var,$value) {
	$status = session_status();

	// open new PHP SESSION
	if ($action == 'open') {
		// check the PHP SESSION status
		if($status != 2) {
			// check presence of sessionID into SQLite datastore
			//debug
			// echo "<br>---------- READ SESSION -------------<br>";
			$sessionid = playerSession('getsessionid',$db);
			if (!empty($sessionid)) {
				// echo "<br>---------- SET SESSION ID-------------<br>";
				session_id($sessionid);
				session_start();
			} else {
				session_start();
				// echo "<br>---------- STORE SESSION -------------<br>";
				playerSession('storesessionid',$db);
			}
		}
		$dbh  = cfgdb_connect($db);
		// scan cfg_engine and store values in the new session
		$params = cfgdb_read('cfg_engine',$dbh);
		foreach ($params as $row) {
		$_SESSION[$row['param']] = $row['value'];
		}
		//debug
		//print_r($_SESSION);
	// close SQLite handle
	$dbh  = null;
	}

	// unlock PHP SESSION file
	if ($action == 'unlock') {
	session_write_close();
		// if (session_write_close()) {
			// return true;
		// }
	}
	
	// unset and destroy current PHP SESSION
	if ($action == 'destroy') {
	session_unset();
		if (session_destroy()) {
		$dbh  = cfgdb_connect($db);
			if (cfgdb_update('cfg_engine',$dbh,'sessionid','')) {
			$dbh = null;
			return true;
			} else {
			echo "cannot reset session on SQLite datastore";
			return false;
			}
		}
	}
	
	// store a value in the cfgdb and in current PHP SESSION
	if ($action == 'write') {
	$_SESSION[$var] = $value;
	$dbh  = cfgdb_connect($db);
	cfgdb_update('cfg_engine',$dbh,$var,$value);
	$dbh = null;
	}
	
	// record actual PHP Session ID in SQLite datastore
	if ($action == 'storesessionid') {
	$sessionid = session_id();
	playerSession('write',$db,'sessionid',$sessionid);
	}
	
	// read PHP SESSION ID stored in SQLite datastore and use it to "attatch" the same SESSION (used in worker)
	if ($action == 'getsessionid') {
	$dbh  = cfgdb_connect($db);
	$result = cfgdb_read('cfg_engine',$dbh,'sessionid');
	$dbh = null;
	return $result['0']['value'];
	}
	
}

function cfgdb_connect($dbpath) {
    if ($dbh = new PDO($dbpath)) {
        return $dbh;
    } else {
        echo "cannot open the database";
        return false;
    }

}

function cfgdb_read($table,$dbh,$param,$id) {
	if(!isset($param)) {
	   $querystr = 'SELECT * from '.$table;
	} else if (isset($id)) {
	   $querystr = "SELECT * from ".$table." WHERE id='".$id."'";
	} else if ($param == 'mpdconf'){
	   $querystr = "SELECT param,value_player FROM cfg_mpd WHERE value_player!=''";
	} else if ($param == 'mpdconfdefault') {
        $querystr = "SELECT param,value_default FROM cfg_mpd WHERE value_default!=''";
	} else {
        $querystr = 'SELECT value from '.$table.' WHERE param="'.$param.'"';
	}
    $result = sdbquery($querystr,$dbh);
    return $result;

}

function cfgdb_update($table,$dbh,$key,$value) {
	switch ($table) {
		case 'cfg_engine':
			$querystr = "UPDATE ".$table." SET value='".$value."' where param='".$key."'";
			break;
		case 'cfg_lan':
			$querystr = "UPDATE ".$table." SET dhcp='".$value['dhcp']."', ip='".$value['ip']."', netmask='".$value['netmask']."', gw='".$value['gw']."', dns1='".$value['dns1']."', dns2='".$value['dns2']."' where name='".$value['name']."'";
			break;
		case 'cfg_mpd':
			$querystr = "UPDATE ".$table." set value_player='".$value."' where param='".$key."'";
			break;
		case 'cfg_wifisec':
			$querystr = "UPDATE ".$table." SET ssid='".$value['ssid']."', security='".$value['encryption']."', password='".$value['password']."' where id=1";
			break;
		case 'cfg_source':
			$querystr = "UPDATE ".$table." SET name='".$value['name']."', type='".$value['type']."', address='".$value['address']."', remotedir='".$value['remotedir']."', username='".$value['username']."', password='".$value['password']."', charset='".$value['charset']."', rsize='".$value['rsize']."', wsize='".$value['wsize']."', options='".$value['options']."', error='".$value['error']."' where id=".$value['id'];
			break;

	}
	//debug
	error_log(">>>>> cfgdb_update(".$table.",dbh,".$key.",".$value.") >>>>> \n".$querystr, 0);

	if (sdbquery($querystr,$dbh)) {
		return true;
	} else {
		return false;
	}

}

function cfgdb_write($table,$dbh,$values) {
	$querystr = "INSERT INTO ".$table." VALUES (NULL, ".$values.")";
	//debug
	error_log(">>>>> cfgdb_write(".$table.",dbh,".$values.") >>>>> \n".$querystr, 0);

	if (sdbquery($querystr,$dbh)) {
		return true;
	} else {
		return false;
	}
}

function cfgdb_delete($table,$dbh,$id) {
if (!isset($id)) {
$querystr = "DELETE FROM ".$table;
} else {
$querystr = "DELETE FROM ".$table." WHERE id=".$id;
}
//debug
error_log(">>>>> cfgdb_delete(".$table.",dbh,".$id.") >>>>> \n".$querystr, 0);
	if (sdbquery($querystr,$dbh)) {
	return true;
	} else {
	return false;
	}
}

function sdbquery($querystr, $dbh) {
    $query = $dbh->prepare($querystr);
    if ($query->execute()) {
        $result = array();
        $i = 0;
        foreach ($query as $value) {
            $result[$i] = $value;
            $i++;
        }
        $dbh = null;
        if (empty($result)) {
            return true;
        } else {
            return $result;
        }
    } else {
        return false;
    }
}

// Ramplay functions
function rp_checkPLid($id,$mpd) {
$_SESSION['DEBUG'] .= "rp_checkPLid:$id |";
sendMpdCommand($mpd,'playlistid '.$id);
$response = readMpdResponse($mpd);
echo "<br>debug__".$response;
echo "<br>debug__".stripos($response,'MPD error');
	if (stripos($response,'OK')) {
	return true;
	} else {
	return false;
	}
}

//## unire con findPLposPath
function rp_findPath($id,$mpd) {
//$_SESSION['DEBUG'] .= "rp_findPath:$id |";
sendMpdCommand($mpd,'playlistid '.$id);
$idinfo = _parseFileListResponse(readMpdResponse($mpd));
$path = $idinfo[0]['file'];
//$_SESSION['DEBUG'] .= "Path:$path |";
return $path;
}

//## unire con rp_findPath()
function findPLposPath($songpos,$mpd) {
//$_SESSION['DEBUG'] .= "rp_findPath:$id |";
sendMpdCommand($mpd,'playlistinfo '.$songpos);
$idinfo = _parseFileListResponse(readMpdResponse($mpd));
$path = $idinfo[0]['file'];
//$_SESSION['DEBUG'] .= "Path:$path |";
return $path;
}

function rp_deleteFile($id,$mpd) {
$_SESSION['DEBUG'] .= "rp_deleteFile:$id |";
	if (unlink(rp_findPath($id,$mpd))) {
	return true;
	} else {
	return false;
	}
}

function rp_copyFile($id,$mpd) {
$_SESSION['DEBUG'] .= "rp_copyFile: $id|";
$path = rp_findPath($id,$mpd);
$song = parseFileStr($path,"/");
$realpath = "/mnt/".$path;
$ramplaypath = "/dev/shm/".$song;
$_SESSION['DEBUG'] .= "rp_copyFilePATH: $path $ramplaypath|";
	if (copy($realpath, $ramplaypath)) {
	$_SESSION['DEBUG'] .= "rp_addPlay:$id $song $path $pos|";
	return $path;
	} else {
	return false;
	}
}

function rp_updateFolder($mpd) {
$_SESSION['DEBUG'] .= "rp_updateFolder: |";
sendMpdCommand($mpd,"update ramplay");
}

function rp_addPlay($path,$mpd,$pos) {
$song = parseFileStr($path,"/");
$ramplaypath = "ramplay/".$song;
$_SESSION['DEBUG'] .= "rp_addPlay:$id $song $path $pos|";
addQueue($mpd,$ramplaypath);
sendMpdCommand($mpd,'play '.$pos);
}

function rp_clean() {
$_SESSION['DEBUG'] .= "rp_clean: |";
recursiveDelete('/dev/shm/');
}

function recursiveDelete($str){
	if(is_file($str)){
		return @unlink($str);
		// aggiungere ricerca path in playlist e conseguente remove from playlist
	}
	elseif(is_dir($str)){
		$scan = glob(rtrim($str,'/').'/*');
		foreach($scan as $index=>$path){
			recursiveDelete($path);
		}
	}
}

function pushFile($filepath) {
	if (file_exists($filepath)) {
		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename='.basename($filepath));
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate');
		header('Pragma: public');
		header('Content-Length: ' . filesize($filepath));
		ob_clean();
		flush();
		readfile($filepath);
		return true;
	} else {
		return false;
	}
}

// check if mpd.conf or interfaces was modified outside
function hashCFG($action,$db) {
playerSession('open',$db);
	switch ($action) {
		
//		case 'check_net':
//		$hash = md5_file('/etc/network/interfaces');
//		if ($hash != $_SESSION['netconfhash']) {
//			if ($_SESSION['netconf_advanced'] != 1) {
//			playerSession('write',$db,'netconf_advanced',1); 
//			}
//		return false;
//		} else {
//			if ($_SESSION['netconf_advanced'] != 0) {
//			playerSession('write',$db,'netconf_advanced',0);
//			}
//		}
//		break;
		
//		case 'check_mpd':
//		$hash = md5_file('/etc/mpd.conf');
//		if ($hash != $_SESSION['mpdconfhash']) {
//			if ($_SESSION['mpdconf_advanced'] != 1) {
//			playerSession('write',$db,'mpdconf_advanced',1); 
//			}
//		return false;
//		} else {
//			if ($_SESSION['mpdconf_advanced'] != 0) {
//			playerSession('write',$db,'mpdconf_advanced',0); 
//			}
//		}
//		break;
		
//		case 'check_source':
//		$hash = md5_file('/etc/auto.nas');
//		if ($hash != $_SESSION['sourceconfhash']) {
//			if ($_SESSION['sourceconf_advanced'] != 1) {
//			playerSession('write',$db,'sourceconf_advanced',1); 
//			}
//		return false;
//		} else {
//			if ($_SESSION['sourceconf_advanced'] != 0) {
//			playerSession('write',$db,'sourceconf_advanced',0); 
//			}
//		}
//		break;
		
//		case 'hash_net':
//		$hash = md5_file('/etc/network/interfaces');
//		playerSession('write',$db,'netconfhash',$hash); 
//		break;
		
//		case 'hash_mpd':
//		$hash = md5_file('/etc/mpd.conf');
//		playerSession('write',$db,'mpdconfhash',$hash); 
//		break;
		
//		case 'hash_source':
//		$hash = md5_file('/etc/auto.nas');
//		playerSession('write',$db,'sourceconfhash',$hash); 
//		break;
	} 
playerSession('unlock');
return true;
}

// debug functions
function debug($input) {
session_start();
	// if $input = 1 clear SESSION debug data else load debug data into session
	if (isset($input) && $input == 1) {
	$_SESSION['debugdata'] = '';
	} else {
	$_SESSION['debugdata'] = $input;
	}
session_write_close();
}

function debug_footer($db) {
		if ($_SESSION['debug'] > 0) {
		debug_output();
		debug(1);
		echo "\n";
		echo "###### System info ######\n";
		echo  file_get_contents('/proc/version');
		echo "\n";
		echo  "system load:\t".file_get_contents('/proc/loadavg');
		echo "\n";
		echo "HW platform:\t".$_SESSION['hwplatform']." (".$_SESSION['hwplatformid'].")\n";
		echo "\n";
		echo "playerID:\t".$_SESSION['playerid']."\n";
		echo "\n";
		echo "\n";
		echo "###### Audio backend ######\n";
		echo  file_get_contents('/proc/asound/version');
		echo "\n";
		echo "Card list: (/proc/asound/cards)\n";
		echo "--------------------------------------------------\n";
		echo  file_get_contents('/proc/asound/cards');
		echo "\n";
		echo "ALSA interface #0: (/proc/asound/card0/pcm0p/info)\n";
		echo "--------------------------------------------------\n";
		echo  file_get_contents('/proc/asound/card0/pcm0p/info');
		echo "\n";
		echo "ALSA interface #1: (/proc/asound/card1/pcm0p/info)\n";
		echo "--------------------------------------------------\n";
		echo  file_get_contents('/proc/asound/card1/pcm0p/info');
		echo "\n";
		echo "interface #0 stream status: (/proc/asound/card0/stream0)\n";
		echo "--------------------------------------------------------\n";
		$streaminfo = file_get_contents('/proc/asound/card0/stream0');
		if (empty($streaminfo)) {
		echo "no stream present\n";
		} else {
		echo $streaminfo;
		}
		echo "\n";
		echo "interface #1 stream status: (/proc/asound/card1/stream0)\n";
		echo "--------------------------------------------------------\n";
		$streaminfo = file_get_contents('/proc/asound/card1/stream0');
		if (empty($streaminfo)) {
		echo "no stream present\n";
		} else {
		echo $streaminfo;
		}
		echo "\n";
		echo "\n";
		echo "###### Kernel optimization parameters ######\n";
		echo "\n";
		echo "hardware platform:\t".$_SESSION['hwplatform']."\n";
		echo "current orionprofile:\t".$_SESSION['orionprofile']."\n";
		echo "\n";
		// 		echo  "kernel scheduler for mmcblk0:\t\t".((empty(file_get_contents('/sys/block/mmcblk0/queue/scheduler'))) ? "\n" : file_get_contents('/sys/block/mmcblk0/queue/scheduler'));
		echo  "kernel scheduler for mmcblk0:\t\t".file_get_contents('/sys/block/mmcblk0/queue/scheduler');
		echo  "/proc/sys/vm/swappiness:\t\t".file_get_contents('/proc/sys/vm/swappiness');
		echo  "/proc/sys/kernel/sched_latency_ns:\t".file_get_contents('/proc/sys/kernel/sched_latency_ns');
		echo  "/proc/sys/kernel/sched_rt_period_us:\t".file_get_contents('/proc/sys/kernel/sched_rt_period_us');
		echo  "/proc/sys/kernel/sched_rt_runtime_us:\t".file_get_contents('/proc/sys/kernel/sched_rt_runtime_us');
		echo "\n";
		echo "\n";
		echo "###### Filesystem mounts ######\n";
		echo "\n";
		echo  file_get_contents('/proc/mounts');
		echo "\n";
		echo "\n";
		echo "###### mpd.conf ######\n";
		echo "\n";
		echo file_get_contents('/etc/mpd.conf');
		echo "\n";
		}
		if ($_SESSION['debug'] > 1) {
		echo "\n";
		echo "\n";
		echo "###### PHP backend ######\n";
		echo "\n";
		echo "php version:\t".phpVer()."\n";
		echo "debug level:\t".$_SESSION['debug']."\n";
		echo "\n";
		echo "\n";
		echo "###### SESSION ######\n";
		echo "\n";
		echo "STATUS:\t\t".session_status()."\n";
		echo "ID:\t\t".session_id()."\n"; 
		echo "SAVE PATH:\t".session_save_path()."\n";
		echo "\n";
		echo "\n";
		echo "###### SESSION DATA ######\n";
		echo "\n";
		print_r($_SESSION);
		}
		if ($_SESSION['debug'] > 2) {
		$connection = new pdo($db);
		$querystr="SELECT * FROM cfg_engine";
		$data['cfg_engine'] = sdbquery($querystr,$connection);
		$querystr="SELECT * FROM cfg_lan";
		$data['cfg_lan'] = sdbquery($querystr,$connection);
		$querystr="SELECT * FROM cfg_wifisec";
		$data['cfg_wifisec'] = sdbquery($querystr,$connection);
		$querystr="SELECT * FROM cfg_mpd";
		$data['cfg_mpd'] = sdbquery($querystr,$connection);
		$querystr="SELECT * FROM cfg_source";
		$data['cfg_source'] = sdbquery($querystr,$connection);
		$connection = null;
		echo "\n";
		echo "\n";
		echo "###### SQLite datastore ######\n";
		echo "\n";
		echo "\n";
		echo "### table CFG_ENGINE ###\n";
		print_r($data['cfg_engine']);
		echo "\n";
		echo "\n";
		echo "### table CFG_LAN ###\n";
		print_r($data['cfg_lan']);
		echo "\n";
		echo "\n";
		echo "### table CFG_WIFISEC ###\n";
		print_r($data['cfg_wifisec']);
		echo "\n";
		echo "\n";
		echo "### table CFG_SOURCE ###\n";
		print_r($data['cfg_source']);
		echo "\n";
		echo "\n";
		echo "### table CFG_MPD ###\n";
		print_r($data['cfg_mpd']);
		echo "\n";
		}
		if ($_SESSION['debug'] > 0) {
		echo "\n";
		printf("Page created in %.5f seconds.", (microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']));
		echo "\n";
		echo "\n";
		}
}

function debug_output($clear) {
	if (!empty($_SESSION['debugdata'])) {
	$output = print_r($_SESSION['debugdata']);
	}
echo $output;
}

function waitWorker($sleeptime,$section) {
	if ($_SESSION['w_active'] == 1) {
		do {
			sleep($sleeptime);
			session_start();
			session_write_close();
		} while ($_SESSION['w_active'] != 0);

		switch ($section) {
			case 'sources':
			$mpd = openMpdSocket('localhost', 6600);
			sendMpdCommand($mpd,'update');
			closeMpdSocket($mpd);
			break;
		}
	}
} 

// search a string in a file and replace with another string the whole line.
function wrk_replaceTextLine($file,$pos_start,$pos_stop,$strfind,$strrepl) {
	$fileData = file($file);
	$newArray = array();
	foreach($fileData as $line) {
	  // find the line that starts with $strfind (search offset $pos_start / $pos_stop)
	  if (substr($line, $pos_start, $pos_stop) == $strfind OR substr($line, $pos_start++, $pos_stop) == $strfind) {
		// replace presentation_url with current IP address
		$line = $strrepl."\n";
	  }
	  $newArray[] = $line;
	}
	return $newArray;
}

// make device TOTALBACKUP (with switch DEV copy all /etc)
function wrk_backup($bktype) {
	if ($bktype == 'dev') {
	$filepath = "/run/totalbackup_".date('Y-m-d').".tar.gz";
	$cmdstring = "tar -czf ".$filepath." /var/lib/mpd /boot/cmdline.txt /var/www /etc";
	} else {
	$filepath = "/run/backup_".date('Y-m-d').".tar.gz";
	$cmdstring = "tar -czf ".$filepath." /var/lib/mpd /etc/auto.nas /etc/mpd.conf /var/www/db/player.db";
	}
	
sysCmd($cmdstring);
return $filepath;
}

function wrk_restore($backupfile) {
$path = "/run/".$backupfile;
$cmdstring = "tar xzf ".$path." --overwrite --directory /";
	if (sysCmd($cmdstring)) {
		recursiveDelete($path);
	}
}

function wrk_jobID() {
$jobID = md5(uniqid(rand(), true));
return "job_".$jobID;
}

function wrk_checkStrSysfile($sysfile,$searchstr) {
$file = stripcslashes(file_get_contents($sysfile));
// debug
//error_log(">>>>> wrk_checkStrSysfile(".$sysfile.",".$searchstr.") >>>>> ",0);
	if (strpos($file, $searchstr)) {
	return true;
	} else {
	return false;
	}
}

function wrk_mpdconf($outpath,$db) {
// extract mpd.conf from SQLite datastore
	$dbh = cfgdb_connect($db);
	$query_cfg = "SELECT param,value_player FROM cfg_mpd WHERE value_player!=''";
	$mpdcfg = sdbquery($query_cfg,$dbh);
	$dbh = null;

	
	
// set mpd.conf file header
	$output = "###################################\n";
	$output .= "# Auto generated mpd.conf file\n";
	$output .= "# please DO NOT edit it manually!\n";
	$output .= "# Use player-UI MPD config section\n";
	$output .= "###################################\n";
	$output .= "\n";
 
// parse DB output
	foreach ($mpdcfg as $cfg) {
		if ($cfg['param'] == 'audio_output_format' && $cfg['value_player'] == 'disabled'){
		$output .= '';
		} else if ($cfg['param'] == 'dop') {
		$dop = $cfg['value_player'];
		} else if ($cfg['param'] == 'device') {
		$device = $cfg['value_player'];
		var_export($device);
		// $output .= '';
		} else if ($cfg['param'] == 'mixer_type' && $cfg['value_player'] == 'hardware' ) { 
		// $hwmixer['device'] = 'hw:0';
		$hwmixer['control'] = alsa_findHwMixerControl($device);
		// $hwmixer['index'] = '1';
		}  else {
		$output .= $cfg['param']." \t\"".$cfg['value_player']."\"\n";
		}
	}

// format audio input / output interfaces
	$output .= "max_connections \"20\"\n";
	$output .= "\n";
	$output .= "decoder {\n";
	$output .= "\t\tplugin \"ffmpeg\"\n";
	$output .= "\t\tenabled \"yes\"\n";
	$output .= "}\n";
	$output .= "\n";
	$output .= "input {\n";
	$output .= "\t\tplugin \"curl\"\n";
	$output .= "}\n";
	$output .= "\n";
	$output .= "audio_output {\n\n";
	$output .= "\t\t type \t\t\"alsa\"\n";
	$output .= "\t\t name \t\t\"Output\"\n";
	$output .= "\t\t device \t\"hw:".$device.",0\"\n";
	if (isset($hwmixer)) {
	//$output .= "\t\t mixer_device \t\"".$hwmixer['device']."\"\n";
	$output .= "\t\t mixer_control \t\"".$hwmixer['control']."\"\n";
	$output .= "\t\t mixer_device \t\"hw:".$device."\"\n";
	$output .= "\t\t mixer_index \t\"0\"\n";
	//$output .= "\t\t mixer_index \t\"".$hwmixer['index']."\"\n";
	}
	$output .= "\t\t dop \t\"".$dop."\"\n";
	$output .= "\n}\n";

// write mpd.conf file
	$fh = fopen($outpath."/mpd.conf", 'w');
	fwrite($fh, $output);
	fclose($fh);
}

function wrk_sourcemount($db,$action,$id) {
	switch ($action) {
		
		case 'mount':
			$dbh = cfgdb_connect($db);
			$mp = cfgdb_read('cfg_source',$dbh,'',$id);
			sysCmd("mkdir \"/mnt/NAS/".$mp[0]['name']."\"");
			if ($mp[0]['type'] == 'cifs') {
			// smb/cifs mount
			if (empty($mp[0]['username'])) {
			$mp[0]['username'] = 'guest';
			}
			$mountstr = "mount -t cifs \"//".$mp[0]['address']."/".$mp[0]['remotedir']."\" -o username=".$mp[0]['username'].",password=".$mp[0]['password'].",rsize=".$mp[0]['rsize'].",wsize=".$mp[0]['wsize'].",iocharset=".$mp[0]['charset'].",".$mp[0]['options']." \"/mnt/NAS/".$mp[0]['name']."\"";
			} else {
			// nfs mount
			$mountstr = "mount -t nfs -o ".$mp[0]['options']." \"".$mp[0]['address'].":/".$mp[0]['remotedir']."\" \"/mnt/NAS/".$mp[0]['name']."\"";
			}
			// debug
			error_log(">>>>> mount string >>>>> ".$mountstr,0);
			$sysoutput = sysCmd($mountstr);
			error_log(var_dump($sysoutput),0);
			if (empty($sysoutput)) {
				if (!empty($mp[0]['error'])) {
				$mp[0]['error'] = '';
				cfgdb_update('cfg_source',$dbh,'',$mp[0]);
				}
			$return = 1;
			} else {
			sysCmd("rmdir \"/mnt/NAS/".$mp[0]['name']."\"");
			$mp[0]['error'] = implode("\n",$sysoutput);
			cfgdb_update('cfg_source',$dbh,'',$mp[0]);
			$return = 0;
			}	
		break;
		
		case 'mountall':
		$dbh = cfgdb_connect($db);
		$mounts = cfgdb_read('cfg_source',$dbh);
		foreach ($mounts as $mp) {
			if (!wrk_checkStrSysfile('/proc/mounts',$mp['name']) ) {
			$return = wrk_sourcemount($db,'mount',$mp['id']);
			}
		}
		$dbh = null;
		break;
		
	}
return $return;
}

function wrk_sourcecfg($db,$queueargs) {
$action = $queueargs['mount']['action'];
unset($queueargs['mount']['action']);
	switch ($action) {

		case 'reset': 
		$dbh = cfgdb_connect($db);
		$source = cfgdb_read('cfg_source',$dbh);
			foreach ($source as $mp) {
			sysCmd("umount -f \"/mnt/NAS/".$mp['name']."\"");
			sysCmd("rmdir \"/mnt/NAS/".$mp['name']."\"");
			}
		if (cfgdb_delete('cfg_source',$dbh)) {
		$return = 1;
		} else {
		$return = 0;
		}
		$dbh = null;
		break;

		case 'add':
		$dbh = cfgdb_connect($db);
		print_r($queueargs);
		unset($queueargs['mount']['id']);
		// format values string
		foreach ($queueargs['mount'] as $key => $value) {
			if ($key == 'error') {
			$values .= "'".SQLite3::escapeString($value)."'";
			error_log(">>>>> values on line 1014 >>>>> ".$values, 0);
			} else {
			$values .= "'".SQLite3::escapeString($value)."',";
			error_log(">>>>> values on line 1016 >>>>> ".$values, 0);
			}
		}
		error_log(">>>>> values on line 1019 >>>>> ".$values, 0);
		// write new entry
		cfgdb_write('cfg_source',$dbh,$values);
		$newmountID = $dbh->lastInsertId();
		$dbh = null;
		if (wrk_sourcemount($db,'mount',$newmountID)) {
		$return = 1;
		} else {
		$return = 0;
		}
		break;
		
		case 'edit':
		$dbh = cfgdb_connect($db);
		$mp = cfgdb_read('cfg_source',$dbh,'',$queueargs['mount']['id']);
		cfgdb_update('cfg_source',$dbh,'',$queueargs['mount']);	
		sysCmd("umount -f \"/mnt/NAS/".$mp[0]['name']."\"");
			if ($mp[0]['name'] != $queueargs['mount']['name']) {
			sysCmd("rmdir \"/mnt/NAS/".$mp[0]['name']."\"");
			sysCmd("mkdir \"/mnt/NAS/".$queueargs['mount']['name']."\"");
			}
		if (wrk_sourcemount($db,'mount',$queueargs['mount']['id'])) {
		$return = 1;
		} else {
		$return = 0;
		}
		error_log(">>>>> wrk_sourcecfg(edit) exit status = >>>>> ".$return, 0);
		$dbh = null;
		break;
		
		case 'delete':
		$dbh = cfgdb_connect($db);
		$mp = cfgdb_read('cfg_source',$dbh,'',$queueargs['mount']['id']);
		sysCmd("umount -f \"/mnt/NAS/".$mp[0]['name']."\"");
		sysCmd("rmdir \"/mnt/NAS/".$mp[0]['name']."\"");
		if (cfgdb_delete('cfg_source',$dbh,$queueargs['mount']['id'])) {
		$return = 1;
		} else {
		$return = 0;
		}
		$dbh = null;
		break;
	}

return $return;
}

function wrk_getHwPlatform() {
$file = '/proc/cpuinfo';
	$fileData = file($file);
	foreach($fileData as $line) {
		if (substr($line, 0, 8) == 'Hardware') {
			$arch = trim(substr($line, 11, 50)); 
				switch($arch) {
					
					// RaspberryPi
					case 'BCM2708':
					$arch = '01';
					break;
					
					// UDOO
					case 'SECO i.Mx6 UDOO Board':
					$arch = '02';
					break;
					
					// CuBox
					case 'Marvell Dove (Flattened Device Tree)':
					$arch = '03';
					break;
					
					// BeagleBone Black
					case 'Generic AM33XX (Flattened Device Tree)':
					$arch = '04';
					break;
					
					// Compulab Utilite
					case 'Compulab CM-FX6':
					$arch = '05';
					break;
					
					// Wandboard
					case 'Freescale i.MX6 Quad/DualLite (Device Tree)':
					$arch = '06';
					break;
					
					// Cubieboard 
					case 'sun7i':
					$arch = '07';
					break;
					
					// RaspberryPi 2
					case 'BCM2709':
					$arch = '08';
					break;
					
					// Odroid C1
					case 'ODROIDC':
					$arch = '09';
					break;
					
					default:
					$arch = '--';
					break;
				}
		}
	}
if (!isset($arch)) {
$arch = '--';
}
return $arch;
}

function wrk_setHwPlatform($db) {
$arch = wrk_getHwPlatform();
$playerid = wrk_playerID($arch);
// register playerID into database
playerSession('write',$db,'playerid',$playerid);
// register platform into database
	switch($arch) {
		case '01':
		playerSession('write',$db,'hwplatform','RaspberryPi');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '02':
		playerSession('write',$db,'hwplatform','UDOO');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '03':
		playerSession('write',$db,'hwplatform','CuBox');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '04':
		playerSession('write',$db,'hwplatform','BeagleBone Black');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '05':
		playerSession('write',$db,'hwplatform','Compulab Utilite');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '06':
		playerSession('write',$db,'hwplatform','Wandboard');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '07':
		playerSession('write',$db,'hwplatform','Cubieboard');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '08':
		playerSession('write',$db,'hwplatform','RaspberryPi2');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		case '09':
		playerSession('write',$db,'hwplatform','Odroid-C1');
		playerSession('write',$db,'hwplatformid',$arch);
		break;
		
		default:
		playerSession('write',$db,'hwplatform','unknown');
		playerSession('write',$db,'hwplatformid',$arch);
		
	

	}
}

function wrk_playerID($arch) {
// $playerid = $arch.md5(uniqid(rand(), true)).md5(uniqid(rand(), true));
$playerid = $arch.md5_file('/sys/class/net/eth0/address');
return $playerid;
}

function wrk_sysChmod() {
sysCmd('chmod -R 777 /var/www/db');
sysCmd('chmod a+x /var/www/command/orion_optimize.sh');
sysCmd('chmod 777 /run');
sysCmd('chmod 777 /run/sess*');
sysCmd('chmod a+rw /etc/mpd.conf');
}

function wrk_sysEnvCheck($arch,$install) {
	if ($arch == '01' OR $arch == '02' OR $arch == '03' OR $arch == '04' OR $arch == '05' OR $arch == '06') {
	 // /etc/rc.local
//	 $a = '/etc/rc.local';
//	 $b = '/var/www/_OS_SETTINGS/etc/rc.local';
//	 if (md5_file($a) != md5_file($b)) {
//	 sysCmd('cp '.$b.' '.$a);
//	 }
	 
	 // /etc/samba/smb.conf
//	 $a = '/etc/samba/smb.conf';
//	 $b = '/var/www/_OS_SETTINGS/etc/samba/smb.conf';
//	 if (md5_file($a) != md5_file($b)) {
//	 sysCmd('cp '.$b.' '.$a.' ');
//	 }
	 // /etc/nginx.conf
	 $a = '/etc/nginx/nginx.conf';
	 $b = '/var/www/_OS_SETTINGS/etc/nginx/nginx.conf';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 // stop nginx
	 sysCmd('killall -9 nginx');
	 // start nginx
	 sysCmd('nginx');
	 }
	 // /etc/php5/cli/php.ini
	 $a = '/etc/php5/cli/php.ini';
	 $b = '/var/www/_OS_SETTINGS/etc/php5/cli/php.ini';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 $restartphp = 1;
	 }
	 // /etc/php5/fpm/php-fpm.conf
	 $a = '/etc/php5/fpm/php-fpm.conf';
	 $b = '/var/www/_OS_SETTINGS/etc/php5/fpm/php-fpm.conf';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 $restartphp = 1;
	 }
	 // /etc/php5/fpm/php.ini
	 $a = '/etc/php5/fpm/php.ini';
	 $b = '/var/www/_OS_SETTINGS/etc/php5/fpm/php.ini';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 $restartphp = 1;
	 }
	 
		if ($install == 1) {
		 // remove autoFS for NAS mount
		 sysCmd('cp /var/www/_OS_SETTINGS/etc/auto.master /etc/auto.master');
		 sysCmd('rm /etc/auto.nas');
		 sysCmd('service autofs restart');
		 // /etc/php5/mods-available/apc.ini
		 sysCmd('cp /var/www/_OS_SETTINGS/etc/php5/mods-available/apc.ini /etc/php5/mods-available/apc.ini');
		 // /etc/php5/fpm/pool.d/ erase
		 sysCmd('rm /etc/php5/fpm/pool.d/*');
		 // /etc/php5/fpm/pool.d/ copy
		 sysCmd('cp /var/www/_OS_SETTINGS/etc/php5/fpm/pool.d/* /etc/php5/fpm/pool.d/');
		 $restartphp = 1;
		}
		
	 // /etc/php5/fpm/pool.d/command.conf
	 $a = '/etc/php5/fpm/pool.d/command.conf';
	 $b = '/var/www/_OS_SETTINGS/etc/php5/fpm/pool.d/command.conf';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 $restartphp = 1;
	 }
	 // /etc/php5/fpm/pool.d/db.conf
	 $a = '/etc/php5/fpm/pool.d/db.conf';
	 $b = '/var/www/_OS_SETTINGS/etc/php5/fpm/pool.d/db.conf';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 $restartphp = 1;
	 }
	 // /etc/php5/fpm/pool.d/display.conf
	 $a = '/etc/php5/fpm/pool.d/display.conf';
	 $b = '/var/www/_OS_SETTINGS/etc/php5/fpm/pool.d/display.conf';
	 if (md5_file($a) != md5_file($b)) {
	 sysCmd('cp '.$b.' '.$a.' ');
	 $restartphp = 1;
	 }
		// (RaspberryPi arch)
//		if ($arch == '01') {
//		$a = '/boot/cmdline.txt';
//			$b = '/var/www/_OS_SETTINGS/boot/cmdline.txt';
//			if (md5_file($a) != md5_file($b)) {
//			sysCmd('cp '.$b.' '.$a.' ');
			// /etc/fstab
//			$a = '/etc/fstab';
//			$b = '/var/www/_OS_SETTINGS/etc/fstab_raspberry';
//			if (md5_file($a) != md5_file($b)) {
//				sysCmd('cp '.$b.' '.$a.' ');
//				$reboot = 1;
//				}
//			}
//		}
		if (isset($restartphp) && $restartphp == 1) {
		sysCmd('service php5-fpm restart');
		}
		if (isset($reboot) && $reboot == 1) {
		sysCmd('reboot');
		}
	}	
}


function alsa_findHwMixerControl($device) {
if (isset($_SESSION['i2s']) && $_SESSION['i2s'] == 'Hifiberryplus') {
$hwmixerdev = 'Playback Digital';
} elseif (isset($_SESSION['i2s']) && $_SESSION['i2s'] == 'Hifiberry') {
$hwmixerdev = 'Playback Digital';
} elseif (isset($_SESSION['i2s']) && $_SESSION['i2s'] == 'Iqaudio') {
$hwmixerdev = 'Playback Digital';
} else {
$cmd = "amixer -c ".$device." |grep \"mixer control\"";
$str = sysCmd($cmd);
$hwmixerdev = substr(substr($str[0], 0, -(strlen($str[0]) - strrpos($str[0], "'"))), strpos($str[0], "'")+1);
}
return $hwmixerdev;
}

function ui_notify($notify) {
$output .= "<script>";
$output .= "jQuery(document).ready(function() {";
$output .= "$.pnotify.defaults.history = false;";
$output .= "$.pnotify({";
$output .= "title: '".$notify['title']."',";
$output .= "text: '".$notify['msg']."',";
$output .= "icon: 'icon-ok',";
$output .= "opacity: .9});";
$output .= "});";
$output .= "</script>";
echo $output;
}

function ui_lastFM_coverart($artist,$album,$lastfm_apikey) {
$url = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=".$lastfm_apikey."&artist=".urlencode($artist)."&album=".urlencode($album)."&format=json";
// debug
//echo $url;
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);
$output = json_decode($output,true);
curl_close($ch);
/* debug
echo "<pre>";
print_r($output);
echo "</pre>";
echo "<br>";
*/
// key [3] == extralarge last.fm image
return $output['album']['image'][3]['#text'];
}

// ACX Functions
function sezione() {
	echo '<pre><strong>sezione</strong> = '.$GLOBALS['sezione'].'</pre>';
}

function ami($sz=null) {
	switch ($sz) {
		case 'index':
			echo (in_array($GLOBALS['sezione'], array(
				'index'
				))?'active':'');
			break;
		case 'sources':
			echo (in_array($GLOBALS['sezione'], array(
				'sources', 'sources-add', 'sources-edit'
				))?'active':'');
			break;
		case 'mpd-config':
			echo (in_array($GLOBALS['sezione'], array(
				'mpd-config'
				))?'active':'');
			break;
		case 'mpd-config-network':
			echo (in_array($GLOBALS['sezione'], array(
				'mpd-config-network'
				))?'active':'');
			break;
		case 'system':
			echo (in_array($GLOBALS['sezione'], array(
				'system'
				))?'active':'');
			break;
		case 'help':
			echo (in_array($GLOBALS['sezione'], array(
				'help'
				))?'active':'');
			break;
		case 'credits':
			echo (in_array($GLOBALS['sezione'], array(
				'credits'
				))?'active':'');
			break;
	}	
}

function current_item($sez=null) {
	echo (($GLOBALS['sezione'] == $sez)?' class="current"':'');
}
// end ACX Functions
