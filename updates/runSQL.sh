#!/bin/bash

cat $1 | sqlite3 /var/www/db/player.db

