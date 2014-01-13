$(document).on(
    "click",
    "a",
    function(event) {

    // If this is the menu-settings icon (top right) just return
    // without modifying anything
	if ( this.id == "menu-settings" ) { return; } 
	
        if (!$(this).hasClass("external") ) {
            event.preventDefault();
            if (!$(event.target).attr("href")) {
                location.href = $(event.target).parent().attr("href");
            } else {
                location.href = $(event.target).attr("href");
            }
        } else {}
    }
);
