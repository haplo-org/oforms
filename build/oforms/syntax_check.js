
(function() {
    var root = this;

    // Options for the syntax checking
    var makeOptions = function() {
        return {
            asi: false,
            bitwise: false,
            boss: false,
            curly: true,
            debug: false,
            devel: false,
            eqeqeq: false,
            evil: false,
            forin: false,
            immed: false,
            laxbreak: false,
            newcap: true,
            noarg: true,
            noempty: false,
            nonew: true,
            nomen: false,
            onevar: false,
            plusplus: false,
            regexp: false,
            undef: true,
            sub: true,
            strict: false,
            white: false
        };
    };

    // Server side options
    var serverOption = makeOptions();
    serverOption.newcap = false; // because $ is not a capital letter and it's used as a prefix on all hidden class names

    // Browser options
    var browserOption = makeOptions();
    browserOption.browser = true;
    browserOption.newcap = false;

    // Syntax tester function
    root.syntax_tester = function(source, serverSide, globalsStr) {
        var globals = eval("("+globalsStr+")");
        var result = JSHINT(source,
            serverSide ? serverOption : browserOption,
            globals
        );
        if(result == true) { return null; } // success
        // Errors - compile a report, can't use the default one as it's HTML
        var data = JSHINT.data();
        var errors = data.errors;
        var report = '';
        for(var e = 0; e < errors.length; e++) {
            var err = errors[e];
            if(err !== null && err !== undefined) { // oddly it will do that
                var supressed = false;
                if(!supressed) {
                    report += "line "+err.line+": "+err.reason+"\n    "+err.evidence+"\n";
                }
            }
        }
        // If report is empty, it only contained supressed errors
        return (report == '') ? null : report;
    };

})();
