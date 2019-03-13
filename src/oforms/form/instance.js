
var /* seal */ FormInstance = function(description, document) {
    this.description = description;
    this.document = document;
    this.valid = true;
    this._externalData = {};     // used in conditionals
    this._rerenderData = {};
    this._validationFailures = {};
    // Replace render template function with one which uses the delegate for rendering?
    var delegate = description.delegate;
    if(delegate.formPushRenderedTemplate) {
        this._renderTemplate = function() {
            delegate.formPushRenderedTemplate.apply(delegate, arguments);
        };
    }
};

_.extend(FormInstance.prototype, {
    // Public properties
    //  description - the form description object
    //  document - the document object this form reads and updates
    //  valid - true if the form passed validation (document may contain invalid data if this is not true)
    //
    // Properties used by other objects in this system, but not by users of oForms
    //   _isEmptyInstanceForBundling - flag set when bundling.
    //   _instanceChoices - look up of choices set by choices(). May not be defined.
    //   _rerenderData - look up of element name + suffix to any info required to render the form correctly,
    //                      for example, invalid data which cannot be stored in the document.
    //
    // Private properties - but some accessed directly by other parts of the code
    //   _validationFailures - look up of element name + suffix to validation failure message to display
    //                      to the user

    renderForm: function() {
        var output = ['<div class="oform" id="', escapeHTML(this.description.formId), '">'];
        var rootElement = this.description._root;
        rootElement._pushRenderedHTML(
                this,
                true,   // rendering form
                this.document,
                '',     // empty name suffix
                this._validationFailures[rootElement.name],
                output
            );
        output.push("</div>");
        return output.join("");
    },

    renderDocument: function() {
        var output = [];
        this.description._root._pushRenderedHTML(
                this,
                false,  // rendering document
                this.document,
                '',     // empty name suffix
                undefined, // no validation failures
                output
            );
        return output.join("");
    },

    // Request data-uname elements on output HTML in forms and documents.
    setIncludeUniqueElementNamesInHTML: function(include) {
        this._includeUniqueElementNamesInHTML = !!include;
    },

    documentWouldValidate: function() {
        return this.description._root._wouldValidate(this, this.document);
    },

    update: function(submittedDataFn) {
        this.valid = false;
        this._validationFailures = {};
        this._rerenderData = {};
        this.description._root._updateDocument(this, this.document, '' /* empty name suffix */, function(name) {
            // Wrap the given submittedDataFn so if it doesn't find a value for a given name, it returns the empty string.
            // This makes sure everthing works with Internet Explorer.
            return submittedDataFn(name) || '';
        });
        if(_.isEmpty(this._validationFailures)) { this.valid = true; }
    },

    choices: function(name, choices) {
        var c = this._instanceChoices;
        if(!c) { this._instanceChoices = c = {}; }
        c[name] = choices;
    },

    customValidation: function(name, fn) {
        var c = this._customValidationFns;
        if(!c) { this._customValidationFns = c = {}; }
        if(typeof(fn) !== 'function') { complain("must pass function to customValidation()"); }
        c[name] = fn;
    },

    externalData: function(externalData) {
        _.extend(this._externalData, externalData||{});
    },

    getExternalData: function() {
        return Object.create(this._externalData);
    },

    // Make a version of the document which contains displayable strings
    makeView: function() {
        var clonedDocument = deepCloneForJSON(this.document);
        this.description._root._replaceValuesForView(this, clonedDocument);
        return clonedDocument;
    },

    // ----------------------------------------------------------------------------------------
    // Functions for the other interfaces
    _renderTemplate: function(templateName, view, output) {
        // --------------------------
        // NOTE: This may be replaced entirely by the delegate if it implements the formPushRenderedTemplate() function.
        // --------------------------
        // Fetch the template
        var template;
        // First try the delegate, so the caller can specify their own templates and override the default templates
        var delegate = this.description.delegate;
        if(delegate.formGetTemplate) {
            template = delegate.formGetTemplate(templateName);
        }
        // Then try the standard templates
        if(!template) { template = standardTemplates[templateName]; }
        if(!template) { complain("template", "No such template: "+templateName); }
        // Render template using chosen template renderer
        _templateRendererImpl(template, view, output);
    }
});
