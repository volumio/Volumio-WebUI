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
 * file:							plugins.php
 * version:						1.1
 *
 */
 
// common include
include('inc/connection.php');
playerSession('open',$db,'',''); 
playerSession('unlock',$db,'','');
?>

<?php 
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

// configure html select elements
$_system_select['displaylib1'] .= "<input type=\"radio\" name=\"displaylib\" id=\"toggledisplaylib1\" value=\"1\" ".(($_SESSION['displaylib'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylib0'] .= "<input type=\"radio\" name=\"displaylib\" id=\"toggledisplaylib2\" value=\"0\" ".(($_SESSION['displaylib'] == 0) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylibastab1'] .= "<input type=\"radio\" name=\"displaylibastab\" id=\"toggledisplaylibastab1\" value=\"1\" ".(($_SESSION['displaylibastab'] == 1) ? "checked=\"checked\"" : "").">\n";
$_system_select['displaylibastab0'] .= "<input type=\"radio\" name=\"displaylibastab\" id=\"toggledisplaylibastab2\" value=\"0\" ".(($_SESSION['displaylibastab'] == 0) ? "checked=\"checked\"" : "").">\n";
$_hostname = $_SESSION['hostname'];
// set template
$tpl = "plugins.html";
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

<?php include('_footer.php'); ?>
