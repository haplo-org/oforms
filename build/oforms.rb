# Library code
require 'rubygems'
gem 'json'
require 'json'
require 'thread'

# Init Java and load Rhino
require 'java'
RHINO_JAR = File.dirname(__FILE__)+"/thirdparty/js-1.7R3.jar"
unless File.exist?(RHINO_JAR)
  puts "Download the Rhino JavaScript interpreter and place jar file at #{RHINO_JAR}"
  exit 1
end
require RHINO_JAR

module OForms
end

# Load the output file generation
require File.dirname(__FILE__)+"/oforms/js_file.rb"
require File.dirname(__FILE__)+"/oforms/js_file_with_templates.rb"

# Load utility code
require File.dirname(__FILE__)+"/oforms/syntax_check.rb"

# Load the form file descriptions
Dir.glob("#{File.dirname(__FILE__)}/../src/**/*.rb").sort.each do |filename|
  require filename
end

# Post-load init
OForms::JSFile.post_load
