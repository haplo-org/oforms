
OFORMS_FILES = [
    ['*', 'oforms_preamble.js'],
    ['*', 'utils.js'],
    ['*', 'std_templates'],
    [['mustache'], 'template_impl/mustache.js'],
    [['handlebars'], 'template_impl/handlebars.js'],
    ['*', 'template_impl/visibility.js'],
    ['*', 'measurement_quantities.js'],
    ['*', 'element/base.js'],
    ['*', 'element/section.js'],
    ['*', 'element/repeating_section.js'],
    ['*', 'element/file_repeating_section.js'],
    ['*', 'element/static.js'],
    ['*', 'element/text.js'],
    ['*', 'element/paragraph.js'],
    ['*', 'element/boolean.js'],
    ['*', 'element/number.js'],
    ['*', 'element/date.js'],
    ['*', 'element/measurement.js'],
    ['*', 'element/choice.js'],
    ['*', 'element/lookup.js'],
    ['*', 'element/file.js'],
    ['*', 'form/description.js'],
    ['*', 'form/instance.js'],
    [['server'], 'sealing.js'],
    ['*', 'oforms_postamble.js']
  ]

def oforms_filelist(options)
  OFORMS_FILES.map do |kinds, filename|
    (kinds == '*' || ((kinds & options).length > 0)) ? filename : nil
  end .compact
end

oforms_options = [
    [['client', '_client'], ['server', '_server']],
    [['handlebars', ''], ['mustache', '_mustache']]
  ]

# Make all possible permutations of the options
def oforms_make_forms(options, suffix, options_list)
  unless options_list.empty?
    opts = options_list.dup
    opts.shift.each do |optname, optsuffix|
      oforms_make_forms(options + [optname], suffix + optsuffix, opts)
    end
    return
  end
  js_file = OForms::JSFileWithTemplates.new(
    "oforms#{suffix}",
    "oForms #{options.join(' ')}",
    File.dirname(__FILE__),
    oforms_filelist(options),
    {
      :server => options.include?('server'),
      :globals => {"_" => false, "Mustache" => false, "Handlebars" => false}
    }
  )
  js_file.set_template(
    'std_templates',
    'std_templates',              # directory name
    'standardTemplates',          # JavaScript var name
    options.include?('mustache')  # mustache templates?
  );
end
oforms_make_forms([], '', oforms_options)
