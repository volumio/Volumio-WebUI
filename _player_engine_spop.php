<?php

// Open socket
include('inc/connection.php');

if (!$spop) {
    	echo '';

} else {
		// Get the current status array
		$status = getSpopState($spop,"CurrentState");

		if ($_GET['state'] == $status['state']) {
		// If the playback state is the same as specified in the ajax call
			// Wait until the status changes and then return new status
			$status = getSpopState($spop, "NextState");

		} 

		// Return data in json format to ajax requester and close socket
		echo json_encode($status);
		closeSpopSocket($spop);

}

?>
