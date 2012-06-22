
var _templateRendererSetup = function() {
    // Mustache doesn't need any setup
};

var _templateRendererImpl = function(template, view, output) {
    // Can't use streaming mode, however nicely it fits in with the push-to-output method we use, because
    // it removes line endings from the values which means <textarea>s can't have multiple lines.
    // Use the standard templates as partials.
    output.push(Mustache.to_html(template, view, standardTemplates));
};
