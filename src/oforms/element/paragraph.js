
makeElementType("paragraph", {

    _initElement: function(specification, description) {
        // Options
        this._rows = (specification.rows || 4) * 1; // default to 4, ensure it's a number to avoid accidental XSS, however unlikely
        this._validationCount = specification.validationCount;
        // If a word counter is needed, then the UI scripts need to be included
        if(this._validationCount) { description.requiresClientUIScripts = true; }
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) {
            value = '';
        } else if(typeof value !== "string") {
            value = value.toString();
        }
        if(renderForm) {
            // FORM UI
            var vc = this._validationCount;
            if(vc) {
                output.push(
                    '<div class="oforms-paragraph-with-count" data-unit="',
                    vc.unit === "character" ? 'c' : 'w',
                    '">'
                );
            }

            // Textarea input
            output.push('<textarea name="', this.name, nameSuffix, '" rows="', this._rows, '"');
            this._outputCommonAttributes(output, true /* with class */);
            output.push('>', escapeHTML(value), '</textarea>');

            // Limits UI
            if(vc) {
                output.push(
                    '<div class="oforms-paragraph-counter">',
                    (vc.unit === "character") ? MESSAGE_PARAGRAPH_LIMIT_UNIT_CHARACTER : MESSAGE_PARAGRAPH_LIMIT_UNIT_WORD,
                    ': <span></span> '
                );
                if(vc.limitText) {
                    output.push('(', escapeHTML(vc.limitText), ')');
                } else {
                    var limits = [];
                    if(vc.min) { limits.push(MESSAGE_PARAGRAPH_LIMIT_MIN+vc.min); }
                    if(vc.max) { limits.push(MESSAGE_PARAGRAPH_LIMIT_MAX+vc.max); }
                    if(limits.length) {
                        output.push('(', limits.join(', '), ')');
                    }
                }
                output.push('</div></div>');
            }

        } else {
            // DOCUMENT DISPLAY
            // Output escaped HTML with paragraph tags for each bit of the text
            _.each(value.split(/[\r\n]+/), function(para) {
                output.push('<p>', escapeHTML(para), '</p>');
            });
        }
    },

    _doesParagraphCountValidationFail: function(value) {
        var vc = this._validationCount;
        if(!vc) { return; }
        var countFn = (vc.unit === "character") ? textCountCharacters : textCountWords;
        var count = countFn(value);
        if(count === 0 && !this._required) { return; }
        if(vc.min) {
            if(count < vc.min) { return 'min'; }
        }
        if(vc.max) {
            if(count > vc.max) { return 'max'; }
        }
    },

    _valueWouldValidate: function(value) {
        return !!value && (undefined === this._doesParagraphCountValidationFail(value));
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult, context) {
        var text = submittedDataFn(this.name + nameSuffix);
        // Turn any line endings into single \n -- including removing \r's from IE
        var value = (text.length > 0) ? text.replace(/[\r\n]+/g,"\n") : undefined;

        // Validation?
        var vc = this._validationCount;
        if(vc) {
            var countFailure = this._doesParagraphCountValidationFail(value);
            if(countFailure) {
                var m = PARAGRAPH_COUNT_ERROR_MESSAGES[countFailure];
                if(m.specifiedMessage in vc) {
                    validationResult._failureMessage = vc[m.specifiedMessage];
                } else {
                    validationResult._failureMessage = m.prefix + vc[m.count] + ' ' +
                        ((vc.unit === "character") ? MESSAGE_PARAGRAPH_LIMIT_UNIT_CHARACTER : MESSAGE_PARAGRAPH_LIMIT_UNIT_WORD).toLowerCase() +
                        ' ' + m.suffix;
                }
            }
        }
        return value;
    }
});

var PARAGRAPH_COUNT_ERROR_MESSAGES = {
    "min": {
        specifiedMessage: "minFailureMessage",
        prefix: MESSAGE_PARAGRAPH_FAILURE_MIN_PREFIX,
        count: "min",
        suffix: MESSAGE_PARAGRAPH_FAILURE_MIN_SUFFIX
    },
    "max": {
        specifiedMessage: "maxFailureMessage",
        prefix: MESSAGE_PARAGRAPH_FAILURE_MAX_PREFIX,
        count: "max",
        suffix: MESSAGE_PARAGRAPH_FAILURE_MAX_SUFFIX
    }
};
