
makeElementType("boolean", {

    _initElement: function(specification, description) {
        this._trueLabel  = escapeHTML(specification.trueLabel  || MESSAGE_DEFAULT_BOOLEAN_LABEL_TRUE);
        this._falseLabel = escapeHTML(specification.falseLabel || MESSAGE_DEFAULT_BOOLEAN_LABEL_FALSE);
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        if(renderForm) {
            output.push('<span class="oforms-boolean', additionalClass(this._class), '"');
            this._outputCommonAttributes(output);
            output.push(                
                '>',
                    '<label class="radio"><input type="radio" name="', this.name, nameSuffix, '" value="t"', ((value === true) ? ' checked' : ''),  '>', this._trueLabel,  '</label>',
                    '<label class="radio"><input type="radio" name="', this.name, nameSuffix, '" value="f"', ((value === false) ? ' checked' : ''), '>', this._falseLabel, '</label>',
                '</span>'
            );
        } else {
            if(value !== undefined) {
                output.push(value ? this._trueLabel : this._falseLabel);
            }
        }
    },

    _replaceValuesForView: function(instance, context) {
        var value = this._getValueFromDoc(context);
        if(undefined === value) { return; }
        this._setValueInDoc(context, value ? this._trueLabel : this._falseLabel);
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var text = submittedDataFn(this.name + nameSuffix);
        if(text === 't') { return true; }
        if(text === 'f') { return false; }
        return undefined;
    }
});
