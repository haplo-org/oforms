
makeElementType("static", {

    // Specification options:
    //   text - text to display within paragraph elements. Newlines start new paragraphs.
    //   html - HTML to output exactly as is
    //   display - where to display it: "form", "document" or "both"
    
    _initElement: function(specification, description) {
        this._text = specification.text;
        this._html = specification.html;
        this._display = specification.display || 'form';
    },
    
    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        if(this._display === "both" || this._display === (renderForm ? "form" : "document")) {
            if(this._text) {
                output.push(
                    '<p>',
                    _.map(this._text.split(/[\r\n]+/), function(p) { return escapeHTML(p); }) .join('</p><p>'),
                    '</p>'
                );
            }
            if(this._html) {
                output.push(this._html);
            }
        }
    },
    
    _updateDocument: function(instance, context, nameSuffix, submittedDataFn) {
        // Do nothing - static elements don't affect the document
    }
    
}, true /* value path optional */);
