# Library modules
require 'rubygems'
gem 'mongrel'
require 'mongrel'

# Load build system and definitions
require 'build/oforms.rb'

# Run a test server
class TestServer
  PORT = 5656
  
  def self.run
    server = Mongrel::HttpServer.new("0.0.0.0", PORT)
    server.register('/', RootHandler.new)
    server.register('/appearance', Mongrel::DirHandler.new('src/appearance', false))
    server.register('/thirdparty', Mongrel::DirHandler.new('lib/thirdparty', false))
    server.register('/oforms-js', JSFileHandler.new)
    server.register('/data-source/1', WordLookupHandler.new)
    puts "Running oForms test server at http://#{`hostname`.chomp}.#{`domainname`.chomp}:#{PORT} ..."
    server.run.join
  end
  
  class RootHandler < Mongrel::HttpHandler
    def initialize
      @files = Mongrel::DirHandler.new('test/server_root', false)
    end
    def process(request, response)
      if request.params[Mongrel::Const::REQUEST_URI] =~ /\A\/(\?style\=([,\w]+))?\Z/
        style = ($2 || "oforms").split(',')
        File.open("test/server_root/index.html") do |f|
          contents = f.read
          contents.gsub!(/(\<\!-- IF\((\!?)(\w+?)\) --\>(.+?)\<\!-- ENDIF --\>)/m) do
            inc = style.include?($3)
            inc = !inc if $2 == '!'
            inc ? $1 : ''
          end
          response.start(200) do |head,out|
            head["Content-Type"] = 'text/html; charset=utf-8'
            out.write contents
          end
        end
      else
        @files.process(request, response)
      end
    end
  end
  
  class JSFileHandler < Mongrel::HttpHandler
    def initialize
    end
    def process(request, response)
      path_name = request.params[Mongrel::Const::PATH_INFO]
      filename = path_name[1,path_name.length-1]
      puts "GET assembled JS file: #{filename}"
      # Find the file
      file = OForms::JSFile.find(filename.gsub(/\.js\Z/,''))
      return unless file
      # Generate assembled JavaScript
      assembled = file.assemble
      javascript = assembled.data
      # Return the JavaScript file
      response.start(200) do |head,out|
        head["Content-Type"] = 'text/javascript; charset=utf-8'
        out.write javascript
      end
      # Start some syntax checking in another thread
      checker = OForms::SyntaxChecker.new(filename, assembled.data, assembled.source_map, file.syntax_check_options)
      checker.run_check
    end
  end  
  
  class WordLookupHandler < Mongrel::HttpHandler
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
    def initialize
    end
    def process(request, response)
      query = '';
      if request.params[Mongrel::Const::REQUEST_URI] =~ /[\&\?]q\=(.+?)(\&|\Z)/
        query = URI.unescape($1)
      end
      if query != ''
        puts "Word lookup query: #{query}"
        results = WORDS.select { |s| s.include?(query) }
        if results.length > 10
          results = results.slice(0, 10)
        end
        r = {:query => query, :results => results.map { |n| ["id-#{n.gsub(' ','-')}", n.capitalize]}}
        if results.include?(query)
          # Mark it as a direct hit
          r["selectId"] = "id-#{query}"
          r["selectDisplay"] = query.capitalize
        end
        if results.empty?
          # Display a message instead
          r[:message] = 'No matches found'
        end
        response.start(200) do |head,out|
          head["Content-Type"] = 'application/json; charset=utf-8'
          out.write(r.to_json)
        end
      end
    end
  end
end

TestServer.run
