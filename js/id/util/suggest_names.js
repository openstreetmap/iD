iD.util.SuggestNames = function(preset, suggestions) {
    preset = preset.id.split('/', 2);
    var k = preset[0],
        v = preset[1];

    return function(value, callback) {
        var result = [];
        if (value && value.length > 2) {
            if (suggestions[k] && suggestions[k][v]) {
                for (var sugg in suggestions[k][v]) {
                    var dist = iD.util.editDistance(value, sugg.substring(0, value.length));
                    if (dist < 3) {
                        result.push({
                            title: sugg,
                            value: sugg,
                            dist: dist
                        });
                    }
                }
            }
            result.sort(function(a, b) {
                return a.dist - b.dist;
            });
        }
        result = result.slice(0,3);
        callback(result);
    };
};
