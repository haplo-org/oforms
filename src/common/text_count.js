
var textCountWords = function(text) {
    var re = /\S*\w\S*/g,   // need a new regexp object each time for sealed environment
        t = (text || ''),
        count = 0;
    while(re.test(t)) {
        count ++;
    }
    return count;
};

var textCountCharacters = function(text) {
    // Normalise spaces in the string
    var t = (text || '').replace(/\s+/g, ' ');
    return t.length;
};
