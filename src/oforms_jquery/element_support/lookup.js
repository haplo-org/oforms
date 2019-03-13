
// TODO: Keyboard selection of results for lookup elements


// Per-endpoint cache of results
// TODO: Expiring entries from the cache to save memory
var lookupEndpointCache = {};
// Cache entries have keys:
//   _queries - map of query string to response from server
//   _idToDisplay - map of value id to display string, filled in when things are selected

// --------------------------------------------------------------------------------------------------------

// Function to assemble information about the lookup, given a DOM element within the containing SPAN.
var findLookupElementInfo = function(domElement) {
    var containingSpan = $(domElement).parents('.oforms-lookup').first();
    var valueInput = $('input[type=hidden]', containingSpan)[0];
    var name = elementBaseName(valueInput.name);
    var elementInfo = bundledElements[name];
    var dataSource = bundle.dataSource[elementInfo.dataSource];
    var cache = lookupEndpointCache[dataSource.endpoint];
    if(undefined === cache) {
        lookupEndpointCache[dataSource.endpoint] = cache = {_queries:{}, _idToDisplay:{}};
    }
    return {
        _name: name,
        _valueInput: valueInput,
        _containingSpan: containingSpan,
        _dataSource: dataSource,
        _queryCache: cache
    };
};

// --------------------------------------------------------------------------------------------------------

// Handling the result picker
var lookupResultPickerPickedFn; // function to call with index of result

var lookupResultPickerActivateItem = function(item) {
    var index = $(item).prevAll('.item').length;
    if(lookupResultPickerPickedFn) {
        lookupResultPickerPickedFn(index);
        lookupResultPickerPickedFn = undefined;
    }
    lookupResultPickerHide();
};

var lookupResultPickerSelectItem = function(item) {
    $('.item', '#oforms-lookup-picker').removeClass('selected');
    if(item) { $(item).addClass('selected'); }
};

var lookupResultPickerHide = function() {
    $('#oforms-lookup-picker').hide().data('loadedHtml', null);
    lookupResultPickerPickedFn = undefined;
};

// --------------------------------------------------------------------------------------------------------

// When the element is clicked, store the value if it's useful
oform.on('focus', '.oforms-lookup-input', function() {
    var info = findLookupElementInfo(this);
    if($(this).hasClass('oforms-lookup-valid')) {
        // Has valid data, make sure it's cached
        if(undefined === info._queryCache._idToDisplay[info._valueInput.value]) {
            info._queryCache._idToDisplay[info._valueInput.value] = this.value;
        }
    }
});

// --------------------------------------------------------------------------------------------------------

var lookupResultPickerNavigation = {
    38: -1, // Up arrow
    40: 1, // Down arrow
    34: 3, // Page down
    33: -3 // Page up
};
var ENTER_KEY = 13;

// Do result navigation on keydown, to detect key repeats properly
oform.on('keydown', '.oforms-lookup-input', function(event) {
    var picker;
    if(event.which in lookupResultPickerNavigation) {
        var delta = lookupResultPickerNavigation[event.which];
        picker = $('#oforms-lookup-picker');
        var entries = $('.item', picker);
        if(!picker.is(':visible') || entries.length === 0) {
            return;
        }
        var currentPosition = entries.index($('.selected', picker));
        if(currentPosition < 0) {
            currentPosition = (delta < 0) ? entries.length : -1;
        }
        var new_position = currentPosition + delta;
        var clamp = entries.length;
        new_position = ((new_position % clamp) + clamp) % clamp;
        lookupResultPickerSelectItem(entries[new_position]);
        event.preventDefault();
        return false;
    }
    if(event.which === ENTER_KEY) {
        picker = $('#oforms-lookup-picker');
        var selected = $('.selected', picker);
        if(!selected.length){
            return;
        }
        lookupResultPickerActivateItem(selected);
        $(this).keyup();
        event.preventDefault();
        return false;
    }
});

// --------------------------------------------------------------------------------------------------------

// Do queries on keyup so the input value is up-to-date
// input needed to handle case where the clear button is click in IE
oform.on('keyup input', '.oforms-lookup-input', function(event) {
    var info = findLookupElementInfo(this);
    var lookupElement = $(this);
    var originalValue = lookupElement.val();
    // If the user has just picked a value, don't re-query it
    if(originalValue === lookupElement.data("pickedDisplayValue")) {
        return;
    }
    // Clear the value input so invalid data isn't sent to the server
    info._valueInput.value = '';
    lookupElement.removeClass('oforms-lookup-valid');
    // Convert query to lower case and trim leading and trailing whitespace
    var query = originalValue.toLowerCase().replace(/(^\s+|\s+$)/g,'');
    if(query === '') {
        return lookupResultPickerHide();
    }
    // Cached result?
    var result = info._queryCache._queries[query];
    var useResult = function() {
        var currentValue = lookupElement.val();
        if(result.selectId) {
            // Current text exactly matched a result. Set the field with the id and display text.
            info._valueInput.value = result.selectId;
            info._queryCache._idToDisplay[result.selectId] = result.selectDisplay;
            // Leave the value alone if the input has been changed since the query was sent to the server.
            // If any whitespace exists after the matching value in the original input, append that onto the
            // new value.  This allows users to type to select something when there are two options
            // like "ABC" and "ABC XYZ". Without this logic, it would be impossible to type the space in the
            // latter option.
            if(originalValue.toLowerCase() == currentValue.toLowerCase() && query !== lookupElement.data("lastQuery")) {
                var tail = lookupElement.val().slice(result.selectDisplay.length);
                var newValue = result.selectDisplay + tail;
                lookupElement.val(newValue);
                lookupElement.data("lastQuery", query);
            }
            lookupElement.addClass('oforms-lookup-valid');
            lookupResultPickerHide();
        } else {
            // No exact match - build HTML for the lookup
            var html = [];
            if(result.message) {
                // Display a message from the server instead of the results.
                // Allows the server to set a custom message for when there are no matches.
                html.push('<span class="oforms-lookup-message">', escapeHTML(result.message), '</span>');
            } else {
                // Display the results
                _.each(result.results, function(r) {
                    if(typeof(r) === 'string') {
                        // Just a display string
                        html.push('<span class="item">', escapeHTML(r), '</span>');
                    } else {
                        // Array of [id, display, pickerDisplay] with pickerDisplay optional and defaulting to display
                        html.push('<span class="item">', escapeHTML(r[2] || r[1]), '</span>');
                    }
                });
            }
            // Create picker, or update existing picker element
            var picker = $('#oforms-lookup-picker');
            if(picker.length === 0) {
                // Create the picker
                html.unshift('<div id="oforms-lookup-picker">'); html.push("</div>");
                $(document.body).append(html.join(''));
                picker = $('#oforms-lookup-picker');
                // Register event handler for mousedown, and stop clicks from doing anything.
                picker.on('mousedown', '.item', function(event) {
                    // Don't allow focus to leave the input..
                    event.preventDefault();
                }).on('mouseover', '.item', function(event) {
                    // Like a WIMP menu
                    lookupResultPickerSelectItem(this);
                }).on('mouseup', '.item', function(event) {
                    // Mouseup to allow user to 'change their mind' after clicking, as per standards
                    lookupResultPickerActivateItem(this);
                    event.preventDefault();
                });
            } else {
                // If the content of the picker has changed, then put the html
                // in the picker and display it.
                var content = html.join('');
                if(content !== picker.data('loadedHtml')) {
                    picker.html(content);
                    picker.data('loadedHtml', content);
                }
                // If the input box is now blank (due to delay), then
                // don't show the picker
                if(currentValue.replace(/\s+/g, '') !== '') {
                    picker.show();
                }
            }
            // Position the picker on the page
            positionClone(picker, lookupElement, 0, lookupElement.height() + 3);
            // Store a function for using the result
            lookupResultPickerPickedFn = function(index) {
                var r = result.results[index];
                var id, display;
                if(typeof(r) === 'string') {
                    id = r; display = r;
                } else {
                    id = r[0]; display = r[1];
                }
                info._valueInput.value = id;
                info._queryCache._idToDisplay[id] = display;
                lookupElement.val(display).addClass('oforms-lookup-valid');
                lookupElement.data("pickedDisplayValue", display);
            };
        }
    };
    if(result) {
        // Have cached result, use it now
        useResult();
    } else {
        // Fetch the results from the server, then use them
        var url = info._dataSource.endpoint;
        url += ((-1 !== url.indexOf('?')) ? '&q=' : '?q=') + encodeURIComponent(query);
        $.get(url, function(data) {
            result = data;
            info._queryCache._queries[query] = result;
            useResult();
        });
    }
});

// --------------------------------------------------------------------------------------------------------

// Hide the results picker when focus leaves
oform.on('blur', '.oforms-lookup-input', lookupResultPickerHide);

