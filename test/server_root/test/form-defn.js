
// ------------------------------------------------------------------------------------------------------------------------
//    HELPER FUNCTIONS

var purposeChoicesOfStyle = function(style) {
    return {
        "type": "choice",
        "style": style,
        "choices": "purpose-choices",
        "prompt": " -- choose a purpose --", // or false to not have a prompt
        "label": style || '(default)',
        // "minimumCount": 1, "maximumCount": 2,
        "required": true,
        "path": "purpose_"+(style||'')
    };
};

var gridRow = function(question, pathName) {
    return {
        "type": "section",
        "label": question,
        "template": "oforms:grid:row",
        "elements": [
            {"type": "boolean", "path": "grid."+pathName+".answer"},
            {"type": "paragraph", "rows": 2, "path": "grid."+pathName+".notes"}
        ]
    };
};

var groupingChoices = [];
for(var l = 0; l < 21; ++l) { groupingChoices.push("Option "+l); }

// ------------------------------------------------------------------------------------------------------------------------
//    FORM DEFINITION

var exampleForm = {
    "specificationVersion": 0,
    "formId": "example_form",
    "formTitle": "Example form",
    "formTitleShort": "Example",
    "inlineGuidanceNoteTemplate": "inline-guidance",
    "elements": [
        {
            "type": "text",
            "label": "Name",
            "required": true,
            "id": "special_id_attribute",
            "guidanceNote": "Enter the name here.",
            "path": "info.name"     // where the value lives in the JSON document
        },
        {
            "type": "boolean",
            "style": "confirm",
            "label": "I have read the terms and conditions, and reluctantly agree to them.",
            "notConfirmedMessage": "You must agree to the terms and conditions before continuing",
            "trueLabel": "Agreement to terms and conditions has been indicated",
            "path": "termsAndConditions"
        },
        {
            "type": "number",
            "label": "Enter a number (optional)",
            "path": "number"
        },
        {
            "type": "boolean",
            "style": "confirm",
            "label": "Confirm if you've entered a number or not",
            "notConfirmedMessage": "You must confirm if you've entered a number (I know you did)",
            "trueLabel": "Number confirmed",
            "path": "numberConfirmation",
            "required": {
                "path": "number",
                "operation": "defined"
            }
        },
        {
            "type": "section",
            "heading": "Measurements",
            "renderDocumentOmitEmpty": true,
            "path": "info.measurements",
            "template": "oforms:table",
            "elements": [
                {
                    "type": "measurement",
                    "quantity": "length",
                    "includeCanonical": true,
                    "required": true,
                    "label": "Height",
                    "id": "length_measurement",
                    "path": "height"
                },
                {
                    "type": "measurement",
                    "quantity": "temperature",
                    "includeCanonical": true,
                    "label": "Temperature",
                    "placeholder": "Temp outside?",
                    "path": "temperature"
                },
                {
                    "type": "measurement",
                    "quantity": "time",
                    "includeCanonical": true,
                    "label": "Time",
                    "path": "time"
                },
                {
                    "type": "measurement",
                    "quantity": "mass",
                    "includeCanonical": true,
                    "label": "Mass",
                    "path": "mass"
                },
                {
                    "type": "measurement",
                    "quantity": "mass",
                    "integer": true,
                    "defaultUnit": 'g',
                    "label": "Mass (int)",
                    "class": "mass_measurement",
                    "path": "massInteger"
                }
            ]
        },
        {
            "type": "text",
            "label": "RegExp validated text with whitespace minimise",
            "explanation": "This is an explanation of things.\nSecond <paragraph>.",
            "inlineGuidanceNote": "Hello there!\nSecond paragraph",
            "whitespace": "minimise",
            "validationRegExp": "^[0-9a-f]+$",
            "validationRegExpOptions": "i",
            "validationFailureMessage": "Must be hex characters only.",
            "path": "info.regexpValidation"
        },
        {
            "type": "section",
            "label": "Choice styles",
            "path": "info.choices",
            "template": "oforms:table",
            "guidanceNote": "Shows the various styles of choice elements.",
            "elements": [
                purposeChoicesOfStyle(undefined),
                purposeChoicesOfStyle("select"),
                purposeChoicesOfStyle("radio"),
                purposeChoicesOfStyle("radio-vertical"),
                purposeChoicesOfStyle("radio-horizontal"),
                purposeChoicesOfStyle("multiple")
            ]
        },
        {
            "type": "number",
            "label": "A number required if multiple above contains 'on purpose' or two or more items selected",
            "required": {
                operation: "OR",
                statements: [
                    {
                        path:"info.choices.purpose_multiple",
                        operation:"contains",
                        value: 78
                    },
                    {
                        path:"info.choices.purpose_multiple",
                        operation:"minimum-count",
                        value: 1
                    }
                ]
            },
            "path": "nested.someNumber2"
        },
        {
            "type": "number",
            "label": "A lovely number. This is a very long label that may make the asterix break onto a new line. This is a very long label that may make   line.",
            "required": true,
            "path": "nested.someNumber",
            "inlineGuidanceNote": {
                "prop": "This is the number, affects validation of other elements"
            }
        },
        {
            "type": "integer",
            "label": "A perfectly fine integer (required if 'A lovely number' is 23 or 90)",
            "required": {
                operation:"OR",
                statements: [
                    {path:"nested.someNumber", operation:"==", value:23},
                    {path:"nested.someNumber", operation:"==", value:90}
                ]
            },
            "path": "someInt"
        },
        {
            "type": "number",
            "label": "A validated percentage",
            "minimumValue": 0, "maximumValue": 100,
            "htmlSuffix": " %",
            "guidanceNote": "This is a lovely percentage.",
            "path": "somePercentage",
            "required": {externalData:"ext1", operation:"==", value:"something"}
        },
        {
            "type": "section",
            "path": "adding",
            "elements": [
                {
                    "type": "number",
                    "label": "Number A",
                    "path": "a",
                    "required": true
                },
                {
                    "type": "number",
                    "label": "Number B (A+B must == 100)",
                    "path": "b",
                    "required": true,
                    "validationCustom": {
                        "name": "addition",
                        "data": {
                            "otherValue": "a",
                            "total": 100
                        }
                    }
                }
            ]
        },
        {
            // New section - this one formatted as a table with an arbitary number of repeating rows
            "type": "repeating-section",
            "template": "oforms:table",   // one of the standard templates - displays elements in rows of a table
            "path": "description.medications",
            "allowDelete": true,
            "minimumCount": 0,
            "maximumCount": 5,
            "elements": [
                {
                    "type": "lookup",
                    "dataSource": "medication-list", // refers to data sources described seperately
                    "guidanceNote": "Looks up random words which were in the source code.",
                    "class": "lookup1",
                    "placeholder": "Random name",
                    "required": true,
                    "label": "Medication",
                    "path": "medication"       // name relative to "description.medications"
                },
                {
                    "type": "boolean",
                    "class": "bool1",
                    "label": "Current medication?",
                    "path": "current",
                    "guidanceNote": "Only enter medication which has been proscribed by a medical professional."
                },
                {
                    "type": "choice",
                    "label": "Time of day",
                    "path": "timeOfDay",
                    "choices": [['m','Morning'],['l','Lunch'],['e','Evening']]
                    // "choices": [{id:'mP',name:'Morning'},{id:'lP',name:'Lunch'},{id:'eP',name:'Evening'}]
                    // "choices": [{id:7,name:'Morning'},{id:9,name:'Lunch'},{id:144,name:'Evening'}]
                    // "choices": [{id2:'mP2',name2:'Morning'},{id2:'lP2',name2:'Lunch'},{id2:'eP2',name2:'Evening'}], objectIdProperty:"id2", objectDisplayProperty:"name2"
                    // "choices": [[1,'Morning'],[2,'Lunch'],[17,'Evening']]
                    // "choices": ['Morning','Lunch','Evening','Midnight']
                },
                {
                    "type": "text",
                    "path": "pinging",
                    "label": "Ping",
                    "defaultValue": "has default ping"
                },
                {
                    "type": "section",
                    "path": "test",
                    "elements": [
                        {
                            "type": "date",
                            "label": "Date prescribed",
                            "path": "prescribed",
                            "validationCustom": {
                                "name": "std:validation:compare_to_today",
                                "data": {
                                    "operation": "<",
                                    "delta": -1,
                                    "errorMessage": "Date must be before yesterday"
                                }
                            }
                        }
                    ]
                },
                {
                    "type": "date",
                    "label": "Date taken",
                    "path": "taken",
                    "validationCustom": {
                        "name": "std:validation:compare_to_date",
                        "data": {
                            "operation": ">",
                            "path": "test.prescribed",
                            "delta": 7,
                            "errorMessage": "Must be taken a week or more after prescribed"
                        }
                    }
                },
                {
                    "type": "repeating-section",
                    "name": "notes-repeating-section",
                    "allowDelete": true,
                    "label": "Notes",
                    "path": "note",
                    "elements": [
                        {
                            "type": "text",
                            "name": "repeating_notes",
                            "path": "."
                        }
                    ]
                }
            ]
        },
        {
            "type": "static",
            "text": "This is some static text, displayed in the form only (the default option).\nSecond paragraph."
        },
        {
            "type": "static",
            "html": '<div>Some HTML displayed in the <b>rendered document</b> only.</div>',
            "display": 'document'
        },
        {
            "type": "static",
            "text": "Static text displayed in both form and document.",
            "display": "both"
        },
        {
            "type": "display-value",
            "label": "Displayed value from document",
            // "as": "html",
            "path": "valueForDisplay"
        },
        {
            "type": "section",
            "label": "Price",
            "template": "oforms:join",  // simple template which just joins together the elements within
            "elements": [
                {
                    "type": "choice",
                    "path": "priceCurrency",
                    "class": "currency_choice",
                    "prompt": false,
                    "choices": [['GBP','\u00A3'],['USD','$'],['EUR','\u20AC']]
                },
                {
                    "type": "number",
                    "placeholder": "How much?",
                    "id": "money",
                    "required": true,
                    "path": "priceValue"
                }
            ]
        },
        {
            "type": "boolean",
            "style": "checkbox",
            "label": "Hello?",
            "path": "pingpong"
        },
        {
            "type": "boolean",
            "style": "checklist",
            "label": "Checklist entry 1",
            "path": "checklist-entry1"
        },
        {
            "type": "boolean",
            "style": "checklist",
            "label": "Checklist entry two",
            "path": "checklist-entry2"
        },
        {
            "type": "date",
            "label": "Enter a date from 2019",
            "path": "date2019",
            "validationCustom": {
                "name": "std:validation:compare_to_date",
                "data": {
                    "operation": ">",
                    "externalData": "newYearDay",
                    "delta": -1
                }
            }
        },
        // Custom template
        {
            "type": "section",
            "template": "test_template",
            "templateDisplay": "test_template",
            "path": "customTemplate",
            "elements": [
                {"type":"text", "name":"left", "path":"left", "placeholder":"left", "htmlPrefix":"<i>htmlPrefix</i>"},
                {"type":"text", "name":"right", "path":"right", "placeholder":"right", "required":true, "htmlSuffix":"htmlSuffix"}
            ]
        },
        {
            "type": "section",
            "heading": "Grid templates",
            "template": "oforms:grid",
            "templateOptions": {"headings":["Answer", "Notes"]},
            "elements": [
                gridRow("Likes ducks", "ducks"),
                gridRow("Likes beer", "beer")
            ]
        },
        {
            "type": "choice",
            "path": "grouped",
            "choices": groupingChoices,
            "label": "Grouped options",
            "style": "radio-horizontal",
            "radioGroups": 4
        },
        {
            "type": "choice",
            "path": "clusters",
            "choices": groupingChoices,
            "label": "Clustered options",
            "style": "radio-vertical",
            "radioClusters": [
                {
                    "label": "Ten",
                    "values": ["Option 10", "Option 11"]
                },
                {
                    "label": "Fourteen",
                    "explanation": "An explanation of this",
                    "values": ["Option 14", "Option 16"]
                }
            ]
        },
        {
            "type": "file-repeating-section",
            "heading": "Random uploaded files",
            "id": "rep2_section",
            "renderDocumentOmitEmpty": true,
            "class": "rep2_class",
            "path": "random",
            "guidanceNote": "Only three repeats allowed, add button will be disabled afterwards.",
            "allowDelete": true,
            "required": {path:"nested.someNumber", operation:"!=", value:23},
            "minimumCount": 1,
            "maximumCount": 3,
            "elements": [
                {
                    "type": "text",
                    "label": "Name",
                    "required": true,
                    "placeholder": "Invent a nice name",
                    "path": "name"
                },
                {
                    "type": "file",
                    "label": "Random file",
                    "required": true,
                    "path": "fakeFile"
                },
                {
                    "type": "paragraph",
                    "rows": 6,
                    "label": "Something else",
                    "placeholder": "Put lots of lovely text here",
                    "class": "random_paragraph",
                    "path": "carrots.something",
                    "validationCount": {
                        "min": 3,
                        "max": 6
                    }
                },
                {
                    "type": "choice",
                    "label": "Instance choice",
                    "path": "instanceChoice",
                    "style": "select",
                    "choices": "instance-choices-repeating",
                    "required": true
                }
            ]
        },
        {
            "type": "file-repeating-section",
            "heading": "Simple file list",
            "path": "singleFileList",
            "allowAdd": false,
            "allowDelete": false,
            "elements": [{"type":"file", "path":"file"}]
        },
        {
            "type": "repeating-section",
            "heading": "Repeating section with nested file repeating section",
            "path": "repeatingSectionWithNestedFileRepeatingSection",
            "elements": [
                {"type":"text","label":"Bit of text","path":"text"},
                {
                    "type": "file-repeating-section",
                    "heading": "Nested files",
                    "path": "nestedFiles",
                    "allowAdd": false,
                    "allowDelete": false,
                    "elements": [{"type":"file", "path":"."}]
                }
            ]
        }
    ]
};
