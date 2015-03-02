
makeElementType("static", {

    // Specification options:
    //   text - text to display within paragraph elements. Newlines start new paragraphs.
    //   html - HTML to output exactly as is
    //   display - where to display it: "form", "document" or "both" as shortcuts for inForm & inDocument

    _initElement: function(specification, description) {
        this._text = specification.text;
        this._html = specification.html;
        // Either use inForm & inDocument, or use display property to set them.
        if(("inForm" in specification) || ("inDocument" in specification)) {
            if("display" in specification) {
                complain("spec", "Can't use inForm or inDocument when you use display property in "+this.name);
            }
        } else {
            switch(specification.display) {
                case "both": /* do nothing, default is both */ break;
                case "document": this.inForm = false; break;
                default: this.inDocument = false; break;
            }
        }
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
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
    },

    _updateDocument: function(instance, context, nameSuffix, submittedDataFn) {
        // Do nothing - static elements don't affect the document
    },

    _wouldValidate: function(instance, context) {
        return true;
    }

}, true /* value path optional */);
