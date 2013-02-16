iD.presetData = function() {
    var presets = {},
        data = [];

    presets.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return presets;
    };

    presets.favs = function() {
        return data.filter(function(d) {
            return d.favorite;
        });
    };

    presets.match = function(entity) {
        var type = entity.type == 'node' ? 'node' : entity.geometry();
        return data.filter(function(d) {
            return _.contains(d.type, type);
        });
    };

    presets.matchTags = function(entity) {
        var tags, count, best,
            maxcount = 0,
            type = entity.type == 'node' ? 'node' : entity.geometry();

        for (var i = 0; i < data.length; i++) {
            count = 0;
            tags = data[i].tags;
            if (!_.contains(data[i].type, type)) continue;
            for (var k in tags) {
                if (entity.tags[k] == tags[k]) count++;
            }
            if (count > maxcount) best = data[i], maxcount = count;
        }
        return best;
    };

    return presets;
};
