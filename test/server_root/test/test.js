var delegate = {
    formGetDataSource: function(name) {
        if(name === "medication-list") {
            return {
                endpoint: "/data-source/1",
                displayNameForValue: function(value) {
                    // Remove the 'id-' prefix, if it's there, then capitalize it
                    return ((value.indexOf("id-") === 0) ? value.substr(3) : value).replace(/\w/, function(t) { return t.toUpperCase(); }).replace(/-/g,' ');
                }
            };
        }
    },
    formGetTemplate: function(name) {
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
    }
};
var doc = 
{info: 
	{name: 'Bob'},
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
    i.choices('purpose-choices', ["No purpose","Lots of purpose","On purpose"]);
    // i.choices('purpose-choices', [[89, "No purpose"],[76, "Lots of purpose"],[78, "On purpose"]]);
    return i;
};
var form = makeInstance();
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
        if($('input[name=afterwards]:checked').val() == 'rerender') {
            $('#rerender_target').html(form.renderForm());
        } else {
            $('#rerender_target').html(form.renderDocument());            
        }
    });
});
