
// TODO: Much better diffing algorithm, and ability to use it for repeating sections.
//
// 1) Better algorithm: Just trimming unchanged nodes off head and tail is OK, but what if there are two insert points?
//
// 2) Repeating sections: This should be able to be used to identify the changed/inserted (and deleted)
//    repetitions, and then use the special document diffing function within those.
//

// Assumption: There is at least one difference, and this won't be called on equal nodes.
var genericDiff = function(current, previous) {
    // Get non-text nodes (children ignored text nodes)
    var cn = current.children;
    var pn = previous.children;

    // Special case: current has zero entries
    // Either everything is new, or it's only text nodes.
    if(cn.length === 0) {
        var cq = $(current).addClass('oforms-changes-add');
        $(previous).addClass('oforms-changes-remove').insertAfter(cq);
        return;
    }

    // How many nodes at beginning are equal?
    var len = Math.min(cn.length, pn.length);
    var beginningEqual = 0;
    for(; beginningEqual < len; beginningEqual++) {
        if(cn[beginningEqual].outerHTML !== pn[beginningEqual].outerHTML) {
            break;
        }
    }

    // How many at the end are equal?
    var endingEqual = 0;
    for(; endingEqual < len; endingEqual++) {
        if(cn[cn.length-endingEqual-1].outerHTML !== pn[pn.length-endingEqual-1].outerHTML) {
            break;
        }
    }

    // Mark changed nodes
    var endOfDifferent = cn.length - endingEqual;
    for(var c = beginningEqual; c < endOfDifferent; c++) {
        $(cn[c]).addClass('oforms-changes-add');
    }

    // Move in deleted nodes
    if(beginningEqual < pn.length) {
        // Make array of nodes to insert because pn is "live" and will change as nodes removed
        var toCopy = [];
        for(var i = beginningEqual; i < (pn.length - endingEqual); ++i) {
            toCopy.push(pn[i]);
            $(pn[i]).addClass('oforms-changes-remove');
        }
        // Insert nodes
        var insertPoint = (endingEqual === 0) ? undefined : cn[endOfDifferent];
        for(var x = 0; x < toCopy.length; ++x) {
            if(insertPoint) {
                current.insertBefore(toCopy[x], insertPoint);
            } else {
                current.appendChild(toCopy[x]);
            }
        }
    }

};

