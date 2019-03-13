
OFORMS_CHANGES = OForms::JSFile.new("oforms_changes", "oForms client-side changes display", File.dirname(__FILE__), [
    'changes_preamble.js',
    'generic_diff.js',
    'changes.js',
    'changes_postamble.js'
  ],
  {:server => false, :globals => {"jQuery" => false}})
