<?php
/*
 *  PlayerUI Copyright (C) 2014 Volumio Team
 *  http://www.volumio.org
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
 *  Authors:
 *  - v1: Joel Takvorian
 * 
 *  file:                    check_updates.php
 *  version:                 1
 */

include("cmn_updates.php");

global $upd_db;
$dbh = new PDO($upd_db);
if (!$dbh) {
    echo "Cannot open database";
    exit;
}

$isUpToDate = true;
$htmlReport = "<ul id='update-report' style='display: none;'>\n";

if (!hasTable($dbh, "cfg_mpd")) {
    $htmlReport .= "<li>Can't find valid database. Need to update.</li>\n";
    $isUpToDate = false;
} else if (!hasTable($dbh, "updates")) {
    $htmlReport .= "<li>Database is not ready to support incremental updates. Please update.</li>\n";
    $isUpToDate = false;
}

if ($isUpToDate) {
    // Check for update scripts
    $content = file_get_contents(ROOTPATH."updates/modules.json");
    $jsonModules = json_decode($content, true);
    foreach ($jsonModules as $module => $version) {
        // Read currently installed modules from DB
        $stmt = $dbh->prepare("SELECT version FROM updates WHERE modulename='$module' LIMIT 1");
        $stmt->execute(); 
        $installedVersion = $stmt->fetch()["version"];
        if ($installedVersion == $version) {
            $htmlReport .= "<li>Module '$module' already up to date</li>\n";
        } else {
            $isUpToDate = false;
            $htmlReport .= "<li>Module '$module' needs to be updated from version $installedVersion to $version</li>\n";
        }
    }
}

// close SQLite handle
$dbh  = null;
$htmlReport .= "</ul>";

if (!$isUpToDate) {
?>

    <script type="text/javascript">
        function showReport() {
            document.getElementById("update-report").style = "display: block;";
        }
    </script>
	
<div id="ModalStart" class="modal" tabindex="-1" role="dialog" aria-labelledby="update-modal" aria-hidden="true">
		<div class="modal-header">
		<h3 id="update-modal-label"> New Updates Available</h3>
		</div>
    <div class="modal-body">
	New Updates found on your system. Please apply them, or ignore at your own risk.
		  </div>
		  <div class="modal-footer">
			<div class="form-actions">
			<a href="index.php?skip_updates=1" class="btn btn-primary btn-large" name="save">Ignore</a>
			<a href="updates/run_updates.php" class="btn btn-large" data-dismiss="modal" aria-hidden="true">Update</a>
			
        </div>
		</div>
</div>
<?
    echo $htmlReport;
    exit;
}
?>
