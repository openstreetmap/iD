iD.presetData = function() {
    var presets = {},
        data = [];

    presets.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return presets;
    };

    presets.match = function(entity) {
        return data.filter(function(d) {
            return _.contains(d.match.type, entity.type);
        });
    };

    return presets;
};
