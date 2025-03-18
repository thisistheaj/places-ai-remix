#!/bin/bash

# The target file
FILE="../public/assets/tilemaps/office_1.json"

# Use awk to process the file line by line
awk '
  # If line contains "image": with a path, fix the path
  /"image":/ {
    # Split into parts before and after the colon
    split($0, parts, ":")
    # Get the value part (everything after the colon)
    value = parts[2]
    # Remove leading/trailing whitespace and quotes
    gsub(/^[ "]+|[ ",]+$/, "", value)
    
    # Find Downloads in the path (handling both / and \)
    if (match(value, /[\/\\]+Downloads[\/\\]/) > 0) {
      # Get the Downloads part and everything after it
      value = substr(value, RSTART + 1)
      # Replace any double slashes and backslashes with single forward slash
      gsub(/[\/\\]+/, "/", value)
    }
    
    # Reconstruct the line preserving original whitespace
    print parts[1] ": \"" value "\","
    next
  }
  
  # If line contains "name":, trim the value
  /"name":/ {
    # Split into parts before and after the colon, but keep the original whitespace
    colon_pos = index($0, ":")
    prefix = substr($0, 1, colon_pos)
    value = substr($0, colon_pos + 1)
    # Remove leading/trailing whitespace and quotes from value only
    gsub(/^[ "]+|[ ",]+$/, "", value)
    # Reconstruct the line preserving original formatting
    print prefix "\"" value "\","
    next
  }
  
  # Print all other lines as-is
  { print }
' "$FILE" > "${FILE}.tmp" && mv "${FILE}.tmp" "$FILE"

echo "Successfully processed $FILE" 