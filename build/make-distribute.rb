
OUTPUT_DIR = 'distribute'

HEADER = "/*! oForms | (c) Haplo Services Ltd 2012 - #{Time.now.year} | MPLv2 License */\n\n"

# Load build system and definitions
require './build/oforms.rb'

# Make distribution directory
unless File.directory?(OUTPUT_DIR)
  Dir.mkdir(OUTPUT_DIR)
end

puts "Writing files..."
OForms::JSFile.all.each do |file|
  puts "  #{file.filename}.js"
  File.open("#{OUTPUT_DIR}/#{file.filename}.js", 'w') do |f|
    f.write HEADER
    f.write file.data
  end
end

