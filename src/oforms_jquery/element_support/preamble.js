
$(document).ready(function() {
    // Attach handlers to forms, making the bundle available.
    $('.oform').each(function() {
        // Make sure a bundle is available
        var bundle = registeredBundles[this.id];
        if(undefined === bundle) {
            // No bundle was registered. Make a blank bundle available so that everything else
            // can assume there is a bundle, even if it doesn't contain anything.
            bundle = {
                elements: {}
            };
        }
        // Shortcut for accessing the elements
        var bundledElements = bundle.elements;
        // Make a jQuery object for attaching handlers
        var oform = $(this);

        // Now each of the element support functions will add their handlers with
        //
        //    oform.on(...);
        //
        // and use the variables
        //
        //    bundle
        //    bundledElements
        //
        // to access the information from the server.

        // ...

// List of functions to call when initialising a new repeating section element
// Defined here, so each form has own local list of functions; otherwise you'd
// get one function per form on the page.
var onCreateNewRepeatingSectionRow = [];

// This function is terminated in the postamble.js file.
