
// Uncomment to change all visible text to upper case
// oForms.setTextTranslate(function(text) { return text ? text.toUpperCase() : text; });

var delegate = {
    formGetDataSource: function(name) {
        if(name === "medication-list") {
            return {
                endpoint: "/data-source/1",
                displayNameForValue: function(value) {
                    // Remove the 'id-' prefix, if it's there, then capitalize it
                    var returnObject = {};
                    returnObject.display = ((value.indexOf("id-") === 0) ? value.substr(3) : value).
                        replace(/\w/, function(t) { return t.toUpperCase(); }).
                        replace(/-/g,' ');
                    if(returnObject.display.charCodeAt(0)%3 === 1) {
                        returnObject.href = "/value-link/"+returnObject.display.toLowerCase().replace(/[^a-z/]+/g,'-');
                    }
                    return returnObject;
                }
            };
        }
    },
    formGetTemplate: function(name) {
        if(name === "inline-guidance") {
            return '<p>GUIDANCE TEMPLATE: {{prop}}</p>';
        }
        if(name != 'test_template') { return undefined; }
        if(TEMPLATE_SYSTEM == "mustache") {
            // Mustache template
            return [
                '{{#rows}}',
                    '<div class="test_template">',
                        '<div><b>Custom template</b></div>',
                        '{{#named.left}}<div class="test_left">{{>oforms:element}}</div>{{/named.left}}',
                        '{{#named.right}}<div class="test_right">{{>oforms:element}}</div>{{/named.right}}',
                    '</div>',
                '{{/rows}}'
            ].join('');
        } else {
            // Handlebars template: A bit simplier as it uses the helper. Most of the template is HTML, with just
            // two {{oforms:element "..."}} markers for where the elements are to go.
            // To support repeating section, just surround with {{#rows}} ... {{/rows}}
            return [
                '<div class="test_template">',
                    '<div><b>Custom template</b></div>',
                    '<div class="test_left">{{oforms_element "left"}}</div>',
                    '<div class="test_right">{{oforms_element "right"}}</div>',
                '</div>'
            ].join('');
        }
    },

    // Minimal delegate 'file' support
    formFileElementValueRepresentsFile: function(value) {
        return !!value && value.TESTFILE;
    },
    formFileElementRenderForForm: function(value) {
        assertIsTestFileValue(value);
        return "[FILE] "+_.escape(value.name);
    },
    formFileElementRenderForDocument: function(value) {
        assertIsTestFileValue(value);
        return "(FILE) "+_.escape(value.name);
    },
    formFileElementEncodeValue: function(value) {
        assertIsTestFileValue(value);
        return JSON.stringify(value);
    },
    formFileElementDecodeValue: function(encoded) {
        var value = JSON.parse(encoded);
        assertIsTestFileValue(value);
        return value;
    }
};
var assertIsTestFileValue = function(value) {
    if(!(value && value.TESTFILE && value.name)) {
        throw new Error("Not a valid test file value: "+value);
    }
};

window.oFormsFileDelegate = {
    fileRepeatingSectionInitTarget: function(element, addRowWithUpload) {
        $(element).
            html('<div class="test_file_target" style="border:1px solid #ddd;margin-bottom:12px">TEST FILE TARGET &nbsp; <input type="file" multiple="multiple"></div>').
            on("change", '.test_file_target input[type=file]', function(evt) {
                evt.preventDefault();
                _.each(this.files, function(file) {
                    var callbacks = addRowWithUpload(file);
                    window.oFormsFileDelegate._doTestCallbacks(file, "[****]", callbacks);
                });
                this.value = '';
            });
    },
    uploadFile: function(file, callbacks) {
        this._doTestCallbacks(file, "[^^^^]", callbacks);
    },
    // Function which calls the callbacks
    _doTestCallbacks: function(file, pretendIcon, callbacks) {
        window.setTimeout(function() { callbacks.updateDisplay(pretendIcon+" "+_.escape(file.name)) }, 500);
        window.setTimeout(function() {
            if(Math.random() < 0.2) {
                callbacks.onError();
            } else {
                callbacks.onFinish(JSON.stringify({TESTFILE:true,name:file.name}), '[FILE] '+_.escape(file.name));
            }
        }, 2000);
    }
};

// Test document with a few values defined
var doc =
{info:
    {name: 'Bob'},
valueForDisplay: 'String value with characters requiring escaping: <span style="color:red">if this text is red, HTML is not escaped</span>',
description:
    {/* height: {value:1.65, units:"km"}, */ medications:
        [
            {medication:'id-aspirin', current:true, taken:"2000-01-01", otherValue:"shouldn't be deleted", timeOfDay:'e'},
            {medication:'id-ibuprofen', current:false, /*taken:"2000-02-02",*/ note:["note1", "note2"]}
        ]
    }
}

// Stop IE getting upset when there's no console
if(undefined === this.console) { this.console = {log:function(){}}; }

console.log("Standard templates", oForms.getStandardTemplates());

var formDescription = oForms.createDescription(exampleForm, delegate, "overridden-form-id");

console.log("requiresBundle", formDescription.requiresBundle);
console.log("requiresClientUIScripts", formDescription.requiresClientUIScripts);

var makeInstance = function() {
    var i = formDescription.createInstance(doc);
    // i.choices('purpose-choices', ["No purpose","Lots of purpose","On purpose"]);
    i.choices('purpose-choices', [[89, "No purpose"],[76, "Lots of purpose"],[78, "On purpose"]]);
    i.choices('instance-choices-repeating', [['a', 'Choice A'],['b','Choice B']]);
    i.customValidation("addition", function(value, data, context, document, externalData) {
        console.log("customValidation value", value);
        console.log("customValidation data", data);
        console.log("customValidation context", JSON.stringify(context)); // so that it doesn't live update
        console.log("customValidation document", document);
        console.log("customValidation externalData", externalData);
        if(value + context[data.otherValue] !== data.total) {
            return "Must add up to "+data.total;
        }
    });
    i.externalData({"ext1":"something", "newYearDay":new Date(2019, 0, 1)});
    return i;
};
var form = makeInstance();
console.log("Initial documentWouldValidate() is ", form.documentWouldValidate());
var formHTML = form.renderForm();
document.write(formHTML);

if(formDescription.requiresBundle) {
    var bundle = formDescription.generateBundle();
    console.log("BUNDLE:", bundle);
    oForms.client.registerBundle("overridden-form-id", bundle);
} else {
    console.log("BUNDLE WAS EXPECTED");
}

$(document).ready(function() {
    $('#test_update, input[name=afterwards]').click(function(evt) {
        if(this.type === 'submit') { evt.preventDefault(); }
        if(!($('#keep_instance:checked').val())) {
            console.log("Replacing form instance");
            form = makeInstance();
        }
        var formData = {};
        _.each($('#overridden-form-id').parent('form').serializeArray(), function(field) {
            formData[field.name] = field.value;
        });
        console.log("Form data", formData);
        form.update(function(name) { return formData[name]; });
        var view = form.makeView();
        console.log("Updated document: ", _.clone(doc));    // as console will display latest value if not cloned
        console.log("View: ", view);
        // IEs 6 & 7 have issues when inserting white-space into <pre> elements.
        // See: http://web.student.tuwien.ac.at/~e0226430/innerHtmlQuirk.html
        if (/MSIE/.test(navigator.userAgent)) {
            $('#json_document').get(0).innerText = JSON.stringify(doc, undefined, 4);
        } else {
            $('#json_document').text(JSON.stringify(doc, undefined, 4));
        }
        $('#validity').text(form.valid);
        form.setIncludeUniqueElementNamesInHTML($('#with_uname:checked').length>0);
        if($('input[name=afterwards]:checked').val() == 'rerender') {
            $('#rerender_target').html(form.renderForm());
        } else {
            $('#rerender_target').html(form.renderDocument());
        }
        var documentWouldValidate = makeInstance().documentWouldValidate();
        $('#documentWouldValidate').text(""+documentWouldValidate);
        if(form.valid !== documentWouldValidate) {
            alert("inconsistent form.valid and documentWouldValidate");
        }
        // Changes
        $('#changes_previous')[0].innerHTML = $('#changes_current')[0].innerHTML;
        $('#changes_current')[0].innerHTML = form.renderDocument();
        $('#changes_display')[0].innerHTML = form.renderDocument();
        var hasChanges = oFormsChanges.display($('#changes_display')[0], $('#changes_previous')[0]);
        console.log("Has changes "+hasChanges);
    });
});
