PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE cfg_wifisec (
id INTEGER PRIMARY KEY,
ssid CHAR(50),
security CHAR(50),
password CHAR(50)
);
INSERT INTO "cfg_wifisec" VALUES(1,'','','');
CREATE TABLE cfg_mpd (
id INTEGER PRIMARY KEY,
section CHAR(20),
param CHAR(20),
value CHAR(100),
description TEXT
, value_player char(200), value_default char(200), example char(200));
INSERT INTO "cfg_mpd" VALUES(1,'required_parameters','follow_outside_symlinks','__yes or no__','Control if MPD will follow symbolic links pointing outside the music dir. You must recreate the database after changing this option. The default is "yes"','yes','yes',NULL);
INSERT INTO "cfg_mpd" VALUES(2,'required_parameters','follow_inside_symlinks','__yes or no__','Control if MPD will follow symbolic links pointing inside the music dir, potentially adding duplicates to the database. You must recreate the database after changing this option. The default is "yes"','yes','yes',NULL);
INSERT INTO "cfg_mpd" VALUES(3,'required_parameters','db_file','__file__','This specifies where the db file will be stored','/var/lib/mpd/tag_cache','/var/lib/mpd/tag_cache',NULL);
INSERT INTO "cfg_mpd" VALUES(4,'required_parameters','sticker_file','__file__','The location of the sticker database. This is a database which manages dynamic information attached to songs','/var/lib/mpd/sticker.sql','/var/lib/mpd/sticker.sql',NULL);
INSERT INTO "cfg_mpd" VALUES(5,'required_parameters','log_file','__file__','This specifies where the log file should be located. The special value "syslog" makes MPD use the local syslog daemon','/var/log/mpd/mpd.log','/var/log/mpd/mpd.log',NULL);
INSERT INTO "cfg_mpd" VALUES(6,'optional_parameters','pid_file','__file__','This specifies the file to save mpd process ID in','/var/run/mpd/pid','/var/run/mpd/pid',NULL);
INSERT INTO "cfg_mpd" VALUES(7,'optional_parameters','music_directory','__directory__','This specifies the directory where music is located. If you do not configure this, you can only play streams','/var/lib/mpd/music','/var/lib/mpd/music',NULL);
INSERT INTO "cfg_mpd" VALUES(8,'optional_parameters','playlist_directory','__directory__','This specifies the directory where saved playlists are stored. If you do not configure this, you cannot save playlists','/var/lib/mpd/playlists','/var/lib/mpd/playlists',NULL);
INSERT INTO "cfg_mpd" VALUES(9,'optional_parameters','state_file','__file__','This specifies if a state file is used and where it is located. The state of mpd will be saved to this file when mpd is terminated by a TERM signal or by the "kill" command. When mpd is restarted, it will read the state file and restore the state of mpd (including the playlist)','/var/lib/mpd/state','/var/lib/mpd/state',NULL);
INSERT INTO "cfg_mpd" VALUES(10,'optional_parameters','user','__username__','This specifies the user that MPD will run as, if set. MPD should never run as root, and you may use this option to make MPD change its user id after initialization. Do not use this option if you start MPD as an unprivileged user','mpd','mpd',NULL);
INSERT INTO "cfg_mpd" VALUES(11,'optional_parameters','bind_to_address','__ip address or hostname or any__','This specifies which address mpd binds to and listens on. Multiple bind_to_address parameters may be specified. The default is "any", which binds to all available addresses. To bind to a Unix domain socket, specify an absolute path. For a system-wide MPD, we suggest the path "/var/run/mpd/socket"','any','any',NULL);
INSERT INTO "cfg_mpd" VALUES(12,'optional_parameters','port','__port__','This specifies the port that mpd listens on. The default is 6600','6600','6600',NULL);
INSERT INTO "cfg_mpd" VALUES(13,'optional_parameters','log_level','__default, secure, or verbose__','This specifies how verbose logs are. "default" is minimal logging, "secure" reports from what address a connection is opened, and when it is closed, and "verbose" records excessive amounts of information for debugging purposes. The default is "default"','',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(14,'optional_parameters','zeroconf_enabled','__yes or no__','If yes, and MPD has been compiled with support for Avahi or Bonjour, service information will be published with Zeroconf. The default is yes','yes','yes',NULL);
INSERT INTO "cfg_mpd" VALUES(15,'optional_parameters','zeroconf_name','__name__','If Zeroconf is enabled, this is the service name to publish. This name should be unique to your local network, but name collisions will be properly dealt with. The default is "Music Player"','volumio','volumio',NULL);
INSERT INTO "cfg_mpd" VALUES(16,'optional_parameters','password','__password@permissions__','This specifies a password for access to mpd. The format is "password@permissions" where permissions is a comma delimited list composed of "read", "add", "control", and/or "admin". "read" allows for reading of the database, displaying the current playlist, and current status of mpd. "add" allows for adding songs and loading playlists. "control" allows for all other player and playlist manipulations. "admin" allows the db to be updated and for the client to kill mpd. An example value is "somePassword@read,add". Multiple password parameters may be specified',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(17,'optional_parameters','default_permissions','__permissions__','This specifies the permissions of a client that has not been authenticated using a password. The format of permissions is specified in the description of the "password" config parameter. If no passwords are specified, the default is "read,add,control,admin", otherwise it is "" (no permissions)',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(18,'optional_parameters','audio_output','','See DESCRIPTION and the various AUDIO OUTPUT PARAMETERS sections for the format of this parameter. Multiple audio_output sections may be specified. If no audio_output section is specified, then MPD will scan for a usable audio output',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(19,'optional_parameters','audio_output_format','__sample_rate:bits:channels__','This specifies the sample rate, bits per sample, and number of channels of audio that is sent to each audio output. Note that audio outputs may specify their own audio format which will be used for actual output to the audio device. An example is "44100:16:2" for 44100Hz, 16 bits, and 2 channels. The default is to use the audio format of the input file. Any of the three attributes may be an asterisk to specify that this attribute should not be enforced','disabled','disabled',NULL);
INSERT INTO "cfg_mpd" VALUES(20,'optional_parameters','samplerate_converter','__integer or prefix__','This specifies the libsamplerate converter to use. The supplied value should either be an integer or a prefix of the name of a converter. The default is "Fastest Sinc Interpolator".
At the time of this writing, the following converters are available:

Best Sinc Interpolator (0)
Band limited sinc interpolation, best quality, 97dB SNR, 96% BW.

Medium Sinc Interpolator (1)
Band limited sinc interpolation, medium quality, 97dB SNR, 90% BW.

Fastest Sinc Interpolator (2)
Band limited sinc interpolation, fastest, 97dB SNR, 80% BW.

ZOH Interpolator (3)
Zero order hold interpolator, very fast, very poor quality with audible distortions.

Linear Interpolator (4)
Linear interpolator, very fast, poor quality.

internal
Poor quality, no floating point operations. This is the default (and only choice) if MPD was compiled without libsamplerate.

For an up-to-date list of available converters, please see the libsamplerate
documentation (available online at <http://www.mega-nerd.com/SRC/>)','Fastest Sinc Interpolator','Fastest Sinc Interpolator',NULL);
INSERT INTO "cfg_mpd" VALUES(21,'optional_parameters','replaygain','__off or album or track or auto__','If specified, mpd will adjust the volume of songs played using ReplayGain tags (see ). Setting this to "album" will adjust volume using the album''s ReplayGain tags, while setting it to "track" will adjust it using the track ReplayGain tags. "auto" uses the track ReplayGain tags if random play is activated otherwise the album ReplayGain tags. Currently only FLAC, Ogg Vorbis, Musepack, and MP3 (through ID3v2 ReplayGain tags, not APEv2) are supported',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(22,'optional_parameters','replaygain_preamp','__-15 to 15__','This is the gain (in dB) applied to songs with ReplayGain tags',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(23,'optional_parameters','volume_normalization','__yes or no__','If yes, mpd will normalize the volume of songs as they play. The default is no','no','no',NULL);
INSERT INTO "cfg_mpd" VALUES(24,'optional_parameters','audio_buffer_size','__size in KiB__','This specifies the size of the audio buffer in kibibytes. The default is 2048, large enough for nearly 12 seconds of CD-quality audio','2048','2048',NULL);
INSERT INTO "cfg_mpd" VALUES(25,'optional_parameters','buffer_before_play','__0-100%__','This specifies how much of the audio buffer should be filled before playing a song. Try increasing this if you hear skipping when manually changing songs. The default is 10%, a little over 1 second of CD-quality audio with the default buffer size','20%','20%',NULL);
INSERT INTO "cfg_mpd" VALUES(26,'optional_parameters','http_proxy_host','__hostname__','This setting is deprecated. Use the "proxy" setting in the "curl" input block. See MPD user manual for details',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(27,'optional_parameters','connection_timeout','__seconds__','If a client does not send any new data in this time period, the connection is closed. The default is 60',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(28,'optional_parameters','max_connections','__number__','This specifies the maximum number of clients that can be connected to mpd. The default is 5',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(29,'optional_parameters','max_playlist_length','__number__','This specifies the maximum number of songs that can be in the playlist. The default is 4096',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(30,'optional_parameters','max_command_list_size','__size in KiB__','This specifies the maximum size a command list can be. The default is 2048',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(31,'optional_parameters','max_output_buffer_size','__size in KiB__','This specifies the maximum size of the output buffer to a client. The default is 8192',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(32,'optional_parameters','filesystem_charset','__charset__','This specifies the character set used for the filesystem. A list of supported character sets can be obtained by running "iconv -l". The default is determined from the locale when the db was originally created','UTF-8','UTF-8',NULL);
INSERT INTO "cfg_mpd" VALUES(33,'optional_parameters','id3v1_encoding','__charset__','This specifies the character set which ID3v1 tags are encoded in. A list of supported character sets can be obtained by running "iconv -l". The default is to let libid3tag convert them (from ISO-8859-1, as the standard specifies) and do no additional conversion','UTF-8','UTF-8',NULL);
INSERT INTO "cfg_mpd" VALUES(34,'optional_parameters','gapless_mp3_playback','__yes or no__','This specifies whether to support gapless playback of MP3s which have the necessary headers. Useful if your MP3s have headers with incorrect information. If you have such MP3s, it is highly recommended that you fix them using vbrfix (available from <http://www.willwap.co.uk/Programs/vbrfix.php>) instead of disabling gapless MP3 playback. The default is to support gapless MP3 playback','yes','yes',NULL);
INSERT INTO "cfg_mpd" VALUES(35,'optional_parameters','save_absolute_paths_in_playlists','__yes or no__','This specifies whether relative or absolute paths for song filenames are used when saving playlists. The default is "no"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(36,'optional_parameters','metadata_to_use','__tags__','This specifies the tag types that will be scanned for and made available to clients. Note that you must recreate (not update) your database for changes to this parameter to take effect. Possible values are artist, album, title, track, name, genre, date, composer, performer, comment, and disc. Multiple tags may be specified as a comma separated list. An example value is "artist,album,title,track". The special value "none" may be used alone to disable all metadata. The default is to use all known tag types except for comments',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(37,'optional_parameters','auto_update','__yes or no__','This specifies the wheter to support automatic update of music database when files are changed in music_directory. The default is to disable autoupdate of database','no','no',NULL);
INSERT INTO "cfg_mpd" VALUES(38,'optional_parameters','auto_update_depth','__number__','Limit the depth of the directories being watched, 0 means only watch the music directory itself. There is no limit by default','',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(39,'required_audio_output_parameters','type','__type__','This specifies the audio output type. See the list of supported outputs in mpd --version for possible values','',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(40,'required_audio_output_parameters','name','__name__','This specifies a unique name for the audio output','',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(41,'optional_audio_output_parameters','format','__sample_rate:bits:channels__','This specifies the sample rate, bits per sample, and number of channels of audio that is sent to the audio output device. See documentation for the audio_output_format parameter for more details. The default is to use whatever audio format is passed to the audio output. Any of the three attributes may be an asterisk to specify that this attribute should not be enforced',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(42,'optional_audio_output_parameters','replay_gain_handler','__software, mixer or none__','Specifies how replay gain is applied. The default is "software", which uses an internal software volume control. "mixer" uses the configured (hardware) mixer control. "none" disables replay gain on this audio output',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(43,'optional_alsa_output_parameters','device','__dev__','This specifies the device to use for audio output. The default is "default"','0',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(44,'optional_alsa_output_parameters','mixer_type','__hardware, software or none__','Specifies which mixer should be used for this audio output: the hardware mixer (available for ALSA, OSS and PulseAudio), the software mixer or no mixer ("none"). By default, the hardware mixer is used for devices which support it, and none for the others','hardware','hardware',NULL);
INSERT INTO "cfg_mpd" VALUES(45,'optional_alsa_output_parameters','mixer_device','__mixer dev__','This specifies which mixer to use. The default is "default". To use the second sound card in a system, use "hw:1"','',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(46,'optional_alsa_output_parameters','mixer_control','__mixer ctrl__','This specifies which mixer control to use (sometimes referred to as the "device"). The default is "PCM". Use "amixer scontrols" to see the list of possible controls',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(47,'optional_alsa_output_parameters','mixer_index','__mixer index__','A number identifying the index of the named mixer control. This is probably only useful if your alsa device has more than one identically-named mixer control. The default is "0". Use "amixer scontrols" to see the list of controls with their indexes',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(48,'optional_alsa_output_parameters','use_mmap','__yes or no__','Setting this allows you to use memory-mapped I/O. Certain hardware setups may benefit from this, but most do not. Most users do not need to set this. The default is to not use memory-mapped I/O',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(49,'optional_alsa_output_parameters','auto_resample','__yes or no__','Setting this to "no" disables ALSA''s software resampling, if the hardware does not support a specific sample rate. This lets MPD do the resampling. "yes" is the default and allows ALSA to resample',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(50,'optional_alsa_output_parameters','auto_channels','__yes or no__','Setting this to "no" disables ALSA''s channel conversion, if the hardware does not support a specific number of channels. Default: "yes"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(51,'optional_alsa_output_parameters','auto_format','__yes or no__','Setting this to "no" disables ALSA''s sample format conversion, if the hardware does not support a specific sample format. Default: "yes"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(52,'optional_alsa_output_parameters','buffer_time','__time in microseconds__','This sets the length of the hardware sample buffer in microseconds. Increasing it may help to reduce or eliminate skipping on certain setups. Most users do not need to change this. The default is 500000 microseconds (0.5 seconds)',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(53,'optional_alsa_output_parameters','period_time','__time in microseconds__','This sets the time between hardware sample transfers in microseconds. Increasing this can reduce CPU usage while lowering it can reduce underrun errors on bandwidth-limited devices. Some users have reported good results with this set to 50000, but not all devices support values this high. Most users do not need to change this. The default is 256000000 / sample_rate(kHz), or 5804 microseconds for CD-quality audio',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(54,'optional_oss_output_parameters','device','__dev__','This specifies the device to use for audio output. The default is "/dev/dsp"','0',NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(55,'optional_oss_output_parameters','mixer_device','__mixer dev__','This specifies which mixer to use. The default is "/dev/mixer"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(56,'optional_oss_output_parameters','mixer_control','__mixer ctrl__','This specifies which mixer control to use (sometimes referred to as the "device"). The default is to use the main PCM mixer. An example is "Pcm"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(57,'optional_pulse_output_parameters','server','__server list__','A space separated list of servers to try to connect to. See <http://www.pulseaudio.org/wiki/ServerStrings> for more details. The default is to let PulseAudio choose a server. If you specify more than one server name, MPD tries to connect to one after another until it successfully establishes a connection',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(58,'optional_pulse_output_parameters','sink','__sink__','The sink to output to. The default is to let PulseAudio choose a sink.',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(59,'optional_jack_output_parameters','client_name','__name__','The client name to use when connecting to JACK. The output ports <name>:left and <name>:right will also be created for the left and right channels, respectively',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(60,'optional_jack_output_parameters','ports','__left_port,right_port__','This specifies the left and right ports to connect to for the left and right channels, respectively. The default is to let JACK choose a pair of ports',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(61,'optional_jack_output_parameters','ringbuffer_size','__size in bytes__','This specifies the size of the ringbuffer in bytes. The default is 32768',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(62,'optional_ao_output_parameters','driver','__driver__','This specifies the libao driver to use for audio output. Possible values depend on what libao drivers are available. See <http://www.xiph.org/ao/doc/drivers.html> for information on some commonly used drivers. Typical values for Linux include "oss" and "alsa09". The default is "default", which causes libao to select an appropriate plugin',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(63,'optional_ao_output_parameters','options','__opts__','This specifies the options to use for the selected libao driver. For oss, the only option available is "dsp". For alsa09, the available options are: "dev", "buf_size", and "periods". See <http://www.xiph.org/ao/doc/drivers.html> for available options for some commonly used drivers. Options are assigned using "=", and ";" is used to separate options. An example for oss: "dsp=/dev/dsp". An example for alsa09: "dev=hw:0,0;buf_size=4096". The default is ""',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(64,'optional_ao_output_parameters','write_size','__size in bytes__','This specifies how many bytes to write to the audio device at once. This parameter is to work around a bug in older versions of libao on sound cards with very small buffers. The default is 1024',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(65,'required_fifo_parameters','path','__path__','This specifies the path of the FIFO to output to. Must be an absolute path. If the path does not exist it will be created when mpd is started, and removed when mpd is stopped. The FIFO will be created with the same user and group as mpd is running as. Default permissions can be modified by using the builtin shell command "umask". If a FIFO already exists at the specified path it will be reused, and will not be removed when mpd is stopped. You can use the "mkfifo" command to create this, and then you may modify the permissions to your liking',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(66,'required_shout_output _parameters','name','__name__','This specifies not only the unique audio output name, but also the stream title',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(67,'required_shout_output _parameters','host','__hostname__','This specifies the hostname of the icecast server to connect to',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(68,'optional_shout_output_parameters','shout_port','__username__','This specifies the port of the icecast server to connect to','','','');
INSERT INTO "cfg_mpd" VALUES(69,'required_shout_output _parameters','mount','__mountpoint__','This specifies the icecast mountpoint to use',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(70,'required_shout_output _parameters','password','__password__','This specifies the password to use when logging in to the icecast server',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(71,'required_shout_output _parameters','quality','__quality__','This specifies the encoding quality to use. The value must be between 0 and 10. Fractional values, such as 2.5, are permitted. Either the quality or the bitrate parameter must be specified, but not both. For Ogg, a higher quality number produces higher quality output. For MP3, it''s just the opposite, with lower numbers producing higher quality output',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(72,'required_shout_output _parameters','bitrate','__kbps__','This specifies the bitrate to use for encoding. Either the quality or the bitrate parameter must be specified, but not both',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(73,'required_shout_output _parameters','format','__sample_rate:bits:channels__','This specifies the sample rate, bits per sample, and number of channels to use for encoding',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(74,'optional_shout_output _parameters','encoding','__encoding__','This specifies which output encoding to use. Should be either "ogg" or "mp3", "mp3" is needed for shoutcast streaming. The default is "ogg"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(75,'optional_shout_output _parameters','protocol','__protocol__','This specifies the protocol that wil be used to connect to the icecast/shoutcast server. The options are "shoutcast", "icecast1" and "icecast2". The default is "icecast2"',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(76,'optional_shout_output _parameters','shout_user','__username__','This specifies the username to use when logging in to the icecast server. The default is "source"','','',NULL);
INSERT INTO "cfg_mpd" VALUES(77,'optional_shout_output _parameters','public','__yes or no__','This specifies whether to request that the stream be listed in all public stream directories that the icecast server knows about. The default is no',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(78,'optional_shout_output _parameters','timeout','__seconds__','This specifies the number of seconds to wait before giving up on trying to connect to the icecast server. The default is 2 seconds',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(79,'optional_shout_output _parameters','description','__description__','This specifies a description of the stream',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(80,'optional_shout_output _parameters','genre','__genre__','This specifies the genre(s) of the stream',NULL,NULL,NULL);
INSERT INTO "cfg_mpd" VALUES(81,'optional_parameters','group','__group__','This specifies the group that MPD will run as','audio','audio','');
INSERT INTO "cfg_mpd" VALUES(82,'optional_alsa_output_parameters','dop','__yes or no__','enable DSD audio support.','no','no','');
INSERT INTO "cfg_mpd" VALUES(83,'required_audio_output_parameters','device','_0,1,2_',NULL,'0','0',NULL);
CREATE TABLE cfg_engine (
id INTEGER PRIMARY KEY,
param CHAR(10),
value CHAR(10)
);
INSERT INTO "cfg_engine" VALUES(1,'orionprofile','default');
INSERT INTO "cfg_engine" VALUES(2,'cmediafix','0');
INSERT INTO "cfg_engine" VALUES(3,'playmod','0');
INSERT INTO "cfg_engine" VALUES(4,'ramplay','0');
INSERT INTO "cfg_engine" VALUES(5,'sessionid','71imdtlj8f0lfipot2b9a1j5i1');
INSERT INTO "cfg_engine" VALUES(6,'mpdconfhash','33f66f13c24dcaed3fa830bbbd4987fc');
INSERT INTO "cfg_engine" VALUES(7,'lastfm_apikey','eeb659f5846c39f969f97247416ee46a');
INSERT INTO "cfg_engine" VALUES(8,'netconfhash','1db88d44505efb89121b4056bbb6e986');
INSERT INTO "cfg_engine" VALUES(9,'mpdconf_advanced','0');
INSERT INTO "cfg_engine" VALUES(10,'netconf_advanced','0');
INSERT INTO "cfg_engine" VALUES(11,'dev','0');
INSERT INTO "cfg_engine" VALUES(12,'sourceconfhash','d41d8cd98f00b204e9800998ecf8427e');
INSERT INTO "cfg_engine" VALUES(13,'sourceconf_advanced','1');
INSERT INTO "cfg_engine" VALUES(14,'debug','0');
INSERT INTO "cfg_engine" VALUES(15,'hiddendebug','0');
INSERT INTO "cfg_engine" VALUES(16,'enableapc','0');
INSERT INTO "cfg_engine" VALUES(17,'playerid','');
INSERT INTO "cfg_engine" VALUES(18,'hwplatform','');
INSERT INTO "cfg_engine" VALUES(19,'hwplatformid','02');
INSERT INTO "cfg_engine" VALUES(20,'djmount','0');
INSERT INTO "cfg_engine" VALUES(21,'shairport','0');
INSERT INTO "cfg_engine" VALUES(22,'upnpmpdcli','1');
INSERT INTO "cfg_engine" VALUES(23,'hostname','volumio');
INSERT INTO "cfg_engine" VALUES(24,'minidlna','0');
CREATE TABLE cfg_lan (
id INTEGER PRIMARY KEY,
name CHAR(5),
dhcp INTEGER(1),
ip CHAR(15),
netmask CHAR(15),
gw CHAR(15),
dns1 CHAR(15),
dns2 CHAR(15)
);
INSERT INTO "cfg_lan" VALUES(1,'eth0','true','','','','','');
INSERT INTO "cfg_lan" VALUES(2,'wlan0',1,'','','','','');
CREATE TABLE cfg_source (
id INTEGER PRIMARY KEY,
name CHAR(25),
type CHAR(8),
address CHAR(15),
remotedir CHAR(30),
username CHAR(30),
password CHAR(60),
charset CHAR(15),
rsize INT(4),
wsize INT(4)
, options CHAR(60), error CHAR(150));
CREATE UNIQUE INDEX IndexCfg_Source ON cfg_source (name);

CREATE TABLE updates (
    modulename VARCHAR(50) PRIMARY KEY,
    version INTEGER
);

COMMIT;
