
makeElementType("paragraph", {

    _initElement: function(specification, description) {
        // Options
        this._rows = (specification.rows || 4) * 1; // default to 4, ensure it's a number to avoid accidental XSS, however unlikely
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) {
            value = '';
        } else if(typeof value !== "string") {
            value = value.toString();
        }
        if(renderForm) {
            output.push('<textarea name="', this.name, nameSuffix, '" rows="', this._rows, '"');
            this._outputCommonAttributes(output, true /* with class */);
            output.push('>', escapeHTML(value), '</textarea>');
        } else {
            // Output escaped HTML with paragraph tags for each bit of the text
            _.each(value.split(/[\r\n]+/), function(para) {
                output.push('<p>', escapeHTML(para), '</p>');
            });
        }
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var text = submittedDataFn(this.name + nameSuffix);
        // Turn any line endings into single \n -- including removing \r's from IE
        return (text.length > 0) ? text.replace(/[\r\n]+/g,"\n") : undefined;
    }
});
