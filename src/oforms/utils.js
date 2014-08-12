
// Utility functions

var escapeHTML = function(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

var complain = function(code, message) {
    message = message || defaultComplaints[code];
    throw new Error("oForms/"+code+": "+message);
};

var defaultComplaints = {
    "internal": "Internal error"
};

// Output an attribute for HTML generation, if the value is defined.
// In _pushRenderedHTML use like
//    outputAttribute(output, ' id="', this._id);
// Remember the space, = and single quote! This is slightly clumsy, but efficient.
var outputAttribute = function(output, attributeStart, value) {
    if(value) {
        output.push(attributeStart, escapeHTML(value.toString()), '"');
    }
};

// If className defined, return it with a space prepended, otherwise return the empty string 
var additionalClass = function(className) {
    return className ? ' '+className : '';
};

// Get a value from an arbitary path
var getByPath = function(context, path) {
    var route = path.split('.');
    var lastKey = route.pop();
    var position = context;
    for(var l = 0; l < route.length && undefined !== position; ++l) {
        position = position[route[l]];
    }
    return position ? position[lastKey] : undefined;
};

// A deep clone function which is good enough to work on the JSON documents we expect
var deepCloneForJSONinner = function(object, recusionLimit) {
    if(recusionLimit <= 0) { complain("clone", "Recursion limit reached, nesting of document too deep or has cycles"); }
    var copy = object;
    if(_.isArray(object)) {
        var len = object.length;
        copy = [];
        for(var i = 0; i < len; ++i) {
            copy[i] = deepCloneForJSONinner(object[i], recusionLimit - 1);
        }
    } else if(_.isObject(object)) {
        copy = {};
        for(var attr in object) {
            if(object.hasOwnProperty(attr)) {
                copy[attr] = deepCloneForJSONinner(object[attr], recusionLimit - 1);
            }
        }
    }
    return copy;
};
var deepCloneForJSON = function(object) {
    return deepCloneForJSONinner(object, 128 /* reasonable recusion limit */);
};
