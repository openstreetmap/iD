var fs = require('fs'),
    cheerio = require('cheerio');

$ = cheerio.load(fs.readFileSync('imagery.xml'));

var imagery = [];

$('set').each(function(i) {
    var elem = $(this);

    var im = {
        name: $(this).find('name').first().text(),
        url: $(this).find('url').first().text()
    };

    var subdomains = [];

    im.url = im.url
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
            +elem.attr('minlat'),
            +elem.attr('minlon'),
            +elem.attr('maxlat'),
            +elem.attr('maxlon')];
    }

    ['sourcetag', 'logo', 'logo_url', 'terms_url'].forEach(function(a) {
        if (elem.find(a).length) {
            im[a] = elem.find(a).first().text();
        }
    });
    imagery.push(im);
});

fs.writeFileSync('imagery.json', JSON.stringify(imagery, null, 4));
