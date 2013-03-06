var fs = require('fs'),
    cheerio = require('cheerio');

$ = cheerio.load(fs.readFileSync('imagery.xml'));

var imagery = [];

// CENSORSHIP! No, these are just layers that essentially duplicate other layers
// or which have no clear use case.
var censor = {
    'MapQuest Open Aerial': true,
    'OSM - OpenCycleMap': true,
    'OSM - MapQuest': true
};

var replace = {
    'OSM - Mapnik': 'OpenStreetMap',
    'National Agriculture Imagery Program': 'NAIP'
};

var description = {
    'MapBox Satellite': 'Satellite and aerial imagery',
    'OpenStreetMap': 'The default OpenStreetMap layer.',
    'OSM US TIGER 2012 Roads Overlay': 'Public domain road data from the US Government.',
    'Bing aerial imagery': 'Satellite imagery.',
    'NAIP': 'National Agriculture Imagery Program'
};

var scaleExtent = {
    'MapBox Satellite': [0, 16],
    'OpenStreetMap': [0, 18],
    'OSM US TIGER 2012 Roads Overlay': [0, 17],
    'Bing aerial imagery': [0, 20]
};

$('set').each(function(i) {
    var elem = $(this);

    var im = {
        name: $(this).find('name').first().text(),
        template: $(this).find('url').first().text()
    };

    // no luck with mapquest servers currently...
    if (im.template.match(/mapquest/g)) return;
    if (censor[im.name]) return;

    im.name = im.name.replace('OSM US', '');

    if (replace[im.name]) im.name = replace[im.name];

    if (description[im.name]) im.description = description[im.name];

    if (scaleExtent[im.name]) im.scaleExtent = scaleExtent[im.name];

    var subdomains = [];

    im.template = im.template
        .replace('$quadkey', '{u}')
        .replace(/\$(\w)/g, function(m) {
            return '{' + m[1] + '}';
        })
        .replace(/\$\{([^}.]+)\}/g, function(m) {
            subdomains = m.slice(2, m.length - 1).split('|');
            return '{t}';
        });

    if (subdomains.length) im.subdomains = subdomains;

    if (elem.attr('minlat')) {
        im.extent = [
            [+elem.attr('minlon'),
            +elem.attr('minlat')],
            [+elem.attr('maxlon'),
            +elem.attr('maxlat')]];
    }

    ['default', 'sourcetag', 'logo', 'logo_url', 'terms_url'].forEach(function(a) {
        if (elem.find(a).length) {
            im[a] = elem.find(a).first().text();
        }
    });
    imagery.push(im);
});

fs.writeFileSync('imagery.json', JSON.stringify(imagery, null, 4));
