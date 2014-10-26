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
 * file:							index.php
 * version:						1.0
 *
 */
// common include
include('inc/connection.php');

// set template
$tpl = "indextpl.html";
$sezione = basename(__FILE__, '.php');
$_section = $sezione;
include('_header.php');
// Check updates before everything else, since if state is outdated then other parts of the webui may crash
if (!isset($_GET['skip_updates']) || $_GET['skip_updates'] != '1') {
    include('updates/check_updates.php');
}

playerSession('open',$db,'','');
playerSession('unlock',$db,'','');

// set template
$tpl = "indextpl.html";
?>
<!-- content --!>
<?php
eval("echoTemplate(\"".getTemplate("templates/$tpl")."\");");
?>
<!-- content -->
<?php
//generic functions in home
if (isset($_POST['syscmd'])) {
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
}
?>

<?php include('_footer.php'); ?>
