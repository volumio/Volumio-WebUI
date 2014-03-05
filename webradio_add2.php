<?php 
/*
 *  2013/2014 Diego Tafuto (digx)
 *		
 *
 * Created by digx on December 2013.
 * Updated ver. 1.1  January 2014 
 * for usage of dedicated Android Apps "Sound@Home"
 *
 * http://play.google.com/details?id=com.digx.soundhome
 */
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
		
	case 'addfolder':
		$foldername=$_POST['foldername'];
		$my_folder = "/var/lib/mpd/music/WEBRADIO/$foldername";
		
		if (!mkdir($my_folder, 0777)) {
            die('Failed to create folders...');
        }
    break;
		
	case 'delete':
	    $filename=$_POST['filename'];
		$my_file = "/var/lib/mpd/music/$filename";
      	

		if (!is_dir($my_file)) {
				unlink($my_file);
			}
		else {
			deleteDirectory($my_file);
			}

			
	break;
		
	
    case 'add_pl':
		$filename=$_POST['filename'];
		$data=$_POST['file_entries'];
	
		$my_file = "/var/lib/mpd/playlists/$filename";
		$handle = fopen($my_file, 'w') or die('Cannot open file:  '.$my_file); //implicitly creates file
		fwrite($handle, $data);
		fclose($handle);
			
	break;
		
	
	
	case 'addfolder_pl':
		$foldername=$_POST['foldername'];
		$my_folder = "/var/lib/mpd/playlists/$foldername";
		
		if (!mkdir($my_folder, 0777)) {
            die('Failed to create folders...');
        }
    break;
		 
	case 'delete_pl':
	    $filename=$_POST['filename'];
		$my_file = "/var/lib/mpd/playlists/$filename";
      	
		if (!is_dir($my_file)) {
				unlink($my_file);
			}
		else {
			rmdir($my_file);
			}
			
	break;	
		
	
	case 'check_wifi':
		$eth0="false";
		$output=file_get_contents('/sys/class/net/eth0/operstate');
		if ($output=="up\n")
		{
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

function deleteDirectory($dirPath) {
   
        $objects = scandir($dirPath);
        foreach ($objects as $object) {
            if ($object != "." && $object !="..") {
                if (filetype($dirPath . DIRECTORY_SEPARATOR . $object) == "dir") {
                    deleteDirectory($dirPath . DIRECTORY_SEPARATOR . $object);
                } else {
                    unlink($dirPath . DIRECTORY_SEPARATOR . $object);
                }
            }
        }
    reset($objects);
    rmdir($dirPath);
    
}


?>