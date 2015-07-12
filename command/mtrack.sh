# This client sends anonymous data to developers, for analytics purposes
# Implemented using  M-Track by Massimiliano Fanciulli 
# https://github.com/fanciulli/MTrack
#

locale=EN
hw=`cat /proc/cpuinfo | grep 'Hardware' | sed -e 's/Hardware.*: //'`
osversion=1.55
appversion=1.55
uid=`cat /sys/class/net/eth0/address`

curl -X "POST" "mtrack.volumio.org:9080/api/1/hbeat/1" \
 -H "Content-Type: application/json" \
 -d $'{
  "locale": "'"$locale"'",
  "device": "'"$hw"'",
  "osversion": "'"$osversion"'",
  "appversion": "'"$appversion"'",
  "uid": "'"$uid"'"
}'
