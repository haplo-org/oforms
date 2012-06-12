
// Apply event handlers defined in guidance_note_impl.js
// There's a single guidance note UI for all forms on a page.
oform.on('focus', 'input,textarea,select', guidanceNoteOnFocus);
oform.on('blur', 'input,textarea,select', guidanceNoteOnBlur);
