iD.presetData = function() {
    var presets = {},
        data = [];

    presets.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return presets;
    };

    presets.search = function(str) {
        var edits = _.sortBydata.map(function(d) {
            return iD.util.editDistance(d.title, str);
        });
    };

    presets.match = function(entity) {
        return data.filter(function(d) {
            return _.contains(d.type, entity.type);
        });
    };

    return presets;
};
