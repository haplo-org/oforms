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
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        var style = this._style;
        if(renderForm) {
            var choices = this._getChoices(instance);

            // Start the Element and set up the HTML snippets according to the style chosen
            var html1, htmlSelected, html2, endHTML,
                groupingCount,      // for radio style, how many of the choices go in a group
                groupingNext = -1;  // count of how many cells to go before outputting new cell. -1 means === 0 condition will never be met
            if(style === "select") {
                // Select style
                output.push('<select name="', this.name, nameSuffix, '"');
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
                // Grouping?
                if(this._radioGroups) {
                    output.push('<table class="oforms-radio-grouping"><tr><td>');
                    groupingNext = groupingCount = Math.ceil(choices.length / (1 * this._radioGroups));
                    endHTML = '</td></tr></table>' + endHTML;
                }
            }

            // Output all the choices
            // NOTE: ids used in the value attribute need to use toString() before passing to escapeHTML as they could be numbers
            if(choicesArrayOfArrays(choices)) {
                // Elements are [id,display]
                _.each(choices, function(c) {
                    output.push(html1, escapeHTML(c[0].toString()), ((c[0] === value) ? htmlSelected : '">'), escapeHTML(c[1]), html2);
                    if((--groupingNext) === 0) { output.push('</td><td>'); groupingNext = groupingCount; }
                });
            } else if(choicesArrayOfObjects(choices)) {
                // Elements are objects with two named properties, defaulting to 'id' and 'name'
                var idProp = this._objectIdProperty, displayProp = this._objectDisplayProperty;
                _.each(choices, function(c) {
                    var id = c[idProp];
                    output.push(html1, escapeHTML(id.toString()), ((id === value) ? htmlSelected : '">'), escapeHTML(c[displayProp]), html2);
                    if((--groupingNext) === 0) { output.push('</td><td>'); groupingNext = groupingCount; }
                });
            } else {
                // Elements are strings, used for both ID and display text
                _.each(choices, function(c) {
                    var escaped = escapeHTML(c.toString());
                    output.push(html1, escaped, ((c === value) ? htmlSelected : '">'), escaped, html2);
                    if((--groupingNext) === 0) { output.push('</td><td>'); groupingNext = groupingCount; }
                });
            }
            output.push(endHTML);

        } else {
            // Display the document
            var display = this._displayNameForValue(instance, value);
            // Output the display value, using toString() in case the value was an number
            // and it wasn't found in the lookup. Check against undefined and null, as toString
            // doesn't work on them. Just doing if(display) would prevent some values we
            // want to output from being displayed.
            if(display !== undefined && display !== null) {
                output.push(escapeHTML(display.toString()));
            }
        }
    },

    _replaceValuesForView: function(instance, context) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) { return; }
        this._setValueInDoc(context, this._displayNameForValue(instance, value));
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var choices = this._getChoices(instance);
        var value = submittedDataFn(this.name + nameSuffix);
        // Handle no value in the form
        if(!value || value.length === 0) { return undefined; }
        // Need to convert the value to a number?
        var firstChoiceId;
        if(choicesArrayOfArrays(choices)) { firstChoiceId = choices[0][0]; }
        else if(choicesArrayOfObjects(choices)) { firstChoiceId = choices[0][this._objectIdProperty]; }
        if(typeof(firstChoiceId) === 'number') {
            value = value * 1;
        }
        return value;
    },
    
    _getChoices: function(instance) {
        var choices = this._choices;
        if(typeof(choices) === 'string') {
            // Name of instance choices
            var instanceChoices = instance._instanceChoices;
            if(!instanceChoices && instance._isEmptyInstanceForBundling) {
                // When rendering repeated sections for the bundle, the instance choices aren't known.
                // TODO: Allow instance choices in repeated sections by using client side code and a data attribute.
                complain("instance", "Instance choices cannot be used in a repeated section.");
            }
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
