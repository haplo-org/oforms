
// Implements number and integer element types.

// Use class property in specification along with custom CSS to change field width.

var makeNumberElementType = function(typeName, validationRegExp, validationFailureMessage) {

    makeElementType(typeName, {

        _initElement: function(specification, description) {
            this._minimumValue = specification.minimumValue;
            this._maximumValue = specification.maximumValue;
            this._htmlPrefix = specification.htmlPrefix || '';
            this._htmlSuffix = specification.htmlSuffix || '';
        },

        _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
            var value = this._getValueFromDoc(context);
            if(renderForm) {
                output.push(this._htmlPrefix, '<input type="text" class="oforms-number', additionalClass(this._class), '" name="', this.name, nameSuffix, '" value="');
                var enteredText = instance._rerenderData[this.name + nameSuffix];
                if(enteredText) {
                    // Repeat what the user entered when validation failed
                    output.push(escapeHTML(enteredText));
                } else if(typeof(value) === "number") {
                    // Output a number
                    output.push(value); // no escaping needed
                }
                output.push('"');
                this._outputCommonAttributes(output);
                output.push('>', this._htmlSuffix);
            } else {
                if(value !== undefined && value !== null) {
                    output.push(this._htmlPrefix, escapeHTML(value.toString()), this._htmlSuffix);
                }
            }
        },

        _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
            // Retrieve the text field from the document
            var text = submittedDataFn(this.name + nameSuffix);
            // Validate it against the regexp
            var m = text.match(validationRegExp);
            if(m && m[1].length > 0) {
                // The string is a valid number/integer - turn it into a number then check it against the min and max values
                var value = 1 * m[1];
                var min = this._minimumValue, max = this._maximumValue;
                if(undefined !== min && value < min) {
                    validationResult._failureMessage = MESSAGE_NUMBER_LESSTHAN + min;
                } else if(undefined !== max && value > max) {
                    validationResult._failureMessage = MESSAGE_NUMBER_GREATERTHAN + max;
                }
                return value;
            } else {
                // Value isn't valid. Store validation failure information so the base can decide what to do.
                if(text.length === 0) {
                    validationResult._isEmptyField = true;
                } else {
                    // Store the the entered text so it can be output in the re-rendered form
                    instance._rerenderData[this.name + nameSuffix] = text;
                    // Set failure message
                    validationResult._failureMessage = validationFailureMessage;
                }
                return undefined;
            }
        }
    });

};

makeNumberElementType("number",  /^\s*(\-?\d*\.?\d*)\s*$/, MESSAGE_NUMBER_INVALID);
makeNumberElementType("integer", /^\s*(\-?\d+)\s*$/,       MESSAGE_INTEGER_INVALID);
