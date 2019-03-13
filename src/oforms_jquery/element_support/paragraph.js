
var paragraphUpdateCount = function(textarea) {
    var container = $(textarea).parents('.oforms-paragraph-with-count').first();
    if(container.length) {
        var countFn = (container[0].getAttribute('data-unit') === 'c') ? textCountCharacters : textCountWords;
        var count = countFn(textarea.value);
        $('.oforms-paragraph-counter span', container).text(""+count);
    }
};

// --------------------------------------------------------------------------

oform.on('keyup', '.oforms-paragraph-with-count textarea', function(event) {
    var textarea = this;
    window.setTimeout(function() { paragraphUpdateCount(textarea); }, 0);
});

var paragraphUpdateCountAll = function(updateIn) {
    window.setTimeout(function() {
        $('.oforms-paragraph-with-count textarea', updateIn).each(function() {
            paragraphUpdateCount(this);
        });
    }, 0);
};

onCreateNewRepeatingSectionRow.push(function(newRow, rowsParent) {
    paragraphUpdateCountAll(newRow);
});

paragraphUpdateCountAll(oform);
