
// Ignore clicks on the link, just in case they get through
oform.on('click', '.oforms-file-prompt a', function(evt) { evt.preventDefault(); });

// Pass off file choice to client side delegate
oform.on('change', '.oforms-file input[type=file]', function(evt) {
    if(!window.oFormsFileDelegate) { return window.alert("Not supported."); }
    var fileInput = this;
    var fileElement = $(fileInput).parents('.oforms-file').first();
    if(fileInput.files && fileInput.files.length === 1) {
        var file = fileInput.files[0];
        window.oFormsFileDelegate.uploadFile(file, fileElementStartUploadUserInteface(fileElement, file));
    }
    fileInput.value = '';
});

var fileElementStartUploadUserInteface = function(fileElement, file) {
    fileElement.addClass('oforms-file-in-progress');
    $('.oforms-file-remove, .oforms-file-prompt', fileElement).hide();
    $('.oforms-file-display', fileElement).html('<span "oforms-file-starting-upload">Starting upload...</span>');
    // Submit handler on form?
    var form = fileElement.parents('form').first();
    if(form.length && !(form[0].getAttribute('data-oforms-file-support-handled'))) {
        form[0].setAttribute('data-oforms-file-support-handled', '1');
        form.on('submit', function(evt) {
            if($('.oforms-file-in-progress, .oforms-file-error', form).length) {
                evt.preventDefault();
                window.alert("This form cannot be submitted while a file upload is in progress.");
            }
        });
    }
    // Callbacks object
    return {
        updateDisplay: function(html) {
            $('.oforms-file-display', fileElement).html(html);
        },
        onFinish: function(encoded, displayHtml) {
            fileElement.removeClass('oforms-file-in-progress oforms-file-error');
            $('input[type=hidden]', fileElement).val(encoded);
            $('.oforms-file-display', fileElement).html(displayHtml);
            $('.oforms-file-remove', fileElement).show();
        },
        onError: function() {
            fileElement.removeClass('oforms-file-in-progress').addClass('oforms-file-error');
            $('input[type=hidden]', fileElement).val('');
            $('.oforms-file-display', fileElement).html('<span class="oforms-file-error-text">Error uploading file<span>');
            $('.oforms-file-remove', fileElement).show();
        }
    };
};

oform.on('click', '.oforms-file a.oforms-file-remove', function(evt) {
    evt.preventDefault();
    var fileElement = $(this).parents('.oforms-file').first();
    fileElement.removeClass('oforms-file-in-progress oforms-file-error');
    $('input[type=hidden]', fileElement).val('');
    $('.oforms-file-display', fileElement).text('');
    $('.oforms-file-remove', fileElement).hide();
    $('.oforms-file-prompt', fileElement).show();
});

// -----------------------------------------------------------------------------------------------------------------

// Support for repeating sections with file upload UI at the top
var doFileRepeatingSectionInitTarget = function(newRow, rowsParent) {
    $('.oforms-repeat-file-ui', newRow).each(function() {
        var fileUIElement = this;
        window.oFormsFileDelegate.fileRepeatingSectionInitTarget(fileUIElement, function(file) {
            var row = repeatingSectionAddRow(fileUIElement);
            var fileElement = $('.oforms-file input[type=file]', row).parents('.oforms-file').first();
            return fileElementStartUploadUserInteface(fileElement, file);
        });
    });
};

// Add file targets to initial form
doFileRepeatingSectionInitTarget(oform, undefined);

// Add file targets to new rows in repeating sections
onCreateNewRepeatingSectionRow.push(doFileRepeatingSectionInitTarget);
