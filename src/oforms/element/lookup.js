
makeElementType("lookup", {

    _initElement: function(specification, description) {
        if(typeof(this._dataSourceName = specification.dataSource) !== "string") {
            complain("spec", "No data source defined for "+this.name);
        }
        description._setRequirementsFlagsForDataSource(this._dataSourceName);
        description.requiresClientUIScripts = true;
    },

    _bundleClientRequirements: function(emptyInstance, bundle) {
        // Ensure information about the data source is included in the bundle
        emptyInstance.description._bundleDataSource(this._dataSourceName, bundle);
        // Client side information for this element
        bundle.elements[this.name] = {
            dataSource: this._dataSourceName
        };
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        // Get the value, determine the display name using the data source
        var value = this._getValueFromDoc(context);
        if(undefined === value) {
            value = '';
        } else if(typeof value !== "string") {
            value = value.toString();
        }
        var displayName = this._displayNameForValue(instance, value);
        if(displayName === '') {
            // No display name, try and get one from the entered text in the previous form submission
            var enteredText = instance._rerenderData[this.name + nameSuffix];
            if(enteredText) { displayName = enteredText; }
        }
        // Build output HTML
        if(renderForm) {
            output.push('<span class="oforms-lookup', additionalClass(this._class), '"');
            outputAttribute(output, ' id="', this._id);
            output.push('><input type="hidden" name="', this.name, nameSuffix, '" value="', escapeHTML(value),
                '"><input type="text" name="', this.name, '.d', nameSuffix, '" autocomplete="off" class="oforms-lookup-input');
            if(value !== '') {
                // Add additional class to flag that the lookup is valid
                output.push(' oforms-lookup-valid');
            }
            output.push('" value="', escapeHTML(displayName), '"');
            outputAttribute(output, ' placeholder="', this._placeholder);
            outputAttribute(output, ' data-oforms-note="', this._guidanceNote);
            output.push('></span>');
        } else {
            output.push(escapeHTML(displayName));
        }
    },

    _replaceValuesForView: function(instance, context) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) { return; }
        this._setValueInDoc(context, this._displayNameForValue(instance, value));
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var text = submittedDataFn(this.name + nameSuffix);
        if(text.length === 0) {
            // Nothing was selected, preserve the entered value for rerendering
            instance._rerenderData[this.name + nameSuffix] = submittedDataFn(this.name + '.d' + nameSuffix);
        } else {
            return text;
        }
    },

    _displayNameForValue: function(instance, value) {
        var dataSource = instance.description._getDataSource(this._dataSourceName);
        return (value === '') ? '' : (dataSource.displayNameForValue(value) || value);
    }
});
