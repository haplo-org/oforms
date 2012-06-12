
var SectionElementMethods = {

    _initElement: function(specification, description) {
        // Throw an error if there isn't an element property
        if(!specification.elements) {
            complain("spec", "No elements property specified for section '"+this.name+"'");
        }
        // TODO: Verification of section description - remember this can be the root of the form description
        this._elements = _.map(specification.elements, function(elementSpecification) {
            // Find the constructor for the element, defaulting to a simple text element.
            var Constructor = elementConstructors[elementSpecification.type] || elementConstructors.text;
            // Create the element with the same context as this element
            return new Constructor(elementSpecification, description);
        });
        // Rules for choosing the template:
        // If rendering the form, use template key from specification, or the default template.
        // If displaying the document, use templateDisplay key, but if not set, use what would be used for the form with ':display' appended.
        this._template = (specification.template || "oforms:default");
        this._templateDisplay = (specification.templateDisplay || (this._template + ':display'));
        // Sections can also have headings, as using a label can give results which aren't visually distinctive enough.
        this._heading = specification.heading;
        // When rendering the document, empty values can be omitted for clearer display of sparse data. If true and no values, omit section entirely.
        this._renderDocumentOmitEmpty = specification.renderDocumentOmitEmpty;
        // Pass options to templates
        this._templateOptions = specification.templateOptions;
    },

    _bundleClientRequirements: function(emptyInstance, bundle) {
        for(var m = 0; m < this._elements.length; ++m) {
            this._elements[m]._bundleClientRequirements(emptyInstance, bundle);
        }
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var elementsContext = this._getContextFromDoc(context);
        var elements;
        // Special case for when we're rendering the document, and the specification requires that empty values are omitted.
        if(!renderForm && this._renderDocumentOmitEmpty) {
            // Build a new elements array which only includes the elements which have a value
            elements = _.filter(this._elements, function(e) {
                // NOTE: Relies on the default _getValueFromDoc() function to return a non-undefined value for sections.
                return e._getValueFromDoc(elementsContext) !== undefined;
            });
            // If there are no elements which have a value, omit this section entirely.
            if(elements.length === 0) {
                return;
            }
        }
        // For non-repeating sections, there's just a single row.
        var rows = [this._renderRow(instance, renderForm, elementsContext, nameSuffix, elements)];
        this._pushRenderedRowsHTML(instance, renderForm, rows, output, false /* not rows only */, elements);
    },

    _updateDocument: function(instance, context, nameSuffix, submittedDataFn) {
        var elementsContext = this._getContextFromDoc(context, true /* callerWillBeWritingToTheContext */);
        // For non-repeating sections, there's just a single row.
        // Return the flag from the _updateDocumentRow function to show whether or not the user entered any data in this section
        return this._updateDocumentRow(instance, elementsContext, nameSuffix, submittedDataFn);
    },

    _replaceValuesForView: function(instance, context) {
        var elementsContext = this._getContextFromDoc(context);
        if(!elementsContext) { return; }
        for(var m = 0; m < this._elements.length; ++m) {
            this._elements[m]._replaceValuesForView(instance, elementsContext);
        }
    },
    
    // Render a row of elements into a view.
    // (Everything is considered a row, whether or not the view is a table.)
    _renderRow: function(instance, renderForm, context, nameSuffix, elements /* optional */) {
        if(!elements) { elements = this._elements; } // optional argument
        var named = {};
        var row = [];
        var validationFailures = instance._validationFailures;
        for(var m = 0; m < elements.length; ++m) {
            var e = elements[m];
            var output = [];
            var validationFailure = validationFailures[e.name+nameSuffix];
            e._pushRenderedHTML(instance, renderForm, context, nameSuffix, validationFailure, output);
            var info = {
                name: e.name,
                label: e.label,
                required: e.required,
                validationFailure: validationFailure ? {message:validationFailure} : false,
                html: output.join('')
            };
            named[e.name] = info;
            row.push(info);
        }
        return {named:named, elements:row};
    },
    
    // Given rendered rows from _renderRow(), package them up into a view and render it.
    _pushRenderedRowsHTML: function(instance, renderForm, rows, output, rowsOnly, elements /* optional */) {
        if(!elements) { elements = this._elements; } // optional argument
        var view = {
            // Common attributes
            id: this._id, "class": this._class, guidanceNote: this._guidanceNote,
            // Section heading
            sectionHeading: this._heading,
            // Rendering flags
            rowsOnly: (rowsOnly || false),
            // Pass options to the template
            options: this._templateOptions,
            // Rows of elements and rendered values
            rows: rows,
            // Element definitions for headings etc
            definitions: elements
        };
        this._modifyViewBeforeRendering(view, rows);
        // Choose and render the template.
        var templateName = renderForm ? this._template : this._templateDisplay;
        instance._renderTemplate(templateName, view, output);
    },

    _modifyViewBeforeRendering: function(view, rows) {
        // Do nothing in the base class
    },

    // Returns true if any of the _updateDocument() calls returned true to show user has entered something in that element.
    _updateDocumentRow: function(instance, context, nameSuffix, submittedDataFn) {
        var userHasEnteredValue = false;
        for(var m = 0; m < this._elements.length; ++m) {
            if(this._elements[m]._updateDocument(instance, context, nameSuffix, submittedDataFn)) {
                userHasEnteredValue = true;
            }
        }
        return userHasEnteredValue;
    },
    
    _getContextFromDoc: function(context, callerWillBeWritingToTheContext) {
        if(this.valuePath) {
            // Doesn't use the current context, so get the nested context from the document
            var nestedContext = this._getValueFromDoc(context);
            if(undefined === nestedContext) {
                // If there's no context, make a new one so, when reading, there's something to read from,
                // and when writing, it actually goes in the document to return the values.
                nestedContext = {};
                if(callerWillBeWritingToTheContext) {
                    this._setValueInDoc(context, nestedContext);
                }
            }
            return nestedContext;
        }
        // If there's no value path for this section, then the section will just use the current context
        return context;
    }
};

var /* seal */ SectionElement = makeElementType("section", SectionElementMethods, true /* value path optional */);
