
// Attach handlers to forms for repeating sections

// Implement the Add buttons
var repeatingSectionAddRow = function(referenceElement) {
    // Find the repeating section this add button refers to
    var repeatingSection = $(referenceElement).parents(".oforms-repeat").first();   // need to use parents().first() because parent() only looks one level up
    // Find the form element which represents this repeating section in the DOM
    //   - the name is used to determine the name and suffix for the contained elements
    //   - the value contains information about which indicies are in use, reflecting the shadow rows on the server
    var indiciesFormElement = $(".oforms-idx", repeatingSection)[0];
    // Get the bundled information
    var bundled = bundledElements[elementBaseName(indiciesFormElement.name)];
    // Find the list of current row indicies, and determine the new one
    var indiciesInfo = indiciesFormElement.value.split('/'); // indiciesInfo is [version, indicies list, next index]
    var newIndex = indiciesInfo[2] * 1;
    // Update the indicies data hidden form element value
    indiciesInfo[1] += ((indiciesInfo[1].length > 0) ? ' ' : '') + newIndex;
    indiciesInfo[2] = newIndex + 1;
    // Check number of rows against bundled.maximumCount
    if(undefined !== bundled.maximumCount) {
        // Count the current number of rows - easier to do it via the indiciesInfo than trying to query the DOM
        var currentRowCount = indiciesInfo[1].split(' ').length;
        if(currentRowCount > bundled.maximumCount) {
            // Too many rows to add a new one - stop now before the DOM is modified.
            return;
        } else if(currentRowCount == bundled.maximumCount) {
            // Will now be at the maximum count, so visually change the style of the add button to show the user.
            $('.oforms-add-btn', repeatingSection).last().addClass('oform-add-btn-disabled');
        }
    }
    // Store the indicies info into the form element, after the maximum length validation has been passed
    indiciesFormElement.value = indiciesInfo.join('/');
    // Find the DOM element where the rows should be inserted
    var rowsParent = $('.oforms-append', repeatingSection).first(); // need first() because of nested repeating sections
    // But if it doesn't have an explicit insertation element, default to the main section element
    if(rowsParent.length === 0) { rowsParent = repeatingSection; }
    // Work out the new suffix
    var suffix = elementNameSuffix(indiciesFormElement.name) + '.' + newIndex;
    // Use the blank HTML from the bundle to create the new DOM elements, rewriting the name attributes to include the generated suffix.
    var newRow = $(bundled.blank);
    $('input,textarea,select', newRow).each(function() {
        this.name = this.name.replace('_!_', suffix);
    });
    // Custom initialisation for any other elements
    _.each(onCreateNewRepeatingSectionRow, function(f) { f.call(this, newRow, rowsParent); });
    // Insert the new row into the DOM
    rowsParent.append(newRow);
    // And return for caller to use
    return newRow;
};

oform.on("click", ".oforms-add-btn", function(event) {
    event.preventDefault();
    repeatingSectionAddRow(this);
});

// Implement the Delete buttons
oform.on("click", ".oforms-delete-btn", function(event) {
    event.preventDefault();
    // Find the row this applies to
    var row = $(this).parents('.oforms-repetition').first();   // need to use parents().first() because parent() only looks one level up
    // Hide it from the user, rather than removing it from the DOM
    row.hide();
    // How many other VISIBLE row elements are there before it?
    var previousCount = row.prevAll(".oforms-repetition:visible").length;
    // Update the row information by removing that row index from the list
    var indiciesFormElement = $(".oforms-idx", $(this).parents(".oforms-repeat").first())[0];
    var indiciesInfo = indiciesFormElement.value.split('/'); // indiciesInfo is [version, indicies list, next index]
    var indicies = indiciesInfo[1].split(' ');
    indicies.splice(previousCount, 1);
    indiciesInfo[1] = indicies.join(' ');
    indiciesFormElement.value = indiciesInfo.join('/');
    // Make sure the Add button doesn't have the disabled style
    $('.oforms-add-btn', $(this).parents('.oforms-repeat').first()).last().removeClass('oform-add-btn-disabled');
});
