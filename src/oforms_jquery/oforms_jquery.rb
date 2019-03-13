
OFORMS_JQUERY = OForms::JSFile.new("oforms_jquery", "oForms client-side support (jQuery)", File.dirname(__FILE__), [
    'jquery_preamble.js',
    'ui_utils.js',
    '../common/text_count.js',
    'guidance_note_impl.js',
    'element_support/preamble.js',
    'element_support/repeating_section.js',
    'element_support/choice.js',
    'element_support/lookup.js',
    'element_support/file.js',
    'element_support/date.js',
    'element_support/paragraph.js',
    'element_support/guidance_note_events.js',
    'element_support/inline_guidance_note.js',
    'element_support/postamble.js',
    'autofocus.js',
    'jquery_postamble.js'
  ],
  {:server => false, :globals => {"_" => false, "jQuery" => false}})
