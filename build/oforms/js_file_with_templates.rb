
module OForms

  class JSFileWithTemplates < JSFile
    def initialize(*args)
      super(*args)
      @template_dirs = {}
    end

    def set_template(name, dir, varname, mustache_format)
      @template_dirs[name] = [dir, varname, mustache_format]
    end
    
    def read(filename)
      if @template_dirs.has_key?(filename)
        # This 'file' is actually a directory of templates.
        # The filename, without the extension, is used as the key in the variable named as varname.
        # _'s in the filename are converted to :'s, so names like oforms:table-header can be generated.
        dir, varname, mustache_format = @template_dirs[filename]
        dirname = "#{@source_base}/#{dir}"
        lines = []
        Dir.entries(dirname).sort.each do |fn|
          unless fn =~ /\A\./
            # Read template string
            str = File.open("#{dirname}/#{fn}") { |f| f.read }
            # Convert to Mustache or Handlebars - format has been tweaked to use {{*# or {{^# to denote if statements
            str.gsub!(/\{\{([^\}]+)\|\|([^\}]+)\}\}/) do
              # Straight mustache || handlebars option
              "{{#{mustache_format ? $1 : $2}}}"
            end
            done = str
            while nil != done
              done = str.gsub!(/\{\{\*([\#\^])([^\}]+)\}\}(.+?){{\/\2}}/m) do
                if mustache_format
                  # Just output it without the *
                  "{{#{$1}#{$2}}}#{$3}{{/#{$2}}}"
                else
                  # Convert to Handlebars format
                  helper = ($1 == '#') ? 'if' : 'unless'
                  "{{##{helper} #{$2}}}#{$3}{{/#{helper}}}"
                end
              end
            end
            if mustache_format
              str.gsub!('../', '') # Mustache just looks backwards, instead of needing explicit path
            end
            # Check that the output doesn't contain the ' char, which would break the encoding
            raise "#{fn} contains ' char" if str.include?("'")
            fn =~ /\A(.+?)\.\w+/
            lines << "    '#{$1.gsub('_',':')}': '#{clean_template(str)}'"
          end
        end
        "\nvar #{varname} = {\n#{lines.join(",\n")}\n};\n"
      else
        super(filename)
      end
    end

    def clean_template(str)
      # Remove any multi-line HTML comments from rhtml files (may leave blank lines in source)
      str = str.gsub(/\<\!\-\-.+?\-\-\>/m,'')
      # Remove any unnecessary line breaks
      str = str.gsub(/([\>}])\s*[\r\n]+\s*([\<{])/m,'\1\2')
      # Remove any whitespace at beginning or end
      str.strip
    end

  end

end
