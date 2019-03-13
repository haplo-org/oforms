//
// Features, constraints, etc:
//
//   Cannot use the empty string as an id.
//
//   Choices can be a string, which refers to an "instance choices" array (format as below) set with instance.choices(name, choices).
//   Instance choices cannot used within a repeating section.
//
//   Choices can be an array of:
//      Simple text choices, used for display and as the value
//      Arrays, in the form [id,display]
//      Objects, with 'id' and 'name' properties, unless overridden in specification with objectIdProperty and objectDisplayProperty.
//
//   If the id of the first element in the array is a number, then the value is converted to an number. Otherwise id is always a string.
//
//   If specification.prompt === false, there will not be a prompt as the first option in the <select>.
//
//   If using a radio style, radioGroups can be set to display the choices in the specified number of columns.
//

// ------------------------------------------------------------------------------------------------------------

// NOTE: These test functions return false if the choices array is empty, but this won't make a difference in the code below.
var choicesArrayOfArrays = function(choices) {
    return choices.length > 0 && _.isArray(choices[0]);
};
var choicesArrayOfObjects = function(choices) {
    return choices.length > 0 && typeof(choices[0]) === 'object';
};

// ------------------------------------------------------------------------------------------------------------

// The valid styles for choice Elements, which also translates the aliases.
var /* seal */ CHOICE_STYLES = {
    "select": "select",
    "multiple": "multiple",
    "radio": "radio-vertical", // short alias for the most likely radio form
    "radio-vertical": "radio-vertical",
    "radio-horizontal": "radio-horizontal"
};

// ------------------------------------------------------------------------------------------------------------

makeElementType("choice", {

    _initElement: function(specification, description) {
        // TODO: More flexible choices specification, local to instance, data source
        this._choices = specification.choices;
        this._style = CHOICE_STYLES[specification.style || 'select'];
        if(!this._style) {
            complain("spec", "Unknown choice style "+specification.style);
        }
        this._radioClusters = specification.radioClusters;
        this._radioGroups = specification.radioGroups;
        if(this._radioGroups) {
            // If radio groups is used, force the style to radio-vertical, otherwise it won't look right
            this._style = 'radio-vertical';
        }
        // Determine the prompt for the first element of the <select> tag, using default if not set.
        var prompt = specification.prompt;
        if(prompt === false) {
            this._prompt = false;   // means no prompt
        } else if(typeof(prompt) === 'string') {
            this._prompt = escapeHTML(prompt);
        } else {
            this._prompt = MESSAGE_CHOICE_DEFAULT_PROMPT; // any other kind of value, just use the default
        }
        // Property names for objects
        // TODO: Get property names for objects from data source if not in specification
        this._objectIdProperty = specification.objectIdProperty || 'id';
        this._objectDisplayProperty = specification.objectDisplayProperty || 'name';
        // Validation (multiple style only)
        this._minimumCount = specification.minimumCount;
        this._maximumCount = specification.maximumCount;
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        var style = this._style;
        if(renderForm) {
            var choices = this._getChoices(instance);

            // When rendering repeated sections for the bundle, the instance choices aren't known, and need to
            // be filled in client side.
            var emptyChoicesNeedFill = '';
            if(!choices) {
                if((typeof(this._choices) === 'string') && instance._isEmptyInstanceForBundling) {
                    if(style !== "select") {
                        // TODO: Allow non-select instance choices in repeated sections by completing the client side code
                        complain("Instance choices can only be used in a repeated section when they use the select style.");
                    }
                    choices = [];
                    emptyChoicesNeedFill = ' data-oforms-need-fill="1"';
                } else {
                    complain("Failed to determine choices");
                }
            }

            // Start the Element and set up the HTML snippets according to the style chosen
            var html1, htmlSelected, html2, endHTML,
                groupingCount,      // for radio style, how many of the choices go in a group
                groupingNext = -1;  // count of how many cells to go before outputting new cell. -1 means === 0 condition will never be met
            if(style === "select") {
                // Select style
                output.push('<select name="', this.name, nameSuffix, '"', emptyChoicesNeedFill);
                this._outputCommonAttributes(output, true /* with class */);
                output.push('>');
                // Only the select style uses a prompt
                if(this._prompt !== false) { // explicit check with false
                    output.push('<option value="">', this._prompt /* already HTML escaped */, '</option>');
                }
                html1 = '<option value="';
                htmlSelected = '" selected>';
                html2 = '</option>';
                endHTML = '</select>';
            } else if(style === "multiple") {
                // NOTE: Reuses radio-vertical styles
                output.push('<div class="oforms-radio-vertical', additionalClass(this._class), '">');
                var multipleHTMLStart = '<label class="radio"><input type="checkbox" name="'+this.name+nameSuffix+',';
                var multipleNameIndex = 0;
                html1 = function() { return multipleHTMLStart+(multipleNameIndex++)+'" value="'; };
                htmlSelected = '" checked>';
                html2 = '</label>';
                endHTML = '</div>';
                // Make sure the value is an array
                if(!value) {
                    value = [];
                } else if(!_.isArray(value)) {
                    value = [value];
                }
            } else {
                // Vertical or horizontal radio style
                var element = (style === 'radio-vertical') ? 'div' : 'span';
                output.push('<', element, ' class="oforms-', style, additionalClass(this._class), '"');
                this._outputCommonAttributes(output);
                output.push('>');
                html1 = '<label class="radio"><input type="radio" name="'+this.name+nameSuffix+'" value="';
                htmlSelected = '" checked>';
                html2 = '</label>';
                endHTML = '</'+element+'>';
                // "Clusters" may add labels & explanations between some of the values
                if(this._radioClusters) {
                    var clusters = {};
                    _.each(this._radioClusters, function(cluster) {
                        var clusterWrapped = Object.create(cluster); // so that a used flag can be set without affecting definition
                        _.each(cluster.values, function(v) { clusters[v] = clusterWrapped; });
                    });
                    var html1base = html1;
                    html1 = function(value) {
                        var c = clusters[value];
                        if(!c || c._used) { return html1base; }
                        c._used = true;
                        var o = [];
                        if(c.label) {
                            o.push('<label class="control-label">', escapeHTML(textTranslate(c.label)), '</label>');
                        }
                        if(c.explanation) {
                            o.push('<div class="oforms-explanation">', paragraphTextToHTML(textTranslate(c.explanation)), '</div>');
                        }
                        o.push(html1base);
                        return o.join('');
                    };
                }
                // Grouping?
                if(this._radioGroups) {
                    output.push('<table class="oforms-radio-grouping"><tr><td>');
                    groupingNext = groupingCount = Math.ceil(choices.length / (1 * this._radioGroups));
                    endHTML = '</td></tr></table>' + endHTML;
                }
            }

            // Mutiple style needs different test
            var valueIsSelected = (style === "multiple") ?
                function(v) { return -1 !== _.indexOf(value, v); } :
                function(v) { return v === value; };
            // Make a function to create the starting HTML
            var startHtml = (typeof(html1) === "function") ?
                html1 :
                function() { return html1; };

            // Output all the choices
            // NOTE: ids used in the value attribute need to use toString() before passing to escapeHTML as they could be numbers
            if(choicesArrayOfArrays(choices)) {
                // Elements are [id,display]
                _.each(choices, function(c) {
                    output.push(startHtml(c[0]), escapeHTML(c[0].toString()), (valueIsSelected(c[0]) ? htmlSelected : '">'), escapeHTML(c[1]), html2);
                    if((--groupingNext) === 0) { output.push('</td><td>'); groupingNext = groupingCount; }
                });
            } else if(choicesArrayOfObjects(choices)) {
                // Elements are objects with two named properties, defaulting to 'id' and 'name'
                var idProp = this._objectIdProperty, displayProp = this._objectDisplayProperty;
                _.each(choices, function(c) {
                    var id = c[idProp];
                    output.push(startHtml(id), escapeHTML(id.toString()), (valueIsSelected(id) ? htmlSelected : '">'), escapeHTML(c[displayProp]), html2);
                    if((--groupingNext) === 0) { output.push('</td><td>'); groupingNext = groupingCount; }
                });
            } else {
                // Elements are strings, used for both ID and display text
                _.each(choices, function(c) {
                    var escaped = escapeHTML(c.toString());
                    output.push(startHtml(c), escaped, (valueIsSelected(c) ? htmlSelected : '">'), escaped, html2);
                    if((--groupingNext) === 0) { output.push('</td><td>'); groupingNext = groupingCount; }
                });
            }
            output.push(endHTML);

        } else {
            // Display the document
            var values;
            if(this._style === "multiple") {
                var t = this;
                values = _.map(value || [], function(value) {
                    return t._displayNameForValue(instance, value);
                });
            } else {
                values = [this._displayNameForValue(instance, value)];
            }
            // Filter against undefined and null, as toString doesn't work on them. Just doing
            // if(display) would prevent some values we want to output from being displayed.
            values = _.filter(values, function(v) { return v !== undefined && v !== null; });
            // Output the display values, using toString() in case the value was an number
            // and it wasn't found in the lookup.
            switch(values.length) {
                case 0: /* do nothing */ break;
                case 1: output.push(escapeHTML(values[0].toString())); break;
                default:
                    // Multiple values need wrapping in block elements to put them on new lines
                    _.each(values, function(display) {
                        output.push('<div class="one-of-many">', escapeHTML(display.toString()), '</div>');
                    });
                    break;
            }
        }
    },

    _replaceValuesForView: function(instance, context) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) { return; }
        this._setValueInDoc(context, this._displayNameForValue(instance, value));
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult, context) {
        var choices = this._getChoices(instance);
        var name = this.name + nameSuffix;
        // Need to convert the value to a number?
        var firstChoiceId;
        if(choicesArrayOfArrays(choices)) { firstChoiceId = choices[0][0]; }
        else if(choicesArrayOfObjects(choices)) { firstChoiceId = choices[0][this._objectIdProperty]; }
        var shouldConvertToNumber = (typeof(firstChoiceId) === 'number');
        // How to get a value
        var getValue = function(nameIndex) {
            var value = submittedDataFn((nameIndex !== undefined) ? (name+','+nameIndex) : name);
            if(!value || value.length === 0) { return undefined; } // Handle no value in the form
            return shouldConvertToNumber ? (value * 1) : value;
        };
        // "multiple" style needs different handling
        if(this._style === "multiple") {
            // Bit of an inefficient way of doing things, but doesn't require form parameter parsers to cope with multiple values.
            var values = [];
            for(var index = 0; index < choices.length; ++index) {
                var v = getValue(index);
                if(v !== undefined) { values.push(v); }
            }
            // Validation
            var min = this._minimumCount, max = this._maximumCount;
            if(undefined !== min && values.length < min) {
                validationResult._failureMessage = MESSAGE_CHOICES_ERR_MIN1 + min + MESSAGE_CHOICES_ERR_MIN2;
            } else if(undefined !== max && values.length > max) {
                validationResult._failureMessage = MESSAGE_CHOICES_ERR_MAX1 + max + MESSAGE_CHOICES_ERR_MAX2;
            }
            if(validationResult._failureMessage) {
                return values;  // can return empty array, unlike default behaviour below
            }
            // If empty, don't return anything so required validation catches it.
            return (values.length === 0) ? undefined : values;
        } else {
            return getValue();
        }
    },

    _getChoices: function(instance) {
        var choices = this._choices;
        if(typeof(choices) === 'string') {
            // Name of instance choices
            var instanceChoices = instance._instanceChoices;
            if(!instanceChoices) { return null; }   // this failure handled specially by caller
            choices = instanceChoices ? instanceChoices[choices] : undefined;
            if(!choices) {
                complain("instance", "Choices '"+this._choices+"' have not been set with instance.choices()");
            }
        }
        return choices;
    },

    _displayNameForValue: function(instance, value) {
        var choices = this._getChoices(instance);
        var display = value;
        // Lookup value for display, if the list of choices is not a simple array of strings
        if(choicesArrayOfArrays(choices)) {
            // Is [id,display] version of choices - attempt to find the display value
            var a = _.find(choices, function(c) { return c[0] === value; });
            if(a) { display = a[1]; }
        } else if(choicesArrayOfObjects(choices)) {
            // Is objects version of choices, attempt to find display value
            var idProp2 = this._objectIdProperty;
            var o = _.find(choices, function(c) { return c[idProp2] === value; });
            if(o) { display = o[this._objectDisplayProperty]; }
        }
        return display;
    }
});
