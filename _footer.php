<form class="form-horizontal" action="settings.php" method="post">
	<div id="poweroff-modal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="poweroff-modal-label" aria-hidden="true">
		<div class="modal-header">
			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
			<h3 id="poweroff-modal-label">Turn off the player</h3>
		</div>
		<div class="modal-body">
			<button id="syscmd-poweroff" name="syscmd" value="poweroff" class="btn btn-primary btn-large btn-block"><i class="fa fa-power-off sx"></i> Power off</button>
			<button id="syscmd-reboot" name="syscmd" value="reboot" class="btn btn-primary btn-large btn-block"><i class="fa fa-refresh sx"></i> Reboot</button>
		</div>
		<div class="modal-footer">
			<button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
		</div>
	</div>
</form>
<form class="form-horizontal" action="" method="post">
	<div id="webradio-modal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="webradio-modal-label" aria-hidden="true">
		<div class="modal-header">
			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
			<h3 id="poweroff-modal-label">Add New WebRadio</h3>
		</div>
		<div class="modal-body">
			<form action="settings.php" method="POST">	
		<input name="radio-name" type="text" placeholder="WebRadio Name" />
		<input name="radio-url" type="text" placeholder="WebRadio URL"/>
		</form>
		</div>
		<div class="modal-footer">
			<div class="form-actions">
            <button class="btn btn-large" data-dismiss="modal" aria-hidden="true">Cancel</button>
            <button type="submit" class="btn btn-primary btn-large" name="save" value="save">Add</button>
        </div>
		</div>
	</div>
</form>

<!-- loader -->
<div id="loader"><div id="loaderbg"></div><div id="loadercontent"><i class="fa fa-refresh fa-spin"></i>connecting...</div></div>
<script src="js/jquery-1.8.2.min.js"></script>
<script src="js/jquery-ui-1.11.1.custom.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/bootstrap-select.min.js"></script>
<script src="js/notify.js"></script>
<script src="js/jquery.countdown.js"></script>
<script src="js/jquery.countdown-it.js"></script>
<script src="js/jquery.scrollTo.min.js"></script>
<script src="js/volumio.api.js"></script>
<script src="js/volumio.lazyloader.js"></script>
<script src="js/volumio.library.js"></script>

<!-- 'fixes' links to other pages so that when saved to the homescreen
     on a iOS device all the links stay within the app 
	 Note from mikelangeloz -- 
	 This breaks Dropdown menus, needs to be fixed
<script type="text/javascript" src="js/links.js"></script>
-->
<?php
if ($sezione == 'index') { ?>
	<script src="js/jquery.knob.js"></script>
	<script src="js/bootstrap-contextmenu.js"></script>
	<script src="js/jquery.pnotify.min.js"></script>
	<script src="js/volumio.playback.js"></script>
<?php } else { ?>
	<!--<script src="js/jquery.dropkick-1.0.0.js"></script>-->
	<script src="js/custom_checkbox_and_radio.js"></script>
	<script src="js/custom_radio.js"></script>
	<script src="js/jquery.tagsinput.js"></script>
	<script src="js/jquery.placeholder.js"></script>
	<script src="js/parsley.min.js"></script>
	<script src="js/i18n/_messages.en.js" type="text/javascript"></script>
	<script src="js/application.js"></script>
	<script src="js/volumio.settings.js"></script>
	<script src="js/jquery.pnotify.min.js"></script>
	<script src="js/bootstrap-fileupload.js"></script>
<?php
}
//WebRadio Add Dialog
if(isset($_POST['radio-name']) && isset($_POST['radio-url'])) {
    $url = $_POST['radio-url'];
	$name = $_POST['radio-name'];
    $ret = file_put_contents('/var/lib/mpd/music/WEBRADIO/'.$name.'.pls', $url);
	session_start();
	sendMpdCommand($mpd,'update WEBRADIO');
	// set UI notify
	$_SESSION['notify']['msg'] = 'New WebRadio Added';
	// unlock session file
	playerSession('unlock');
}
?>
<script type="text/javascript">
	setLibOptions(
		<? echo isset($_SESSION['displaylib']) && $_SESSION['displaylib'] == 1 ? 1 : 0;?>/*is enabled?*/,
		<? echo isset($_SESSION['displaylibastab']) && $_SESSION['displaylibastab'] == 1 ? 1 : 0;?>/*display as tab or in browse view?*/,
		<? echo $sezione == 'index' ? 1 : 0; ?>/*should load it?*/
	);
</script>

<!--[if lt IE 8]>
<script src="js/icon-font-ie7.js"></script>
<script src="js/icon-font-ie7-24.js"></script>
<![endif]-->

<?php
// write backend response on UI Notify popup
if (isset($_SESSION['notify']) && $_SESSION['notify'] != '') {
	sleep(1);
	ui_notify($_SESSION['notify']);
	session_start();
	$_SESSION['notify'] = '';
	session_write_close();
}
?>

<div id="debug" <?php if ($_SESSION['hiddendebug'] == 1 OR $_SESSION['debug'] == 0) {echo "class=\"hide\"";} ?>>
	<pre>
		<?php debug_footer($db); ?>
	</pre>
</div>
</body>
</html>
