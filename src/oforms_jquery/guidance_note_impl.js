
// TODO: Guidance notes workaround for IE6 lack of support for position:fixed?

var guidanceNoteWaitingForRemoval;

var guidanceNoteOnBlur = function() {
    if(!guidanceNoteWaitingForRemoval) {
        guidanceNoteWaitingForRemoval = true;
        // Hide guidance notes after a short delay, so that blur & focus events in quick succession
        // don't cause the guidance notes box to flicker.
        window.setTimeout(function() {
            if(guidanceNoteWaitingForRemoval) {
                $('#oforms-guidance-note').hide();
                guidanceNoteWaitingForRemoval = undefined;
            }
        }, 125);
    }
};

var guidanceNoteOnFocus = function() {
    // Does this element have a guidance note, or does a parent of the element?
    var note, scan = this;
    while(!note && scan && scan.className !== 'oform') {
        note = scan.getAttribute('data-oforms-note');
        scan = scan.parentNode;
    }
    // Display or hide the guidance note
    if(note) {
        guidanceNoteWaitingForRemoval = undefined;
        var display;
        while(!display) {
            display = $('#oforms-guidance-note div');
            if(display.length === 0) {
                $(document.body).append('<div id="oforms-guidance-note"><div></div></div>');
                display = undefined;
            }
        }
        display.text(note);
        $('#oforms-guidance-note').show();
    } else {
        // Start process for eventual hiding of the guidance note
        guidanceNoteOnBlur();
    }
};
