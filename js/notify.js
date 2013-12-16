// mostra le notifiche sulle azioni
function notify(command, msg) {
	switch (command) {
		case 'add':
			$.pnotify({
				title: 'Added to playlist',
				text: msg,
				icon: 'icon-ok',
				opacity: .9
			});
		break;

		case 'addreplaceplay':
			$.pnotify({
				title: 'Playlist cleared<br> Added to playlist',
				text: msg,
				icon: 'icon-remove',
				opacity: .9
			});
		break;
		
		case 'update':
			$.pnotify({
				title: 'Update path: ',
				text: msg,
				icon: 'icon-remove',
				opacity: .9
			});
		break;
		
		case 'remove':
			$.pnotify({
				title: 'Removed from playlist',
				text: msg,
				icon: 'icon-remove',
				opacity: .9
			});
		break;
	}
}