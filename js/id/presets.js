iD.presets = function(context) {

    var other = {
            name: 'other',
            title: 'Other',
            icon: 'marker-stroked',
            match: {
                tags: {},
                type: ['point', 'vertex', 'line', 'area']
            },
            form: []
        },
        all = iD.presets.Collection(context, [iD.presets.Preset(other)]),
        defaults = {};

    all.load = function(d) {
        if (d.presets) {
            d.presets.forEach(function(d) {
                all.collection.push(iD.presets.Preset(d));
            });
        }
        if (d.categories) {
            d.categories.forEach(function(d) {
                all.collection.push(iD.presets.Category(d, all));
            });
        }
        if (d.defaults) {
            var getItem = _.bind(all.item, all);
            defaults = {
                area: iD.presets.Collection(context, d.defaults.area.map(getItem)),
                line: iD.presets.Collection(context, d.defaults.line.map(getItem)),
                point: iD.presets.Collection(context, d.defaults.point.map(getItem)),
                vertex: iD.presets.Collection(context, d.defaults.vertex.map(getItem))
            };
        }
    };

    all.defaults = function(entity) {
        return defaults[entity.geometry(context.graph())];
    };


    return all;
};
