
var compareDates = function(from, to, data) {
    if(!data.operation) { return; }
    if(data.delta) {
        var delta = (data.delta || 0) * 24 * 60 * 60 * 1000; // extra days in milliseconds
        from += delta;
    }
    var error = data.errorMessage || "Date is out of range";
    if((data.operation === ">" && to <= from) ||
        (data.operation === "<" && to >= from)) {
        return error;
    }
};

var standardCustomValidationFunctions = {
    "std:validation:compare_to_today": function(value, data, context, document, externalData) {
        var today = new Date();
        var from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        var to = new Date(value).getTime();
        return compareDates(from, to, data);
    },
    "std:validation:compare_to_date": function(value, data, context, document, externalData) {
        if(!data.path && !data.externalData) { return; }
        var to = new Date(value).getTime();
        var from = getByPathOrExternal(context, data, externalData);
        if(!from) { return; } // might happen if the date to compare fails validation
        from = new Date(from);
        if(isNaN(from)) { return; }
        from = from.getTime();
        return compareDates(from, to, data);
    }
};
