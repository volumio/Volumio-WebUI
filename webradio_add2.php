<?php 

// common include
include('inc/connection.php');
include('/var/www/inc/player_lib.php');
//$db = 'sqlite:/var/www/db/player.db';

playerSession('open',$db,'',''); 


if (isset($_POST['syscmd'])){
	switch ($_POST['syscmd']) {
	
	case 'add':
	$filename=$_POST['filename'];
	$radiolink=$_POST['radiolink'];
	$radioname=$_POST['radioname'];
	$my_file = "/var/lib/mpd/music/WEBRADIO/$filename";
	$handle = fopen($my_file, 'w') or die('Cannot open file:  '.$my_file); //implicitly creates file
	$data = "[playlist]\r\nnumberofentries=1\r\nFile1=$radiolink\r\nTitle1=$radioname";
	fwrite($handle, $data);
	fclose($handle);
			
		break;
		
	  case 'delete':
	    $filename=$_POST['filename'];
			$my_file = "/var/lib/mpd/music/$filename";
      unlink($my_file);
		break;
		
		
		
		
		case 'check_wifi':
		 $eth0="false";
  	 $output=file_get_contents('/sys/class/net/eth0/operstate');
     if ($output=="up\n"){
			   $eth0="true"; 
				}
	   echo $eth0;
		break;

    case 'nw_reset':
	    
			$output=sysCmd('service networking restart');
		
			echo "\nNW resetted! ".$output;

		
		break;
		


		case 'check_mixer':

		$output=file_get_contents('/etc/mpd.conf');
		$start=strrpos($output,"disabled");
		if($start===false){
			$start=strrpos($output,"software");
			 if($start===false){
			    $mixer="\"hardware\"\n";
			    echo $mixer;
		    }
		    else{
		    	 $mixer="\"software\"\n";
			    echo $mixer;
		    }
		  }
		  else{
		    	 $mixer="\"disabled\"\n";
			    echo $mixer;
		    }
		  
		   break; 
		
	}//switch

}//isset


?>