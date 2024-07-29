#!/bin/bash

   # Create www directory if it doesn't exist
   mkdir -p www

   # Copy HTML, CSS, and JavaScript files from the root
   cp *.html *.css *.js www/

   # Copy JSON files
   cp *.json www/

   # Copy other asset directories
   cp -R card-images images game-sounds icons letter-sounds www/

   # Copy dist directory if it exists
   if [ -d "dist" ]; then
     cp -R dist www/
   fi

   echo "Build completed. Web assets copied to www directory."
   