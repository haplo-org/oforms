
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

var lookupResultPickerClickHandler = function(evt) {
    evt.preventDefault();
    var index = $(this).prevAll("a").length;
    if(lookupResultPickerPickedFn) {
        lookupResultPickerPickedFn(index);
        lookupResultPickerPickedFn = undefined;        
    }
    $('#oforms-lookup-picker').hide();
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

// Do queries on keyup
oform.on('keyup', '.oforms-lookup-input', function() {
    var info = findLookupElementInfo(this);
    var lookupElement = $(this);
    // Clear the value input so invalid data isn't sent to the server
    info._valueInput.value = '';
    lookupElement.removeClass('oforms-lookup-valid');
    // Convert query to lower case and trim leading and trailing whitespace
    var query = this.value.toLowerCase().replace(/(^\s+|\s+$)/g,'');
    if(query === '') {
        // Nothing entered, stop now
        return;
    }
    // Cached result?
    var result = info._queryCache._queries[query];
    var useResult = function() {
        if(result.selectId) {
            // Entered text exactly matched a result. Set the field with the id and display text.
            info._valueInput.value = result.selectId;
            info._queryCache._idToDisplay[result.selectId] = result.selectDisplay;
            // Leave the value alone if it's the string we want to display with whitespace after it.
            // This allows users to type to select something when there are two options like "ABC" and "ABC XYZ".
            // Without this logic, it would be impossible to type the space in the latter option.
            if(lookupElement.val().replace(/\s+$/,'') !== result.selectDisplay) {
                lookupElement.val(result.selectDisplay);
            }
            lookupElement.addClass('oforms-lookup-valid');
            $('#oforms-lookup-picker').hide();
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
                        html.push('<a href="#">', escapeHTML(r), '</a>');
                    } else {
                        // Array of [id, display]
                        html.push('<a href="#">', escapeHTML(r[1]), '</a>');
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
                picker.on('mousedown', 'a', lookupResultPickerClickHandler).on('click', 'a', function(evt) { event.preventDefault(); });
            } else {
                // Put the html in the picker and display it
                picker.html(html.join('')).show();
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
oform.on('blur', '.oforms-lookup-input', function() {
    $('#oforms-lookup-picker').hide();
    lookupResultPickerPickedFn = undefined;
});

