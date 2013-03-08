#!/bin/bash
dir=$(dirname $0)
presets=$(find $dir/presets -name "*.json" -exec cat {} \; -exec echo , \;)
echo [${presets%?}] > $dir/presets.json
node -e "
var fs = require('fs');
fs.writeFileSync('$dir/presets.json', JSON.stringify(JSON.parse(fs.readFileSync('$dir/presets.json', 'utf8')), null, 4));
"
