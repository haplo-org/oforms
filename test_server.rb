# Library modules
require 'rubygems'
require 'webrick'

# Load build system and definitions
require 'build/oforms.rb'

# Run a test server
class TestServer
  PORT = 5656

  def self.run
    server = WEBrick::HTTPServer.new(:Port => PORT, :AccessLog => [[$stderr, WEBrick::AccessLog::COMMON_LOG_FORMAT]])
    server.mount('/', RootHandler, 'test/server_root')
    server.mount('/appearance', WEBrick::HTTPServlet::FileHandler, 'src/appearance')
    server.mount('/thirdparty', WEBrick::HTTPServlet::FileHandler, 'lib/thirdparty')
    server.mount('/oforms-js', JSFileHandler)
    server.mount('/data-source/1', WordLookupHandler)
    puts "Running oForms test server at http://#{`hostname`.chomp}.#{`domainname`.chomp}:#{PORT} ..."
    server.start
  end

  class RootHandler < WEBrick::HTTPServlet::FileHandler
    def initialize(server, root, options={})
      super(server, root, options)
    end
    def do_GET(request, response)
      if request.meta_vars["PATH_INFO"] == "/" and request.meta_vars["QUERY_STRING"] =~ /\A(style\=([,\w]+))?\Z/
        style = ($2 || "oforms").split(',')
        File.open("test/server_root/index.html") do |f|
          contents = f.read
          contents.gsub!(/(\<\!-- IF\((\!?)(\w+?)\) --\>(.+?)\<\!-- ENDIF --\>)/m) do
            inc = style.include?($3)
            inc = !inc if $2 == '!'
            inc ? $1 : ''
          end
          response.body = contents
          response.chunked = true
          response.header["Content-Type"] = 'text/html; charset=utf-8'
          response.status = 200
        end
      else
        super(request, response)
      end
    end
  end

  class JSFileHandler < WEBrick::HTTPServlet::AbstractServlet
    def do_GET(request, response)
      path_name = request.meta_vars["PATH_INFO"]
      filename = path_name[1,path_name.length-1]
      puts "GET assembled JS file: #{filename}"
      # Find the file
      file = OForms::JSFile.find(filename.gsub(/\.js\Z/,''))
      return unless file
      # Generate assembled JavaScript
      assembled = file.assemble
      javascript = assembled.data
      # Return the JavaScript file
      response.body = javascript
      response.header["Content-Type"] = 'text/javascript; charset=utf-8'
      response.chunked = true
      response.status = 200
      # Start some syntax checking in another thread
      checker = OForms::SyntaxChecker.new(filename, assembled.data, assembled.source_map, file.syntax_check_options)
      checker.run_check
    end
  end

  class WordLookupHandler < WEBrick::HTTPServlet::AbstractServlet
    symbols = {}
    Dir.glob("#{File.dirname(__FILE__)}/**/*.{js,rb}").each do |filename|
      File.open(filename) do |file|
        file.read.scan(/([a-zA-Z][a-zA-Z][a-zA-Z]+)/) { symbols[$1.downcase] = true }
      end
    end
    WORDS = symbols.keys.sort
    1.upto(WORDS.length - 1) do |i|
      WORDS << "#{WORDS[i-1]} #{WORDS[i]}"
    end
    WORDS.sort!
    @@query_index = 0
    def do_GET(request, response)
      query = '';
      if request.meta_vars["REQUEST_URI"] =~ /[\&\?]q\=(.+?)(\&|\Z)/
        query = URI.unescape($1)
      end
      if query != ''
        @@query_index += 1
        puts "Word lookup query: #{query}"
        results = WORDS.select { |s| s.include?(query) }
        if results.length > 10
          results = results.slice(0, 10)
        end
        # Add number on the end so auto-complete entries can be different to the text of the object
        r = {:query => query, :results => results.map { |n| ["id-#{n.gsub(' ','-')}", n.capitalize, "#{n.capitalize} (#{@@query_index})"]}}
        if results.include?(query)
          # Mark it as a direct hit
          r["selectId"] = "id-#{query}"
          r["selectDisplay"] = query.capitalize
        end
        if results.empty?
          # Display a message instead
          r[:message] = 'No matches found'
        end
        response.body = r.to_json
        response.chunked = true
        response.header["Content-Type"] = 'application/json; charset=utf-8'
        response.status = 200
      end
    end
  end
end

TestServer.run
