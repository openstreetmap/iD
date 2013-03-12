var fs = require('fs');
var p = JSON.parse(fs.readFileSync('presets.json', 'utf8'));

p = p.map(function(preset) {
    preset.match.terms = (preset.match.terms || []).map(function(t) {
        return t.trim();
    });
    return preset;
});

fs.writeFileSync('presets.json', JSON.stringify(p, null, 4));
