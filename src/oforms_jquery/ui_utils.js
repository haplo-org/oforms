
// Utility functions for client side support code

var escapeHTML = function(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};


// Functions to extract parts from element names.
//
// Element names are encoded as:
//
//   name[.part][.suffix]
//
// where name is a-z0-9_ only,
// part is optional, and a-z only, used for distinguising multiple elements within a form,
// and suffix is a dot separated list of 0-9 only, used for repeated sections.

var elementBaseName = function(name) {
    var i = name.indexOf('.');
    return (-1 === i) ? name : name.substr(0, i);
};

var elementNameSuffix = function(name) {
    var m = name.match(/\.[0-9\.]+$/);
    return m ? m[0] : '';
};


// DOM manipulation

var positionClone = function(element, reference, dx, dy, setWidth, setHeight) {
    // Get basic info about the reference element
    var refq = $(reference).first();
    if(refq.length === 0) { return; } // abort if the reference element can't be found
    var pos = refq.offset();
    // Adjust the position using the offsets
    pos.left += dx || 0;
    pos.top += dy || 0;
    // Set left and top in the CSS so this can be called repeatedly without getting the position wrong
    var css = {left:0, top:0};
    // Set width and height?
    if(setWidth || setHeight) {
        if(setWidth)  { css.width = refq[0].offsetWidth+'px';   }
        if(setHeight) { css.height = refq[0].offsetHeight+'px'; }
    }
    // Show and apply positioning to target element
    $(element).css(css).show().offset(pos);
};
