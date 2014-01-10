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
			
			if ( !$mpd) {
				session_start();
				$_SESSION['notify']['title'] = 'Error';
				$_SESSION['notify']['msg'] = 'Cannot connect to MPD Daemon';
			} else {
				sendMpdCommand($mpd,'update');
				session_start();
				$_SESSION['notify']['title'] = 'MPD Update';
				$_SESSION['notify']['msg'] = 'database update started...';
			}
			
	break;
		
	case 'totalbackup':
		
		break;
		
	case 'restore':
		
		break;
	case 'i2son':
	
		session_start();
	$file = '/etc/modules';
	$text = 'snd_soc_bcm2708
snd_soc_bcm2708_i2s
bcm2708_dmaengine
snd_soc_pcm5102a
snd_soc_hifiberry_dac
snd_soc_rpi_dac';

	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'I2S Driver Activated. You must reboot for changes to take effect';
		break;
	case 'i2soff':
	
		session_start();
	$file = '/etc/modules';
	$text = 'snd-bcm2835';

	file_put_contents($file, $text);
	$_SESSION['notify']['msg'] = 'I2S Driver Deactivated. You must reboot for changes to take effect';
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


// configure html select elements
$_system_select['orionprofile'] .= "<option value=\"default\" ".(($_SESSION['orionprofile'] == 'default') ? "selected" : "").">default</option>\n";
$_system_select['orionprofile'] .= "<option value=\"ACX\" ".(($_SESSION['orionprofile'] == 'ACX') ? "selected" : "").">ACX</option>\n";
$_system_select['orionprofile'] .= "<option value=\"Buscia\" ".(($_SESSION['orionprofile'] == 'Buscia') ? "selected" : "").">Buscia</option>\n";
$_system_select['orionprofile'] .= "<option value=\"Mike\" ".(($_SESSION['orionprofile'] == 'Mike') ? "selected" : "").">Mike</option>\n";
$_system_select['orionprofile'] .= "<option value=\"Orion\" ".(($_SESSION['orionprofile'] == 'Orion') ? "selected" : "").">Orion</option>\n";
$_system_select['cmediafix1'] .= "<input type=\"radio\" name=\"cmediafix\" id=\"toggleOption1\" value=\"1\" ".(($_SESSION['cmediafix'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['cmediafix0'] .= "<input type=\"radio\" name=\"cmediafix\" id=\"toggleOption2\" value=\"0\" ".(($_SESSION['cmediafix'] == 0) ? "checked=\"checked\"" : "").">\n";

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
