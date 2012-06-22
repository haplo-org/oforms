
// Registration of the Handlebars helpers is a public API, so it can be used when the delegate takes over the rendering.
// Allow use of a different Handlebars object if required.
oForms.registerHandlebarsHelpers = function(_handlebars) {
    // Make sure the element partial is available and compiled
    var elementPartial = standardTemplates['oforms:element'];
    if(typeof(elementPartial) !== 'function') {
        elementPartial = Handlebars.compile(elementPartial);
    }

    // Use default Handlebars?
    if(!_handlebars) { _handlebars = Handlebars; }

    // Helper to make implementing custom templates a bit simplier.
    // Use like {{oforms_element "name"}} where name is the name of the element.
    // This either works for non-repeating sections, where you just have HTML and these oforms_element statements,
    // and for repeating sections, where you have surrounded them in {{#rows}} ... {{/rows}}
    // The oforms:element paritial is defined so that it works when rendering forms and documents.
    _handlebars.registerHelper('oforms_element', function(element) {
        // Need to pick out this.rows[0].named (by preference) or fall back on this.named
        var rows = this.rows, row = ((rows && rows.length > 0) ? rows[0] : this), named = row.named;
        if(named) {
            return new Handlebars.SafeString(elementPartial(named[element]));
        } else {
            return '';
        }
    });
};

// Renderer setup
var _templateRendererSetup = function() {
    // Register helpers
    oForms.registerHandlebarsHelpers();
    // Turn all the standard templates into compiled templates.
    var compiledStandardTemplates = {};
    _.each(standardTemplates, function(template, name) {
        compiledStandardTemplates[name] = Handlebars.compile(template);
    });
    standardTemplates = compiledStandardTemplates;
    // Don't do this again.
    _templateRendererSetup = function() {};
};

// Renderer implementation
var _templateRendererImpl = function(template, view, output) {
    // Compile the template?
    if(!(template instanceof Function)) {
        template = Handlebars.compile(template);
    }
    // Use the standard templates as partials
    output.push(template(view, {partials: standardTemplates}));
};
