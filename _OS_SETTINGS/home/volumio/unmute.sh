amixer scontrols | sed -e 's/^Simple mixer control//' | while read line; do
         amixer sset "$line" unmute;
done
