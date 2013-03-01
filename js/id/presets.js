iD.presets = function(context) {

    // an iD.presets.Collection with methods for
    // loading new data and returning defaults

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
        all = iD.presets.Collection([iD.presets.Preset(other)]),
        defaults = { area: all, line: all, point: all, vertex: all },
        forms = {};

    all.load = function(d) {

        if (d.forms) {
            forms = d.forms;
        }

        if (d.presets) {
            d.presets.forEach(function(d) {
                all.collection.push(iD.presets.Preset(d, forms));
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
                area: iD.presets.Collection(d.defaults.area.map(getItem)),
                line: iD.presets.Collection(d.defaults.line.map(getItem)),
                point: iD.presets.Collection(d.defaults.point.map(getItem)),
                vertex: iD.presets.Collection(d.defaults.vertex.map(getItem))
            };
        }
    };

    all.defaults = function(entity) {
        return defaults[entity.geometry(context.graph())];
    };


    return all;
};
