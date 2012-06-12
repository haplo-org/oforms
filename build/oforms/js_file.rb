
module OForms

  class JSFile
    # List of all files
    @@all_js_files = []
    
    def initialize(filename, description, source_base, source_files, syntax_check_options)
      @filename = filename
      @description = description
      @source_base = source_base
      @source_files = source_files
      @syntax_check_options = syntax_check_options
      @@all_js_files << self
    end
    
    attr_reader :filename
    attr_reader :description
    attr_reader :syntax_check_options
    
    # Assemble the file, returning the assembled file and the map of line numbers to source files
    AssembleOutput = Struct.new(:data, :source_map)
    def assemble
      source_map = []
      line = 1
      data = ''
      @source_files.each do |filename|
        source_map << [line, filename]
        data << "/////////////////////////////// #{filename} ///////////////////////////////\n"
        contents = read(filename)
        data << contents
        data << "\n"
        line += 2 + contents.gsub(/[^\n]/,'').length
      end
      # Apply sealing directive?
      sealed = []
      data.scan(/\/\*\s*seal\s*\*\/\s*(\w+)/) { sealed << $1 }
      data.gsub!(/\/\*\s*sealed\s+objects\s*\*\//) do
        sealed.join(',')
      end
      # Messages?
      messages_filename = "#{@source_base}/messages.txt"
      if File.exist?(messages_filename)
        File.open(messages_filename) do |messages_file|
          messages_file.each do |line|
            line = line.strip
            next unless line =~ /\A[^#].*\S/
            symbol, subst = line.split(/\s+/,2)            
            data.gsub!(symbol, subst)
          end
        end
      end
      AssembleOutput.new(data, source_map)
    end
    
    def data
      assemble.data
    end

    def read(filename)
      File.open("#{@source_base}/#{filename}") do |f|
        f.read
      end
    end
    
    # Print out the list of javascript files on load.
    def self.post_load
      puts "JavaScript file definitions loaded:"
      @@all_js_files.each do |file|
        puts "  #{file.description} - #{file.filename}.js"
      end
    end
    
    # Return all the files
    def self.all
      @@all_js_files.dup
    end
    
    # Get a specific file, given the filename
    def self.find(filename)
      @@all_js_files.find { |f| f.filename == filename }
    end
  end

end
