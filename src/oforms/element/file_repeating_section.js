
var FileRepeatingSectionElementMethods = _.extend({}, RepeatingSectionElementMethods, {

    _initElementRepeating: RepeatingSectionElementMethods._initElement,
    _modifyViewBeforeRenderingRepeating: RepeatingSectionElementMethods._modifyViewBeforeRendering,

    // Because a file upload is expected, file repeating sections shouldn't output the empty row
    _shouldOutputEmptyRow: false,

    _initElement: function(specification, description) {
        this._initElementRepeating(specification, description);
        // Mark that this requires the file upload scripts (even though the nested file element will require this too)
        description.requiresClientFileUploadScripts = true;
    },

    _modifyViewBeforeRendering: function(view, rows) {
        this._modifyViewBeforeRenderingRepeating(view, rows);
        // Add a div to contain the UI, filled in on the client side
        view.extraTopUI = '<div class="oforms-repeat-file-ui"></div>';
    }
});

makeElementType("file-repeating-section", FileRepeatingSectionElementMethods);
