iD.presetData = function() {
    var presets = {},
        data = [],
        defaults = {
            node: [],
            area: [],
            line: []
        };

    presets.data = function(_) {
        if (!arguments.length) return data;
        data = _.presets;
        defaults = _.defaults;
        return presets;
    };

    presets.defaults = function(entity) {
        var type = entity.type == 'node' ? 'node' : entity.geometry();
        return defaults[type].map(function(def) {
            return _.find(data, function(d) {
                return d.name === def;
            });
        });
    };

    presets.match = function(entity) {
        var type = entity.type == 'node' ? 'node' : entity.geometry();
        return data.filter(function(d) {
            return _.contains(d.match.type, type);
        });
    };

    presets.matchTags = function(entity) {
        var tags, count, best,
            maxcount = -1,
            type = entity.type == 'node' ? 'node' : entity.geometry();

        for (var i = 0; i < data.length; i++) {
            count = 0;
            tags = data[i].match.tags;
            for (var k in tags) {
                if (entity.tags[k] == tags[k] || (tags[k] === '*' && entity.tags[k])) count++;
                else break;
            }
            if (Object.keys(tags).length === count && count > maxcount) {
                best = data[i], maxcount = count;
            }
        }
        return best;
    };

    return presets;
};
