#!/usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
if (argv.help || argv.h || !argv.svg) {
    return help();
}

var fs = require('fs');
var json = (argv.json ? JSON.parse(fs.readFileSync(argv.json)) : {});
var _ = require('../js/lib/lodash.js');
var xml2js = require('xml2js');

xmlToJs(argv.svg, function (err, obj) {
    if (err) throw (err);
    jsToXml(obj, function (err) {
        if (err) console.log(err);
    });
});

function xmlToJs(filename, cb) {
    fs.readFile(filename, 'utf8', function (err, xmlStr) {
        if (err) throw (err);

        var opts = {
                explicitArray: true,
                explicitCharkey: true,
                explicitChildren: true,
                preserveChildrenOrder: true,
                normalize: true,
                attrkey: '#attr',
                childkey: '#child',
                charkey: '#char'
            },
            parser = new xml2js.Parser(opts);

        parser.parseString(xmlStr, function (err, obj) {
            cb(err, obj);
        });
    });
}


function jsToXml(obj, cb) {
    var src = transform(obj.svg);
    var builder = require('xmlbuilder');
    var doc = builder.create('svg',
        { version: '1.0', encoding: 'UTF-8' },
        { pubID: '-//W3C//DTD SVG 1.1//EN', sysID: 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'}
    );

    doc = build(doc, src);
    process.stdout.write(doc.end({ pretty: true }), 'utf8', cb);
}


function transform(source) {
    var target = {};
    target['#name'] = source['#name'];

    if (source['#char'] !== undefined) {
        target['#char'] = source['#char'];
    }
    if (source['#attr'] !== undefined) {
        var id = source['#attr'].id,
            replace = (id && json[id] !== undefined) ? json[id] : {};

        target['#attr'] = _.merge(source['#attr'], replace);
        if (replace.viewBox !== undefined) {
            target['#name'] = 'symbol';
        }

    }
    if (source['#child'] !== undefined && source['#child'].constructor === Array) {
        target['#child'] = [];
        for (var i = 0; i < source['#child'].length; i++) {
            target['#child'].push(transform(source['#child'][i]));
        }
    }

    return target;
}


function build(doc, source) {
    if (source['#name']) {
        var isRoot = (source['#name'] === 'svg');

        if (!isRoot) {
            doc = doc.ele(source['#name']);
        }
        if (source['#attr']) {
            doc = doc.att(source['#attr']);
        }
        if (source['#char']) {
            doc = doc.txt(source['#char']);
        }
        if (source['#child'] && source['#child'].constructor === Array) {
            for (var i = 0; i < source['#child'].length; i++) {
                doc = build(doc, source['#child'][i]);
            }
        }

        if (isRoot) {
            doc = doc.att({
                'version': "1.1",
                'xmlns': "http://www.w3.org/2000/svg",
                'xmlns:xlink': "http://www.w3.org/1999/xlink"
            });
        } else {
            doc = doc.up();
        }
    }
    return doc;
}


function help() {
    console.log('usage:');
    console.log('  spriteify --svg source.svg --json source.json > destination.svg');
    console.log('');
}

