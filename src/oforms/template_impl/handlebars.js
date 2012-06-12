
// Register a helper to do the equivalent of Mustache's implicit iterator, although it has to use {{element}} rather than {{.}} in the templates.
// Modified version of the standard Handlebars each helper.
Handlebars.registerHelper('_oforms_array_iterator', function(context, options) {
    var fn = options.fn, inverse = options.inverse;
    var ret = "";
    if(context && context.length > 0) {
        for(var i=0, j=context.length; i<j; i++) {
            ret = ret + fn({element:context[i]});
        }
    } else {
        ret = inverse(this);
    }
    return ret;
});

// Turn all the standard templates into compiled templates.
var compiledStandardTemplates = {};
_.each(standardTemplates, function(template, name) {
    compiledStandardTemplates[name] = Handlebars.compile(template);
});
standardTemplates = compiledStandardTemplates;

// Renderer implementation
var _templateRendererImpl = function(template, view, output) {
    // Compile the template?
    if(!(template instanceof Function)) {
        template = Handlebars.compile(template);
    }
    // Use the standard templates as partials
    output.push(template(view, {partials: standardTemplates}));
};
