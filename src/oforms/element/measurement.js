
makeElementType("measurement", {

    // Specification options:
    //   quantity - which quantity should be measured
    //   integer - true if the value should be an integer
    //   defaultUnit - which unit should be used by default
    //   includeCanonical - true if the value should include the measurement converted to the canonical units, with the unit name as property name

    // Implementation notes:
    //   * Composed of a number and choice element
    //   * When decoding from the form, the value object is presentated to the number and choice elements as their context
    //   * Some fun and games around handling the validation failures, see comments in _decodeValueFromFormAndValidate()
    //   * Choice of unit is stored for rerendering in every case.

    // TODO: Consider validating the units input. Currently if the browser sends something not in the list, exceptions about undefined values will be thrown.

    // TODO: Can minimum and maximum values be done nicely here? Would have to specify a unit and convert as appropraite. Error messages should use the units the user chose.

    _initElement: function(specification, description) {
        // Options
        this._includeCanonical = specification.includeCanonical;
        // Get quantity information
        var qi = this._quantityInfo = measurementsQuantities[specification.quantity];
        if(!(qi)) {
            complain("spec", "Measurement quantity "+specification.quantity+" not known");
        }
        // Build number and choice specifications for the elements forming this compound element
        var numberSpec = {
            name: this.name + ".v", _isWithinCompoundElement: true,
            required: this._required,   // see comments in _decodeValueFromFormAndValidate()
            id: this._id, placeholder: this._placeholder, // but not this._class
            path: 'value'
        };
        delete this._required;          // see comments in _decodeValueFromFormAndValidate()
        var choiceSpec = {
            name: this.name + ".u", _isWithinCompoundElement: true,
            path: 'units',
            prompt: false,
            choices: qi.choices,
            defaultValue: specification.defaultUnit || qi.defaultUnit
        };
        // Make number and choice elements -- specification might mean the number is an integer
        this._numberElement = new (elementConstructors[specification.integer ? "integer" : "number"])(numberSpec, description);
        this._choiceElement = new (elementConstructors["choice"])(choiceSpec, description);
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) {
            value = {};
            var previouslySubmittedUnits = instance._rerenderData[this.name+nameSuffix];
            if(previouslySubmittedUnits) {
                value.units = previouslySubmittedUnits;
            }
        }
        output.push('<span class="oforms-measurement', additionalClass(this._class), '">');
        if(renderForm) {
            var validationFailures = instance._validationFailures;
            // Some day we might find a unit which needs the elements output in a different order.
            // Will add a flag into the measurement info to trigger this.
            this._numberElement._pushRenderedHTML(instance, renderForm, value /* context */, nameSuffix, validationFailures[this._numberElement.name+nameSuffix], output);
            this._choiceElement._pushRenderedHTML(instance, renderForm, value /* context */, nameSuffix, validationFailures[this._choiceElement.name+nameSuffix], output);
        } else {
            if(typeof(value.value) === "number") {
                output.push(value.value);
                if(typeof(value.units) === "string") {
                    // Output units using the display name, if it has one.
                    output.push(' ', escapeHTML(this._quantityInfo.units[value.units].display || value.units));
                }
            }
        }
        output.push('</span>');
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        // Fill in the value, which is an object, by presenting it to the two elements as their context
        var value = {};
        this._numberElement._updateDocument(instance, value /* context */, nameSuffix, submittedDataFn);
        this._choiceElement._updateDocument(instance, value /* context */, nameSuffix, submittedDataFn);
        // Store the units in case they're needed for rerendering
        instance._rerenderData[this.name+nameSuffix] = value.units;
        // Use the validation failure message from the number field so the message is displayed,
        // for this field.
        // The number field's validation failure isn't rendered by the template, as that element
        // is rendered here without going through the template.
        // Note that the number field also handles the "required" constraint, so the property is
        // moved to the number field specification and deleted from this element.
        var validationFailures = instance._validationFailures;
        var numberValidationFailure = validationFailures[this._numberElement.name+nameSuffix];
        if(numberValidationFailure) {
            validationResult._failureMessage = numberValidationFailure;
        }
        // Return quickly if the number wasn't decoded successfully
        if(undefined === value.value) { return undefined; }
        // Add value converted to canonical units?
        if(this._includeCanonical) {
            var qi = this._quantityInfo;
            var ui = qi.units[value.units];
            value[qi.canonicalUnit] = ui.add ? ((value.value + ui.add) * ui.multiply) : (value.value * ui.multiply);
        }
        return value;
    }
});
