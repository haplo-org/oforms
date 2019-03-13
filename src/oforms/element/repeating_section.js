
var RepeatingSectionElementMethods = _.extend({}, SectionElementMethods, {

    // The forms system avoids deleting other data in the JSON document, so, to track this,
    // the array elements are held in a "shadow" row inside the instance, then the array in the
    // document formed from this.
    //
    // The shadow row is the definite source for the data, and the array in the document is
    // recreated from the data in the shadow row every time the document is updated.
    //
    // The shadow row contains objects, which have keys:
    //   _data - the original object/value from the JSON document, modified
    //   _inDocument - true if this row is in the document
    //
    // The code is very careful to use the original objects, and not recreate them, so that
    // references held by user code are still valid.

    // ------------------------------------------------------------------------------------------------------

    // Inherits methods from SectionElementMethods

    // Make base class methods available.
    _initElementSectionBase: SectionElementMethods._initElement,
    _bundleClientRequirementsBase: SectionElementMethods._bundleClientRequirements,

    // Normal repeating sections output an empty row so there's always something to fill in
    _shouldOutputEmptyRow: true,

    _initElement: function(specification, description) {
        this._initElementSectionBase(specification, description);
        // Flag bundle requirements in description
        description.requiresBundle = true;
        description.requiresClientUIScripts = true;
        // Options
        this._allowDelete = specification.allowDelete;
        this._allowAdd = ("allowAdd" in specification) ? specification.allowAdd : true;
        this._required = specification.required;    // slightly different handling to normal elements
        this._minimumCount = specification.minimumCount;
        this._maximumCount = specification.maximumCount;
        // Work out if this is an array of values (rather than an array of objects)
        this._isArrayOfValues = ((this._elements.length === 1) && (this._elements[0].valuePath === '.'));
        // TODO: Repeating section validation to ensure that the '.' value path is used correctly.
    },

    _bundleClientRequirements: function(emptyInstance, bundle) {
        // Render a blank row and bundle it in for use when a new row is added on the client side.
        // Use the _!_ marker for the suffix in names for search and replace with the correct
        // suffix for the new row.
        var blankRowHTML = [];
        this._pushRenderedRowsHTML(
            emptyInstance,
            true, // rendering form
            [this._renderRow(emptyInstance, true /* rendering form */, {}, '_!_' /* special marker for suffix */)],
            blankRowHTML,
            true /* only render the row */
        );
        var bundled = bundle.elements[this.name] = {blank: blankRowHTML.join('')};
        // Include relevant validation information
        if(undefined !== this._maximumCount) {
            bundled.maximumCount = this._maximumCount;
        }
        // Section base class
        this._bundleClientRequirementsBase(emptyInstance, bundle);
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        // Setup for rendering
        var elementContexts = this._getValuesArrayFromDoc(context);
        if(undefined === elementContexts) { elementContexts = []; }
        // Omit empty repeating sections for display?
        if(!renderForm && elementContexts.length === 0 && this._renderDocumentOmitEmpty) {
            return;
        }
        // Get the shadow row
        var shadow = this._getShadowRows(instance, nameSuffix, elementContexts);
        // Work out the indicies of the rows output
        var indicies = [];
        for(var l = 0; l < shadow.length; ++l) {
            // Add the index of this row, only if the row is currently in the document
            // Be tolerant of missing entries in the shadow row.
            if(shadow[l] && shadow[l]._inDocument) {
                indicies.push(l);
            }
        }
        // The client side doesn't know what's the next index, because it can't see the shadow row
        var clientSideNextIndex = shadow.length;
        // Always output at least one row, unless overridden
        if((indicies.length === 0) && this._shouldOutputEmptyRow) {
            indicies.push(shadow.length);   // use an index which isn't already in use
            clientSideNextIndex++;          // to take into account this new blank row
        }
        // Output the containing DIV
        output.push('<div class="oforms-repeat">');
        // For forms, output a hidden value with the indicies of the rows (which must go first in that div)
        if(renderForm) {
            output.push('<input type="hidden" class="oforms-idx" name="', this.name, nameSuffix, '" value="0/',
                indicies.join(' '), '/', clientSideNextIndex, '">');
        }
        // Render each of the visible elements in this section
        var rows = [];
        for(l = 0; l < indicies.length; ++l) {
            var idx = indicies[l];
            var shadowEntry = shadow[idx];
            rows.push(this._renderRow(instance, renderForm, shadowEntry ? shadowEntry._data : {}, nameSuffix+'.'+idx));
        }
        this._pushRenderedRowsHTML(instance, renderForm, rows, output);
        // Finish the HTML output by closing the containing DIV
        output.push('</div>');
    },

    _updateDocument: function(instance, context, nameSuffix, submittedDataFn) {
        if(this._shouldExcludeFromUpdate(instance, context)) { return false; }
        var isArrayOfValues = this._isArrayOfValues;
        var elementContexts = this._getValuesArrayFromDoc(context);
        var arrayWasCreated;
        if(elementContexts === undefined) {
            elementContexts = [];
            arrayWasCreated = true;
        }
        // Get the shadow row, which contains the actual data for rendering
        var shadow = this._getShadowRows(instance, nameSuffix, elementContexts);
        // Mark all the shadow row entries as not in the document
        for(var l = 0; l < shadow.length; ++l) {
            // Ensure there's an entry for each index into the shadow row, then set the flag to false
            if(!shadow[l]) { shadow[l] = {_data:{}}; }
            shadow[l]._inDocument = false;
        }
        // Get the list of rows in the form
        var formRowData = (submittedDataFn(this.name + nameSuffix) || '').split('/');
        var formRowIndicies = (!(formRowData[1]) || formRowData[1].length === 0) ? [] : formRowData[1].split(' '); // check first because "".split() returns [""] not []
        // Read back the rows, using the form row indicies given, and updating the elements
        // in the shadow row and rebuilding the original array object.
        elementContexts.length = 0; // truncate to the empty array
        var userHasEnteredValue = false;
        for(l = 0; l < formRowIndicies.length; ++l) {
            var rowIndex = formRowIndicies[l] * 1; // convert to int
            // Make sure there's a shadow row entry for this element, which might have been created on the client side
            var shadowEntry = shadow[rowIndex];
            if(undefined === shadowEntry) {
                shadow[rowIndex] = shadowEntry = {
                    _data: {},
                    _inDocument: false   // updated next
                };
            }
            // Store the current validation failures, so changes by this document row can be
            // discarded if it doesn't have any user entered values at all. This isn't the most
            // elegant or object orientated way of doing it, but avoids a heavyweight implementation.
            var currentValidationFailures = instance._validationFailures;
            instance._validationFailures = {};
            // Retrieve the value and update shadow row entry status
            if(this._updateDocumentRow(instance, shadowEntry._data, nameSuffix+'.'+rowIndex, submittedDataFn)) {
                // User has entered a value somewhere in the row, so mark it as being in the document
                shadowEntry._inDocument = true;
                // Push the value into the original array in the document.
                elementContexts.push(isArrayOfValues ? shadowEntry._data['.'] : shadowEntry._data);
                // Merge in the validation failures
                instance._validationFailures = _.extend(currentValidationFailures, instance._validationFailures);
                // Flag that the user has entered a value
                userHasEnteredValue = true;
            } else {
                // No values - discard validation failures in this row by simply putting back the
                // original set of validation failures.
                instance._validationFailures = currentValidationFailures;
            }
        }
        // Handle the case when the original document didn't contain an array.
        if(arrayWasCreated) {
            // Insert the array into the document - only works if there's a value path set for this
            // repeating section.
            this._setValueInDoc(context, elementContexts);
        }
        // Perform validation -- have to do it all 'manually' as we're overriding everything in the base class.
        var min = this._minimumCount, max = this._maximumCount;
        var failureMessage;
        if(undefined !== min && elementContexts.length < min) {
            // If there is required property, and it evaluates to false, ignore the minimum count
            if((this._required === undefined) || (evaluateConditionalStatement(this._required, context, instance) !== false)) {
                failureMessage = MESSAGE_REPSEC_ERR_MIN1 + min + MESSAGE_REPSEC_ERR_MIN2;
            }
        } else if(undefined !== max && elementContexts.length > max) {
            failureMessage = MESSAGE_REPSEC_ERR_MAX1 + max + MESSAGE_REPSEC_ERR_MAX2;
        }
        if(failureMessage) {
            instance._validationFailures[this.name + nameSuffix] = failureMessage;
        }
        // Return the user entered value flag
        return userHasEnteredValue;
    },

    _replaceValuesForView: function(instance, context) {
        var elementContexts = this._getValuesArrayFromDoc(context);
        if(!elementContexts) { return; }
        var c, m;
        for(c = 0; c < elementContexts.length; ++c) {
            for(m = 0; m < this._elements.length; ++m) {
                this._elements[m]._replaceValuesForView(instance, elementContexts[c]);
            }
        }
    },

    _getShadowRows: function(instance, nameSuffix, elementContexts) {
        // Ensure lookup dictionary in instance is created
        var shadowRows = instance._sectionShadowRows;
        if(undefined === shadowRows) {
            instance._sectionShadowRows = shadowRows = {};
        }
        // Make the shadow row, if it doesn't already exist
        var key = this.name+nameSuffix;
        var shadow = shadowRows[key];
        var isArrayOfValues = this._isArrayOfValues;
        if(undefined === shadow) {
            shadowRows[key] = shadow = [];
            for(var l = 0; l < elementContexts.length; ++l) {
                shadow[l] = {
                    _data: isArrayOfValues ? {'.':elementContexts[l]} : elementContexts[l], // Wrap simple values in objects
                    _inDocument: true
                };
            }
        }
        return shadow;
    },

    _getValuesArrayFromDoc: function(context) {
        return this.valuePath ? this._getValueFromDoc(context) : [context];
    },

    _modifyViewBeforeRendering: function(view, rows) {
        // Flag that this is a repeating section to the template
        view.isRepeatingSection = true;
        // Does it have more than one element?
        view.hasMultipleElements = (this._elements.length > 1);
        // Add options to view
        view.allowDelete = this._allowDelete;
        view.allowAdd = this._allowAdd;
        if(undefined !== this._maximumCount && rows.length >= this._maximumCount) {
            view.displayingMaximumRows = true;
        }
    },

    _wouldValidate: function(instance, context) {
        if(this._shouldExcludeFromUpdate(instance, context)) { return true; }
        var elementContexts = this._getValuesArrayFromDoc(context);
        if(undefined === elementContexts) { elementContexts = []; }
        // Validate counts
        var min = this._minimumCount, max = this._maximumCount;
        if(undefined !== min && elementContexts.length < min) {
            // If there is required property, and it evaluates to false, ignore the minimum count
            if((this._required === undefined) || (evaluateConditionalStatement(this._required, context, instance) !== false)) {
                return false;
            }
        } else if(undefined !== max && elementContexts.length > max) {
            return false;
        }
        // Validate rows
        var c, m;
        for(c = 0; c < elementContexts.length; ++c) {
            for(m = 0; m < this._elements.length; ++m) {
                if(!this._elements[m]._wouldValidate(instance, elementContexts[c])) {
                    return false;
                }
            }
        }
        return true;
    }
});

makeElementType("repeating-section", RepeatingSectionElementMethods);
