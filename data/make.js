var fs = require('fs');

function r(f) { return JSON.parse(fs.readFileSync(__dirname + '/' + f)); }
function rp(f) { return r('presets/' + f); }

fs.writeFileSync('data.js', 'iD.data = ' + JSON.stringify({
    deprecated: r('deprecated.json'),
    discarded: r('discarded.json'),
    keys: r('keys.json'),
    presets: {
        presets: rp('presets.json'),
        defaults: rp('defaults.json'),
        categories: rp('categories.json'),
        forms: rp('forms.json')
    }
}));
