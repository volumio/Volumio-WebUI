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
 * file:							settings.php
 * version:						1.1
 *
 */
 
// common include
include('inc/connection.php');
playerSession('open',$db,'',''); 
playerSession('unlock',$db,'','');
?>

<?php 
if (isset($_POST['syscmd'])){
	switch ($_POST['syscmd']) {

	case 'reboot':
	
			if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
			// start / respawn session
			session_start();
			$_SESSION['w_queue'] = "reboot";
			$_SESSION['w_active'] = 1;
			// set UI notify
			$_SESSION['notify']['title'] = 'REBOOT';
			$_SESSION['notify']['msg'] = 'reboot player initiated...';
			// unlock session file
			playerSession('unlock');
			} else {
			echo "background worker busy";
			}
		// unlock session file
		playerSession('unlock');
		break;
		
	case 'poweroff':
	
			if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
			// start / respawn session
			session_start();
			$_SESSION['w_queue'] = "poweroff";
			$_SESSION['w_active'] = 1;
			// set UI notify
			$_SESSION['notify']['title'] = 'SHUTDOWN';
			$_SESSION['notify']['msg'] = 'shutdown player initiated...';
			// unlock session file
			playerSession('unlock');
			} else {
			echo "background worker busy";
			}
		break;

	case 'mpdrestart':
	
			if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
			// start / respawn session
			session_start();
			$_SESSION['w_queue'] = "mpdrestart";
			$_SESSION['w_active'] = 1;
			// set UI notify
			$_SESSION['notify']['title'] = 'MPD RESTART';
			$_SESSION['notify']['msg'] = 'restarting MPD daemon...';
			// unlock session file
			playerSession('unlock');
			} else {
			echo "background worker busy";
			}
		break;
	
	case 'backup':
			
			if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
			// start / respawn session
			session_start();
			$_SESSION['w_jobID'] = wrk_jobID();
			$_SESSION['w_queue'] = 'backup';
			$_SESSION['w_active'] = 1;
			playerSession('unlock');
				// wait worker response loop
				while (1) {
				sleep(2);
				session_start();
					if ( isset($_SESSION[$_SESSION['w_jobID']]) ) {
					// set UI notify
					$_SESSION['notify']['title'] = 'BACKUP';
					$_SESSION['notify']['msg'] = 'backup complete.';
					pushFile($_SESSION[$_SESSION['w_jobID']]);
					unset($_SESSION[$_SESSION['w_jobID']]);
					break;
					}
				session_write_close();
				}
			} else {
			session_start();
			$_SESSION['notify']['title'] = 'Job Failed';
			$_SESSION['notify']['msg'] = 'background worker is busy.';
			}
		// unlock session file
		playerSession('unlock');
		break;
	
	case 'updatempdDB':
		
			if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
				session_start();
				sendMpdCommand($mpd,'update');
				// set UI notify
				$_SESSION['notify']['title'] = 'MPD Update';
				$_SESSION['notify']['msg'] = 'database update started...';
				// unlock session file
				playerSession('unlock');
			} else {
				echo "background worker busy";
				playerSession('unlock');
			}
			
	break;
	
	case 'clearqueue':
			
			if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
			session_start();
			sendMpdCommand($mpd,'clear');
			// set UI notify
			$_SESSION['notify']['title'] = 'Clear Queue';
			$_SESSION['notify']['msg'] = 'Play Queue Cleared';
			// unlock session file
			playerSession('unlock');
			} else {
			echo "background worker busy";
			}
			// unlock session file
			playerSession('unlock');
	break;
		
	case 'totalbackup':
		
		break;
		
	case 'restore':
		
		break;
	
	}

}

// Show i2s selector only on RaspberryPI
$arch = wrk_getHwPlatform();
if ($arch != '01') {
    $_i2s = "class=\"hide\"";
    }
if (isset($_POST['orionprofile']) && $_POST['orionprofile'] != $_SESSION['orionprofile']){
	// load worker queue 
	if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
	// start / respawn session
	session_start();
	$_SESSION['w_queue'] = 'orionprofile';
	$_SESSION['w_queueargs'] = $_POST['orionprofile'];
	// set UI notify
	$_SESSION['notify']['title'] = 'KERNEL PROFILE';
	$_SESSION['notify']['msg'] = 'orionprofile changed <br> current profile:     <strong>'.$_POST['orionprofile']."</strong>";
	// unlock session file
	playerSession('unlock');
	} else {
	echo "background worker busy";
	}
	
	// activate worker job
	if ($_SESSION['w_lock'] != 1) {
	// start / respawn session
	session_start();
	$_SESSION['w_active'] = 1;
	// save new value on SQLite datastore
	playerSession('write',$db,'orionprofile',$_POST['orionprofile']);
	// unlock session file
	playerSession('unlock');
	} else {
	return "background worker busy";
	}

}

if (isset($_POST['cmediafix']) && $_POST['cmediafix'] != $_SESSION['cmediafix']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['cmediafix'] == 1 OR $_POST['cmediafix'] == 0) {
	playerSession('write',$db,'cmediafix',$_POST['cmediafix']);
	}
	// set UI notify
	if ($_POST['cmediafix'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'CMediaFix enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'CMediaFix disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['shairport']) && $_POST['shairport'] != $_SESSION['shairport']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['shairport'] == 1 OR $_POST['shairport'] == 0) {
	playerSession('write',$db,'shairport',$_POST['shairport']);
	}
	// set UI notify
	if ($_POST['shairport'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Airplay capability enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Airplay capability disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['upnpmpdcli']) && $_POST['upnpmpdcli'] != $_SESSION['upnpmpdcli']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['upnpmpdcli'] == 1 OR $_POST['upnpmpdcli'] == 0) {
	playerSession('write',$db,'upnpmpdcli',$_POST['upnpmpdcli']);
	}
	// set UI notify
	if ($_POST['upnpmpdcli'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'UPNP Control enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'UPNP Control disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['djmount']) && $_POST['djmount'] != $_SESSION['djmount']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['djmount'] == 1 OR $_POST['djmount'] == 0) {
	playerSession('write',$db,'djmount',$_POST['djmount']);
	}
	// set UI notify
	if ($_POST['djmount'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'UPNP\DLNA Indexing enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'UPNP\DLNA Indexing disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['minidlna']) && $_POST['minidlna'] != $_SESSION['minidlna']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['minidlna'] == 1 OR $_POST['minidlna'] == 0) {
	playerSession('write',$db,'minidlna',$_POST['minidlna']);
	}
	// set UI notify
	if ($_POST['minidlna'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'DLNA Library Server enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'DLNA Library Server disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['startupsound']) && $_POST['startupsound'] != $_SESSION['startupsound']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['startupsound'] == 1 OR $_POST['startupsound'] == 0) {
	playerSession('write',$db,'startupsound',$_POST['startupsound']);
	}
	// set UI notify
	if ($_POST['startupsound'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Startup Sound enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Startup Sound disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['hostname']) && $_POST['hostname'] != $_SESSION['hostname']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	playerSession('write',$db,'hostname',$_POST['hostname']);
	//replacing hostname with selected one. Dirty fix, avoids to set dangerous permissions to www-data
	$hfile = '/etc/hostname';
	$hn = "".$_SESSION['hostname'];
	file_put_contents($hfile, $hn);
	$hsfile = '/etc/hosts';
	$hs = "127.0.0.1       localhost        ".$_SESSION['hostname'];
	file_put_contents($hsfile, $hs);
	$_SESSION['w_queue'] = "hostname";
		$_SESSION['w_queueargs'] = $_POST['hostname'];
		// set UI notify
		$_SESSION['notify']['title'] = 'Player Name Changed';
		$_SESSION['notify']['msg'] = 'New Player Name is  '.$_POST['hostname'] ;
		// active worker queue
		$_SESSION['w_active'] = 1;
		} else {
		$_SESSION['notify']['title'] = 'Job Failed';
		$_SESSION['notify']['msg'] = 'background worker is busy.';
		// open to read and modify


	// unlock session file
	playerSession('unlock');
}


//Library Display
if (isset($_POST['displaylib']) && $_POST['displaylib'] != $_SESSION['displaylib']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['displaylib'] == 1 OR $_POST['displaylib'] == 0) {
	playerSession('write',$db,'displaylib',$_POST['displaylib']);
	}
	// set UI notify
	if ($_POST['displaylib'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Library view enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Library view disabled';
	}
	// unlock session file
	playerSession('unlock');
}

if (isset($_POST['displaylibastab']) && $_POST['displaylibastab'] != $_SESSION['displaylibastab']){
	// load worker queue 
	// start / respawn session
	session_start();
	// save new value on SQLite datastore
	if ($_POST['displaylibastab'] == 1 OR $_POST['displaylibastab'] == 0) {
	playerSession('write',$db,'displaylibastab',$_POST['displaylibastab']);
	}
	// unlock session file
	playerSession('unlock');
}

//i2s selector
if (isset($_POST['i2s']) && $_POST['i2s'] != $_SESSION['i2s']){
	switch ($_POST['i2s']) {

	case 'Hifiberry':
		session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
bcm2708_dmaengine
snd_soc_pcm5102a
snd_soc_hifiberry_dac';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'Hifiberry Driver Activated. You must reboot for changes to take effect';
	$_SESSION['w_active'] = 1;
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');
		break;
	
	case 'Hifiberryplus':
		session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
bcm2708_dmaengine
snd_soc_hifiberry_dacplus';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'Hifiberry + Driver Activated. You must reboot for changes to take effect';
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');	
		break;
		
	case 'HifiberryDigi':
			session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
bcm2708_dmaengine
snd_soc_hifiberry_digi';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'Hifiberry DIGI Driver Activated. You must reboot for changes to take effect';
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');
	break;
	
	case 'HifiberryAmp':
			session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
bcm2708_dmaengine
snd_soc_hifiberry_amp';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'Hifiberry Amp Driver Activated. You must reboot for changes to take effect';
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');
	break;
	
	case 'RpiDac':
		session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
snd_soc_bcm2708_i2s
bcm2708_dmaengine
snd_soc_pcm5102a
snd_soc_rpi_dac';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'RPi-DAC Driver Activated. You must reboot for changes to take effect';
		// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');
		break;
		
	case 'Iqaudio':
		session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
snd_soc_bcm2708_i2s
bcm2708_dmaengine
snd_soc_pcm512x
snd_soc_iqaudio_dac';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'IQaudIO Pi-DAC Driver Activated. You must reboot for changes to take effect';
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');	
		break;
		
	case 'Generic':
		session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
snd_soc_bcm2708_i2s
bcm2708_dmaengine
snd_soc_pcm512x
snd_soc_pcm512x
snd_soc_hifiberry_dac
snd_soc_rpi_dac';

	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'Generic Driver Activated. You must reboot for changes to take effect';
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');	
		break;
	
	case 'i2soff':
		session_start();
	$file = '/etc/modules';
	$text = 'snd-bcm2835';
	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'I2S Driver Deactivated. You must reboot for changes to take effect';
	// save new value on SQLite datastore
	playerSession('write',$db,'i2s',$_POST['i2s']);
	// unlock session file
	playerSession('unlock');	
		break;
}
}
//Spotify configuration File for Spop Daemon

if (isset($_POST['spotusername']) && $_POST['spotusername'] != $_SESSION['spotusername']){
	session_start();
	playerSession('write',$db,'spotusername',$_POST['spotusername']);
	$_SESSION['w_queue'] = "spotusername";
		$_SESSION['w_queueargs'] = $_POST['spotusername'];
		$_SESSION['w_active'] = 1;
		} else {
		$_SESSION['notify']['title'] = 'Job Failed';
		$_SESSION['notify']['msg'] = 'background worker is busy.';
	playerSession('unlock');
}

if (isset($_POST['spotpassword']) && $_POST['spotpassword'] != $_SESSION['spotpassword']){
	session_start();
	playerSession('write',$db,'spotpassword',$_POST['spotpassword']);
	$_SESSION['w_queue'] = "spotpassword";
		$_SESSION['w_queueargs'] = $_POST['spotpassword'];
		$_SESSION['w_active'] = 1;
		} else {
		$_SESSION['notify']['title'] = 'Job Failed';
		$_SESSION['notify']['msg'] = 'background worker is busy.';
	playerSession('unlock');
}

if (isset($_POST['spotifybitrate']) && $_POST['spotifybitrate'] != $_SESSION['spotifybitrate']){
	session_start();
	if ($_POST['spotifybitrate'] == 1 OR $_POST['spotifybitrate'] == 0) {
	playerSession('write',$db,'spotifybitrate',$_POST['spotifybitrate']);
	}
	playerSession('unlock');
}

if (isset($_POST['spotify']) && $_POST['spotify'] != $_SESSION['spotify']){
	session_start();
	if ($_POST['spotify'] == 1 OR $_POST['spotify'] == 0) {
	playerSession('write',$db,'spotify',$_POST['spotify']);
	}
	$dbh = cfgdb_connect($db);
	$query_cfg = "SELECT param,value_player FROM cfg_mpd WHERE value_player!=''";
	$mpdcfg = sdbquery($query_cfg,$dbh);
	$dbh = null;
	foreach ($mpdcfg as $cfg) {
		if ($cfg['param'] == 'audio_output_format' && $cfg['value_player'] == 'disabled'){
		$output .= '';
		} else if ($cfg['param'] == 'device') {
		$device = $cfg['value_player'];
		var_export($device);
		}  else {
		$output .= $cfg['param']." \t\"".$cfg['value_player']."\"\n";
		}
		}
	$spopconf = '/etc/spopd.conf';
	//$content .= "\t\t device \t\"hw:".$spotusername.",0\"\n";
	$content .= "[spop]"."\n";
	$content .= "spotify_username = ".$_SESSION['spotusername']."\n";
	$content .= "spotify_password = ".$_SESSION['spotpassword']."\n"; 
	$content .= "audio_output = ao"."\n"; 
	$content .= "output_name =  hw:".$device.""."\n";
	if ($_POST['spotifybitrate'] == 0) {
	$content .= "high_bitrate = false"."\n";
	}
	file_put_contents($spopconf, $content);
	$cmd = 'spopd -c /etc/spopd.conf > /dev/null 2>&1 &';
	// set UI notify
	$_SESSION['w_queue'] = "spotify";
	$_SESSION['w_queueargs'] = $_POST['spotify'];
	if ($_POST['spotify'] == 1) {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Spotify Service enabled';
	} else {
	$_SESSION['notify']['title'] = '';
	$_SESSION['notify']['msg'] = 'Spotify Service disabled';
	}
	// unlock session file
	playerSession('unlock');
}


// configure html select elements
$_system_select['orionprofile'] .= "<option value=\"default\" ".(($_SESSION['orionprofile'] == 'default') ? "selected" : "").">default</option>\n";
$_system_select['orionprofile'] .= "<option value=\"ACX\" ".(($_SESSION['orionprofile'] == 'ACX') ? "selected" : "").">ACX</option>\n";
$_system_select['orionprofile'] .= "<option value=\"Buscia\" ".(($_SESSION['orionprofile'] == 'Buscia') ? "selected" : "").">Buscia</option>\n";
$_system_select['orionprofile'] .= "<option value=\"Mike\" ".(($_SESSION['orionprofile'] == 'Mike') ? "selected" : "").">Mike</option>\n";
$_i2s['i2s'] .= "<option value=\"i2soff\" ".(($_SESSION['i2s'] == 'i2soff') ? "selected" : "").">None</option>\n";
$_i2s['i2s'] .= "<option value=\"Hifiberry\" ".(($_SESSION['i2s'] == 'Hifiberry') ? "selected" : "").">Hifiberry</option>\n";
$_i2s['i2s'] .= "<option value=\"Hifiberryplus\" ".(($_SESSION['i2s'] == 'Hifiberryplus') ? "selected" : "").">Hifiberry +</option>\n";
$_i2s['i2s'] .= "<option value=\"HifiberryDigi\" ".(($_SESSION['i2s'] == 'HifiberryDigi') ? "selected" : "").">Hifiberry Digi</option>\n";
$_i2s['i2s'] .= "<option value=\"HifiberryAmp\" ".(($_SESSION['i2s'] == 'HifiberryAmp') ? "selected" : "").">Hifiberry Amp</option>\n";
$_i2s['i2s'] .= "<option value=\"Iqaudio\" ".(($_SESSION['i2s'] == 'Iqaudio') ? "selected" : "").">IQaudIO Pi-DAC</option>\n";
$_i2s['i2s'] .= "<option value=\"RpiDac\" ".(($_SESSION['i2s'] == 'RpiDac') ? "selected" : "").">RPi-DAC</option>\n";
$_i2s['i2s'] .= "<option value=\"Generic\" ".(($_SESSION['i2s'] == 'Generic') ? "selected" : "").">Generic</option>\n";
$_system_select['orionprofile'] .= "<option value=\"Orion\" ".(($_SESSION['orionprofile'] == 'Orion') ? "selected" : "").">Orion</option>\n";
$_system_select['cmediafix1'] .= "<input type=\"radio\" name=\"cmediafix\" id=\"togglecmedia1\" value=\"1\" ".(($_SESSION['cmediafix'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['cmediafix0'] .= "<input type=\"radio\" name=\"cmediafix\" id=\"togglecmedia2\" value=\"0\" ".(($_SESSION['cmediafix'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['djmount1'] .= "<input type=\"radio\" name=\"djmount\" id=\"toggledjmount1\" value=\"1\" ".(($_SESSION['djmount'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['djmount0'] .= "<input type=\"radio\" name=\"djmount\" id=\"toggledjmount2\" value=\"0\" ".(($_SESSION['djmount'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['shairport1'] .= "<input type=\"radio\" name=\"shairport\" id=\"toggleshairport1\" value=\"1\" ".(($_SESSION['shairport'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['shairport0'] .= "<input type=\"radio\" name=\"shairport\" id=\"toggleshairport2\" value=\"0\" ".(($_SESSION['shairport'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['upnpmpdcli1'] .= "<input type=\"radio\" name=\"upnpmpdcli\" id=\"toggleupnpmpdcli1\" value=\"1\" ".(($_SESSION['upnpmpdcli'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['upnpmpdcli0'] .= "<input type=\"radio\" name=\"upnpmpdcli\" id=\"toggleupnpmpdcli2\" value=\"0\" ".(($_SESSION['upnpmpdcli'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['minidlna1'] .= "<input type=\"radio\" name=\"minidlna\" id=\"toggleminidlna1\" value=\"1\" ".(($_SESSION['minidlna'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['minidlna0'] .= "<input type=\"radio\" name=\"minidlna\" id=\"toggleminidlna2\" value=\"0\" ".(($_SESSION['minidlna'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['startupsound1'] .= "<input type=\"radio\" name=\"startupsound\" id=\"togglestartupsound1\" value=\"1\" ".(($_SESSION['startupsound'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['startupsound0'] .= "<input type=\"radio\" name=\"startupsound\" id=\"togglestartupsound2\" value=\"0\" ".(($_SESSION['startupsound'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylib1'] .= "<input type=\"radio\" name=\"displaylib\" id=\"toggledisplaylib1\" value=\"1\" ".(($_SESSION['displaylib'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylib0'] .= "<input type=\"radio\" name=\"displaylib\" id=\"toggledisplaylib2\" value=\"0\" ".(($_SESSION['displaylib'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylibastab1'] .= "<input type=\"radio\" name=\"displaylibastab\" id=\"toggledisplaylibastab1\" value=\"1\" ".(($_SESSION['displaylibastab'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylibastab0'] .= "<input type=\"radio\" name=\"displaylibastab\" id=\"toggledisplaylibastab2\" value=\"0\" ".(($_SESSION['displaylibastab'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['spotify1'] .= "<input type=\"radio\" name=\"spotify\" id=\"togglespotify1\" value=\"1\" ".(($_SESSION['spotify'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['spotify0'] .= "<input type=\"radio\" name=\"spotify\" id=\"togglespotify2\" value=\"0\" ".(($_SESSION['spotify'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['spotifybitrate1'] .= "<input type=\"radio\" name=\"spotifybitrate\" id=\"togglespotifybitrate1\" value=\"1\" ".(($_SESSION['spotifybitrate'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['spotifybitrate0'] .= "<input type=\"radio\" name=\"spotifybitrate\" id=\"togglespotifybitrate2\" value=\"0\" ".(($_SESSION['spotifybitrate'] == 0) ? "checked=\"checked\"" : "").">\n";
$_hostname = $_SESSION['hostname'];
$_spotusername = $_SESSION['spotusername'];
$_spotpassword = $_SESSION['spotpassword'];
// set template
$tpl = "settings.html";
?>

<?php
$sezione = basename(__FILE__, '.php');
include('_header.php'); 
?>

<!-- content --!>
<?php
// wait for worker output if $_SESSION['w_active'] = 1
waitWorker(1);
eval("echoTemplate(\"".getTemplate("templates/$tpl")."\");");
?>
<!-- content -->

<?php 
debug($_POST);
?>

<?php include('_footer.php'); ?>
