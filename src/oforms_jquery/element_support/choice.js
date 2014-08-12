
onCreateNewRepeatingSectionRow.push(function(newRow, rowsParent) {
    // Copy any instance choices
    $('select[data-oforms-need-fill]', newRow).each(function() {
        var sourceName = this.name.replace(/\.\d+/,'.0');
        var options = $($('select[name="'+sourceName+'"]', rowsParent).html());
        options.each(function() {
            if(this.selected) { this.selected = false; }
        });
        $(this).empty().append(options);
    });
});
