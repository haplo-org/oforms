
// Called to translate user visible text
var textTranslate = function(text) { return text; };

oForms.setTextTranslate = function(fn) {
    textTranslate = fn;
};
