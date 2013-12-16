#!/bin/bash
#
#      PlayerUI Copyright (C) 2013 Andrea Coiutti & Simone De Gregori
#		Tsunamp Team
#      http://www.tsunamp.com
#
#  This Program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 3, or (at your option)
#  any later version.
#
#  This Program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with RaspyFi; see the file COPYING.  If not, see
#  <http://www.gnu.org/licenses/>.
#
#
#	UI-design/JS code by: 	Andrea Coiutti (aka ACX)
#  PHP/JS code by:			Simone De Gregori (aka Orion)
# 
#  file:							player_wdog.sh
#  version:						1.0
#
#
#####################################
# watchdog for php5-fpm and player_wrk.php execution 
# by Orion					     													
#####################################
numproc=`pgrep -c php5-fpm`
WRKPIDFILE='/run/player_wrk.pid'
# check player_worker exec
if [[ !(-x "/var/www/command/player_wrk.php") ]]
then	
	chmod a+x /var/www/command/player_wrk.php
fi

while true 
do
 	if (($numproc > 15)); then 
		killall player_wrk.php
		rm $WRKPIDFILE > /dev/null 2>&1
		service php5-fpm restart > /dev/null 2>&1
	fi
	if ! kill -0 `cat $WRKPIDFILE` > /dev/null 2>&1; then
		rm $WRKPIDFILE > /dev/null 2>&1
			if [ "$1" == "startup" ]; then
			sleep 15
			fi
		/var/www/command/player_wrk.php > /dev/null 2>&1
	fi
    sleep 10
    numproc=`pgrep -c php5-fpm`
done
