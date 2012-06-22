
// Make all the standard templates available to the caller. Useful for when the delegate takes
// over rendering by implementing the formPushRenderedTemplate() function.
var /* seal */ uncompiledStandardTemplates = standardTemplates;
oForms.getStandardTemplates = function() { return uncompiledStandardTemplates; };
