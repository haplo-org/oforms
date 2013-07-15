
// When the document loads, set the focus to the first input fields in the form. Do things in a slightly complex manner to
// put the insert point nicely at the end of the field. Internet Explorer, as usual, makes this amusing.
$(document).ready(function() {
    var allInputs = $('.oform input[type=text]'); // don't use :first or .first() for performance
    if(allInputs.length > 0) {
        var element = allInputs[0];
        element.focus();
        if(navigator.appVersion.indexOf('MSIE') > 0 && !(window.opera)) {
            element.select();
            var r = document.selection.createRange();
            r.collapse(false);
            r.select();
        } else if(element.setSelectionRange) {
            element.setSelectionRange(element.value.length, element.value.length);
        } else {
            element.value = element.value;
        }
    }
});
