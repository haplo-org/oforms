
var elementsToArrayWithOrder = function(formDocument) {
    var a = [];
    var children = formDocument.children;
    for(var i = 0; i < children.length; ++i) {
        var element = children[i];
        var order = element.getAttribute('data-order');
        if(order) {
            a[parseInt(order,10)] = {
                element: element,
                html: element.outerHTML
            };
        }
    }
    return a;
};

// Called recursively
var showChangesInChildren = function(current, previous) {
    var currentList = elementsToArrayWithOrder(current);
    var previousList = elementsToArrayWithOrder(previous);
    var count = Math.max(currentList.length, previousList.length);
    var insertPoint, insertedNode, copyInPrevious;
    var hasChanges = false;

    for(var i = 0; i < count; i++) {
        var cur = currentList[i],
            prev = previousList[i];
        insertedNode = undefined;
        copyInPrevious = false;
        if(cur && !prev) {
            // Element was inserted
            $(cur.element).addClass('oforms-changes-add');
            hasChanges = true;
        } else if(!cur && prev) {
            // Element was deleted - patch in from previous
            copyInPrevious = true;
        } else if(cur && prev) {
            if(cur.html !== prev.html) {
                // Element was changed - copy in old in controls and mark
                var currentControlsElement = $('> .controls',cur.element);
                var previousControlElement = $('> .controls',prev.element);
                // Nested or repeating?
                if($('> .oforms-repeat', currentControlsElement).length) {
                    // This element is a repeating section.
                    // TODO: Better things with repeating sections, this is a bit of a hack.
                    $(cur.element).addClass('oforms-changes-add');
                    insertPoint = cur.element;
                    copyInPrevious = true;
                } else if($('> [data-order]', currentControlsElement).length) {
                    // Nested directly at this level
                    hasChanges = showChangesInChildren(currentControlsElement[0], previousControlElement[0]) || hasChanges;
                } else {
                    genericDiff(currentControlsElement[0], previousControlElement[0]);
                    hasChanges = true;
                }
            } else {
                $(cur.element).addClass('oforms-changes-unchanged');
            }
        }
        if(copyInPrevious) {
            hasChanges = true;
            var copied = $(prev.html);
            if(insertPoint) {
                copied.insertAfter(insertPoint);
            } else {
                copied.prependTo($(current));
            }
            copied.addClass('oforms-changes-remove');
            insertedNode = copied[0];
        }
        if(insertedNode) {
            insertPoint = insertedNode;
        } else if(cur) {
            insertPoint = cur.element;
        }
    }
    return hasChanges;
};

// NOTE: Elements will be moved out of previous
oFormsChanges.display = function(current, previous, showUnchanged) {
    var hasChanges = showChangesInChildren(current, previous);
    if(!showUnchanged) {
        oFormsChanges.unchangedVisibility(current, false);
    }
    return hasChanges;
};

oFormsChanges.unchangedVisibility = function(element, visible) {
    var unchanged = $('.oforms-changes-unchanged', element);
    if(visible) { unchanged.show(); } else { unchanged.hide(); }
};
