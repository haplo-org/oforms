
var /* seal */ TEXT_WHITESPACE_FUNCTIONS = {
    trim: function(text) {
        // Removing leading and trailing whitespace
        return text.replace(/^\s+|\s+$/g,'');
    },
    minimise: function(text) {
        // Remove leading and trailing whitespace, and replace multiple whitespace characters with a single space.
        return text.replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ');
    }
};
TEXT_WHITESPACE_FUNCTIONS.minimize = TEXT_WHITESPACE_FUNCTIONS.minimise;    // US English alternative

// ----------------------------------------------------------------------------------------------------------

makeElementType("text", {

    _initElement: function(specification, description) {
        // Options
        if(specification.whitespace) {
            this._whitespaceFunction = TEXT_WHITESPACE_FUNCTIONS[specification.whitespace];
            if(!this._whitespaceFunction) {
                complain("spec", "Text whitespace option "+specification.whitespace+" not known.");
            }
        }
        if(specification.validationRegExp) {
            this._validationRegExp = new RegExp(specification.validationRegExp, specification.validationRegExpOptions || '');
            this._validationFailureMessage = specification.validationFailureMessage || MESSAGE_TEXT_VALIDATION_REGEXP_FAILURE;
        }
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) {
            value = '';
        } else if(typeof value !== "string") {
            value = value.toString();
        }
        if(renderForm) {
            output.push('<input type="text" name="', this.name, nameSuffix, '" value="', escapeHTML(value), '"');
            this._outputCommonAttributes(output, true /* with class */);
            output.push('>');
        } else {
            output.push(escapeHTML(value));
        }
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var text = submittedDataFn(this.name + nameSuffix);
        // Whitespace processing - must be performed first
        if(this._whitespaceFunction) {
            text = this._whitespaceFunction(text);
        }
        // Shortcut return now if text is empty, required field validation happens in base.js
        if(text.length === 0) {
            return undefined;
        }
        // Validation regexp?
        if(this._validationRegExp) {
            if(!(this._validationRegExp.test(text))) {
                validationResult._failureMessage = this._validationFailureMessage;
            }
        }
        return text;
    }
});
