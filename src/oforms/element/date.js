
var /* seal */ MONTH_NAMES_DISP = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];

var validateDate = function(dateStr) {
    var isValidDate = false;
    if(dateStr && dateStr.match(/^\d\d\d\d-\d\d-\d\d$/)) {
        // Attempt check the date is actually valid
        var c = dateStr.split('-');
        var testYear = 2000+((1*c[0]) % 1000);  // Work within supported range of dates
        var testMonth = (1*c[1]) - 1;
        var testDay = 1*c[2];
        try {
            var d = new Date(testYear, testMonth, testDay);
            if(d && (d.getFullYear() === testYear) && (d.getMonth() === testMonth) && (d.getDate() === testDay)) {
                isValidDate = true;
            }
        } catch(e) {
            // if there's an exception, isValidDate won't be set to true
        }
    }
    return isValidDate;
};

// ------------------------------------------------------------------------------------------------------------

makeElementType("date", {

    _initElement: function(specification, description) {
        description.requiresClientUIScripts = true;
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        var value = this._getValueFromDoc(context);
        var displayDate;
        if(typeof value === "string" && validateDate(value)) {
            var ymd = value.split('-');
            // TODO: Support non-English date formats
            displayDate = ymd[2]+' '+MONTH_NAMES_DISP[1*ymd[1]]+' '+ymd[0];
        } else {
            value = '';
        }
        if(validationFailure) {
            // If re-rendering a form with invalid data, repeat the text the user entered
            displayDate = instance._rerenderData[this.name + nameSuffix] || '';
        }
        if(renderForm) {
            output.push('<span class="oforms-date', additionalClass(this._class), '"');
            outputAttribute(output, ' id="', this._id);
            output.push('><input type="hidden" name="', this.name, nameSuffix, '" value="', escapeHTML(value),
                // Note that displayDate could be any old string recieved from the user
                '"><input type="text" name="', this.name, '.d', nameSuffix, '" class="oforms-date-input" value="', escapeHTML(displayDate || ''), '"');
            outputAttribute(output, ' placeholder="', this._placeholder);
            outputAttribute(output, ' data-oforms-note="', this._guidanceNote);
            output.push('></span>');
        } else {
            if(displayDate) {
                output.push(escapeHTML(displayDate));
            }
        }
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var dateStr = submittedDataFn(this.name + nameSuffix);
        if(validateDate(dateStr)) {
            return dateStr;
        } else if(dateStr) {
            // If the user entered something, tell them it was invalid.
            validationResult._failureMessage = MESSAGE_DATE_INVALID;
            // And store their entered data for when it's rendered again.
            instance._rerenderData[this.name + nameSuffix] = submittedDataFn(this.name + '.d' + nameSuffix);
            return undefined;
        }
    },

    _replaceValuesForView: function(instance, context) {
        var value = this._getValueFromDoc(context);
        if(typeof value === "string" && validateDate(value)) {
            var ymd = value.split('-');
            // TODO: Support non-English date formats in date view representation
            var viewDate = ymd[2]+' '+MONTH_NAMES_DISP[1*ymd[1]]+' '+ymd[0];
            this._setValueInDoc(context, viewDate);
        }
    },

    _valueWouldValidate: function(value) {
        return (value !== undefined) && validateDate(value);
    }
});
