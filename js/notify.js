// mostra le notifiche sulle azioni
function notify(command, msg) {
	switch (command) {
		case 'add':
			$.pnotify({
				title: 'Added to playlist',
				text: msg,
				icon: 'fa fa-check',
				opacity: .9
			});
		break;

		case 'addreplaceplay':
			$.pnotify({
				title: 'Playlist cleared<br> Added to playlist',
				text: msg,
				icon: 'fa fa-remove',
				opacity: .9
			});
		break;
		
		case 'update':
			$.pnotify({
				title: 'Update path: ',
				text: msg,
				icon: 'fa fa-remove',
				opacity: .9
			});
		break;
		
		case 'remove':
			$.pnotify({
				title: 'Removed from playlist',
				text: msg,
				icon: 'fa fa-remove',
				opacity: .9
			});
		break;

                case 'savepl':
                        $.pnotify({
                                title: 'Playlist has been saved',
                                text: msg,
                                icon: 'fa fa-remove',
                                opacity: .9
                        });
                break;

                case 'needplname':
                        $.pnotify({
                                title: 'Give a name for saving playlist',
                                text: msg,
                                icon: 'fa fa-remove',
                                opacity: .9
                        });
                break;

	}
}
