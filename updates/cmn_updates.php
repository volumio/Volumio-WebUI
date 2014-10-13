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
 *  file:                    cmn_updates.php
 *  version:                 1
 */

$UPDATES_PATH = $_SERVER['HOME']."/updates";

$upd_dbFile = $_SERVER['HOME']."/db/player.db";
$upd_db = 'sqlite:'.$upd_dbFile;
chmod($upd_dbFile, 0777);

function execSQL($dbh, $sql) {
    if (!($stmt = $dbh->prepare($sql))) {
        print("Bad SQL: ");
        print_r($dbh->errorInfo());
        print("<br/>");
    }
    if (!$stmt->execute()) {
        print("SQL exec failed: ");
        print_r($stmt->errorInfo());
        print("<br/>");
    }
    return $stmt;
}

function hasTable($dbh, $table) {
    $stmt = execSQL($dbh, "SELECT count(*) as has_table FROM sqlite_master WHERE type='table' and name='$table'");
    return ($stmt->fetch()["has_table"] > 0);
}

function getVersionForModule($dbh, $name) {
    $stmt = execSQL($dbh, "SELECT version FROM updates WHERE modulename='$name'");
    $row = $stmt->fetch();
    if ($row) {
        return $row["version"];
    } else {
        return 0;
    }
}

?>
