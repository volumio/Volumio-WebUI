#!/usr/bin/python

import os.path
import subprocess
import sqlite3
import json

# Constants
DB_FILE = "/var/www/db/player.db"
UPDATES_PATH = "/var/www/updates/"

def cmdShell(cmd):
    print cmd
    subprocess.call(cmd)

def runSQL(fileName):
    global UPDATES_PATH
    cmdShell(["%srunSQL.sh" % UPDATES_PATH, "%s%s" % (UPDATES_PATH, fileName)])

def runInitDb():
    global DB_FILE, UPDATES_PATH
    print "... Create DB file"
    runSQL("init-db.sql")
    cmdShell(["chmod", "a+w", DB_FILE])

def runFirstUpdateDb():
    print "... Run DB initial script"
    runSQL("init-db-updates.sql")

# Ensure DB file is present (else, create it from dump) and that it contains at least the "udpates" table (else, create it)
def checkDbSetup():
    global DB_FILE

    print "Checking DB..."
    if os.path.isfile(DB_FILE):
        db = sqlite3.connect(DB_FILE)
        cursor = db.cursor()
        # DB exists ; check for table "updates"
        cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='table' and name='updates'")
        if cursor.fetchone()[0] == 0:
            # Table doesn't exist => create it
            runFirstUpdateDb()
        else:
            print "... DB already OK"
        db.close()
    else:
        # Doesn't exist => create it
        runInitDb()

def getVersionForModule(dbCursor, name):
    dbCursor.execute("SELECT version FROM updates WHERE modulename=?", (name,))
    result = dbCursor.fetchone()
    if result:
        return result[0]
    else:
        return 0

def runUpdate(name, version):
    global UPDATES_PATH
    print "Running update %s.%d" % (name, version)
    fileSQL = "%s.%d.sql" % (name, version)
    fileSH = "%s%s.%d.sh" % (UPDATES_PATH, name, version)
    print "Checking SQL..."
    if os.path.isfile("%s%s" % (UPDATES_PATH, fileSQL)):
        print "... SQL file found: %s" % fileSQL
        runSQL(fileSQL)
    else:
        print "... No SQL"
    print "Checking shell script..."
    if os.path.isfile(fileSH):
        print "... Shell script found: %s" % fileSH
        cmdShell([fileSH])
    else:
        print "... No shell script"

def flagInstalled(dbCursor, name, version):
    dbCursor.execute("REPLACE INTO updates VALUES(?,?)", (name,version,))

def checkForUpdates():
    global DB_FILE
    modules = open('modules.json')
    jsonModules = json.load(modules)
    db = sqlite3.connect(DB_FILE)
    cursor = db.cursor()
    for name in jsonModules:
        version = jsonModules[name]
        installedVersion = getVersionForModule(cursor, name)
        print "Module %s: latest version is %d, current version is %d" % (name, version, installedVersion)
        if installedVersion < version:
            for i in range(installedVersion, version):
                runUpdate(name, i+1)
            flagInstalled(cursor, name, version)
            db.commit()
    db.close()
    modules.close()

checkDbSetup()
checkForUpdates()

