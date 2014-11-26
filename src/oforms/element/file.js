
makeElementType("file", {

    // Because uploading file is a bit tricky (at the very least, files must be stored outside the JSON documents),
    // the platform needs to implement much of the support via the delegate, which should implement:
    //   formFileElementValueRepresentsFile(value)      (returns boolean)
    //   formFileElementRenderForForm(value)            (returns HTML)
    //   formFileElementRenderForDocument(value)        (returns HTML)
    //   formFileElementEncodeValue(value)              (returns encoded)
    //   formFileElementDecodeValue(encoded)            (returns value)
    // Where 'encoded' is a text string for storage in an hidden input field, and 'value' is the representation of
    // the file as stored in the document.

    _initElement: function(specification, description) {
        description.requiresClientUIScripts = true;
        description.requiresClientFileUploadScripts = true;
    },

    _pushRenderedHTML: function(instance, renderForm, context, nameSuffix, validationFailure, output) {
        // Value is something handled by the platform integration, and is essentially opaque to the forms system
        var value = this._getValueFromDoc(context);
        // Build output HTML
        var delegate = instance.description.delegate;
        var haveFile = delegate.formFileElementValueRepresentsFile(value);
        if(renderForm) {
            output.push('<span class="oforms-file', additionalClass(this._class), '">');
            this._outputCommonAttributes(output);
            output.push('<span class="oforms-file-prompt"',
                haveFile ? ' style="display:none"' : '',
                '><a href="#">Upload file...</a><input type="file" name="', this.name, '.f', nameSuffix, '"></span>');
            if(haveFile) {
                output.push('<input type="hidden" name="', this.name, nameSuffix, '" value="',
                    escapeHTML(delegate.formFileElementEncodeValue(value)),
                    '"><span class="oforms-file-display">', delegate.formFileElementRenderForForm(value), '</span> <a href="#" class="oforms-file-remove">remove</a>');
            } else {
                output.push('<input type="hidden" name="', this.name, nameSuffix, '"><span class="oforms-file-display"></span> <a href="#" class="oforms-file-remove" style="display:none">remove</a>');
            }
            output.push('</span>');
        } else {
            if(haveFile) {
                output.push(delegate.formFileElementRenderForDocument(value));
            }
        }
    },

    _decodeValueFromFormAndValidate: function(instance, nameSuffix, submittedDataFn, validationResult) {
        var encoded = submittedDataFn(this.name + nameSuffix);
        if(encoded && encoded.length > 0) {
            return instance.description.delegate.formFileElementDecodeValue(encoded);
        }
    }
});
