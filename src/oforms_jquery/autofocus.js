
// When the document loads, set the focus to the first input fields in the form. Do things in a slightly complex manner to
// put the insert point nicely at the end of the field. Internet Explorer, as usual, makes this amusing.
$(document).ready(function() {
    var allInputs = $('input[type=text], textarea', '.oform'); // don't use :first or .first() for performance
    for(var i = 0; i < allInputs.length; ++i) {
        var element = allInputs[i];
        // If the element, or any of it's parents, has the special class, skip it
        var e = $(element);
        if(e.hasClass("oforms-no-autofocus") || (e.parents(".oforms-no-autofocus").length > 0)) {
            continue;
        }
        // If acceptable, focus then finish the loop
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
        break;
    }
});
