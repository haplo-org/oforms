
module OForms

  class SyntaxChecker
    Context = Java::OrgMozillaJavascript::Context
    @@runtime_mutex = Mutex.new
    @@scope = nil

    def initialize(name, javascript, source_map, options)
      @name = name
      @javascript = javascript
      @source_map = source_map
      @options = options
    end

    def run_check
      Thread.new do
        @@runtime_mutex.synchronize do
          begin
            cx = Context.enter();
            unless @@scope
              @@scope = cx.initStandardObjects();
              jshint = File.open("#{File.dirname(__FILE__)}/../thirdparty/jshint.js") { |f| f.read }
              cx.evaluateString(@@scope, jshint, "<jshint.js>", 1, nil);
              testerfn = File.open("#{File.dirname(__FILE__)}/syntax_check.js") { |f| f.read }
              cx.evaluateString(@@scope, testerfn, "<syntax_test.js>", 1, nil);
              # Get the tester function
              @@syntax_tester = @@scope.get("syntax_tester", @@scope);
            end

            serverSide = !!(@options[:server])
            globals = @options[:globals] || {}

            result = @@syntax_tester.call(cx, @@scope, @@scope, [@javascript, serverSide, globals.to_json])
            if result != nil
              puts "*************************************************"
              puts "#{@name} has syntax errors:"
              # Map the source files in the result text
              result = result.gsub(/^line (\d+):/) do
                line_number = $1.to_i
                start = 1
                filename = @name
                @source_map.each do |s,f|
                  if s <= line_number
                    start = s
                    filename = f
                  end
                end
                "#{filename}:#{line_number - start} - "
              end
              puts result
              puts
              # Bleep to get attention
              $stdout.write("\07")
            else
              puts "#{@name} syntax OK"
            end

          rescue => e
            puts "EXCEPTION IN SYNTAX CHECKER"
            puts e.inspect
            puts e.backtrace.join("\n")
          ensure
            Context.exit();
          end
        end
      end
    end

  end

end