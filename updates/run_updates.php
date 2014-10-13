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
 *  file:                    run_updates.php
 *  version:                 1
 */

include("cmn_updates.php");

global $upd_db;
$dbh = new PDO($upd_db);
if (!$dbh) {
    echo "Cannot open database";
    exit;
}

function log_update($str) {
    echo $str."<br/>";
}

function runSQL($fileName) {
    global $UPDATES_PATH, $dbh;
    shell_exec("$UPDATES_PATH/runSQL.sh $UPDATES_PATH/$fileName");
}

function runInitDb() {
    log_update("... Create DB file");
    runSQL("init-db.sql");
}

function runFirstUpdateDb() {
    log_update("... Run DB initial script");
    runSQL("init-db-updates.sql");
}

// Ensure DB file is present (else, create it from dump) and that it contains at least the "udpates" table (else, create it)
function checkDbSetup() {
    global $dbh;
    log_update("Checking DB...");
    if (hasTable($dbh, "cfg_mpd")) {
        // DB exists ; check for table "updates"
        if (hasTable($dbh, "updates")) {
            log_update("... DB already OK");
        } else {
            // Table doesn't exist => create it
            runFirstUpdateDb();
        }
    } else {
        // Doesn't exist => create it
        runInitDb();
    }
}

function runUpdate($name, $version) {
    global $UPDATES_PATH;
    log_update("Running update $name.$version");
    $fileSQL = "$name.$version.sql";
    $fileSH = "$UPDATES_PATH/$name.$version.sh";
    log_update("Checking SQL...");
    if (file_exists("$UPDATES_PATH/$fileSQL")) {
        log_update("... SQL file found: $fileSQL");
        runSQL($fileSQL);
    } else {
        log_update("... This update doesn't contain any SQL");
    }
    log_update("Checking shell script...");
    if (file_exists($fileSH)) {
        log_update("... Shell script found: $fileSH");
        $output = shell_exec($fileSH);
        if ($output) {
            log_update($output);
        }
    } else {
        log_update("... This update doesn't contain any shell script");
    }
}

function flagInstalled($name, $version) {
    global $dbh;
    $stmt = $dbh->prepare("REPLACE INTO updates VALUES('$name', $version)");
    $stmt->execute(); 
}

function checkForUpdates() {
    global $UPDATES_PATH, $dbh;
    // Check for update scripts
    $content = file_get_contents("$UPDATES_PATH/modules.json");
    $jsonModules = json_decode($content, true);
    foreach ($jsonModules as $name => $version) {
        $installedVersion = getVersionForModule($dbh, $name);
        if ($installedVersion < $version) {
            log_update("Module $name: latest version is $version, current version is $installedVersion");
            for ($i = $installedVersion+1; $i <= $version; $i++) {
                runUpdate($name, $i);
            }
            flagInstalled($name, $version);
        } else {
            log_update("Module $name: latest version already installed ($installedVersion)");
        }
    }
}

checkDbSetup();
checkForUpdates();

// close SQLite handle
$dbh = null;
?>

<br/><br/>Volumio has been updated. <a href='/index.php'>Click here to continue</a>.
