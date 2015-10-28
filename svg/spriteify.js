#!/usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var XmlStream = require('xml-stream');
var status = 0;

if (argv.help || argv.h || !argv.svg || !argv.json) {
    return help();
}

var stream = fs.createReadStream(argv.svg);
var json = JSON.parse(fs.readFileSync(argv.json));
var svg = new XmlStream(stream);

svg.preserve('id', true);
svg.collect('subitem');
svg.on('endElement: id', function(item) {
  console.log(item);
});

process.exit(status);

function help() {
    console.log('usage:');
    console.log('  spriteify --svg source.svg --json source.json > destination.svg');
    console.log('');
}




