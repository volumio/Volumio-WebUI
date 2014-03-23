echo "$(tput setaf 1)[+] Updating system...$(tput sgr 0)"
apt-get -y update
echo "$(tput setaf 1)[+] Installing Git$(tput sgr 0)"
#install git
apt-get -y install git-core

echo "$(tput setaf 1)[+] Cloning Volumio from github$(tput sgr 0)"
#git clone the Volumio-WEBUI into our nginx webserver directory
export GIT_SSL_NO_VERIFY=1
rm -rf /var/www
git clone https://github.com/volumio/Volumio-WebUI.git /var/www

echo "$(tput setaf 1)[+] Setting permissions and copying config files$(tput sgr 0)"
chmod 775 /var/www/_OS_SETTINGS/etc/rc.local
chmod 755 /var/www/_OS_SETTINGS/etc/php5/mods-available/apc.ini
chmod -R 777 /var/www/command/
chmod -R 777 /var/www/db/
chmod -R 777 /var/www/inc/

#copy relevant configuration files, preserving permissions
cp -arp /var/www/_OS_SETTINGS/etc/ /
cp -arp /var/www/_OS_SETTINGS/home/ /

#optionally remove git just to clean things up.
apt-get -y remove git-core
echo "$(tput setaf 1)[+] All done! please reboot with sudo reboot and say thanks to Ebsy$(tput sgr 0)"
