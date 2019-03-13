
(function() {

    var defn = {
        "specificationVersion": 0,
        "formId": "changes_form",
        "formTitle": "Changes form",
        "formTitleShort": "Changes",
        "elements": [
            {
                "type": "text",
                "label": "Text (1)",
                "path": "text1",
                "inDocument": {"path":"text1", "operation":"defined"}
            },
            {
                "type": "text",
                "label": "Unchanged after 1",
                "path": "Unchanged0",
            },
            {
                "type": "text",
                "label": "Text (2)",
                "path": "text2",
                "inDocument": {"path":"text2", "operation":"defined"}
            },
            {
                "type": "paragraph",
                "label": "Paragraph text (3)",
                "path": "paragraph"
            },
            {
                "type": "text",
                "label": "Text (4)",
                "path": "text4",
                "inDocument": {"path":"text4", "operation":"defined"}
            },
            {
                "type": "text",
                "label": "Text (5)",
                "path": "text5"
            },
            {
                type:"section",
                path:"section1",
                elements: [
                    {
                        "type": "text",
                        "label": "In section: Unchanged",
                        "path": "Unchanged1",
                    },
                    {
                        "type": "text",
                        "label": "In section: Will insert",
                        "path": "stext0",
                        "inDocument": {"path":"stext0", "operation":"defined"}
                    },
                    {
                        "type": "text",
                        "label": "In section: Will change",
                        "path": "stext1",
                    },
                ]
            },
            {
                "type": "text",
                "label": "Empty text (last)",
                "path": "emptyText"
            },
            {
                type:"repeating-section",
                heading: "Repeating section",
                path:"section2",
                elements: [
                    {
                        "type": "text",
                        "label": "Repeating text",
                        "path": "text"
                    }
                ]
            }
        ]
    };

    var document = {
        text1: "Hello there, will be deleted",
        Unchanged0: "this text does not change",
        paragraph: "Para1\n\nParagraph 2\n\nParagraph 3\n\nLast",
        text4: "Will be deleted",
        text5: "Ping",
        section1: {
            Unchanged1: "text value in section",
            stext1: "Old text value in section"
        },
        section2: [
            {text:"repeat 1"},
            {text:"repeat 2"}
        ]
    };

    var delegate = {    
    };

    var formDescription = oForms.createDescription(defn, delegate);

    var instance1 = formDescription.createInstance(document);

    $('#previous_display')[0].innerHTML = instance1.renderDocument();
    $('#previous')[0].innerHTML = instance1.renderDocument();

    delete document.text1;  // prepend delete
    document.text2 = "Inserted element (2)";
    delete document.text4;  // append delete
    document.paragraph =  "Para1\n\nParagraph 2\n\n2b\n\nParagraph 3\n\nFour\n\nLast";
//    document.paragraph = "Para1\n\nParagraph 2\n\nParagraph 3",
//    document.paragraph = "Paragraph 2\n\nParagraph 3\n\nLast",
//    document.paragraph = "Paragraph 3\n\nLast",
//    document.paragraph = "Para1\n\nParagraph 2",
//    document.paragraph = "Para1\n\nParagraph 2\n\nPing\n\nParagraph 3\n\nLast";
//    document.paragraph = "Ping\n\nPara1\n\nParagraph 2\n\nParagraph 3\n\nLast";
//    document.paragraph = "Para1\n\nParagraph 2\n\nParagraph 3\n\nLast\n\nPing";
    document.text5 = "Changed text (5)";
    document.section1.stext0 = "Inserted value in section";
    document.section1.stext1 = "New text value in section";
    document.section2 = [
        {text:"repeat 2"},
        {text:"repeat 3"}
    ];


    var instance2 = formDescription.createInstance(document);

    $('#current')[0].innerHTML = instance2.renderDocument();
    $('#diffed')[0].innerHTML = instance2.renderDocument();

    oFormsChanges.display($('#diffed')[0], $('#previous')[0], true);

    $('#show_unchanged').on('change', function() {
        oFormsChanges.unchangedVisibility($('#diffed')[0], !!this.checked);
    });

})();
