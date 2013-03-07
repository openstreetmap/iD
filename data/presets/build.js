var fs = require('fs');

var wd = './';

var order = JSON.parse(fs.readFileSync(wd + 'presets/order.json', 'utf8'));

var presets = order.map(function(d) {
    return JSON.parse(fs.readFileSync(wd + 'presets/' + d + '.json', 'utf8'));
});

fs.writeFileSync(wd + 'presets.json', JSON.stringify(presets, null, 4), 'utf8');
