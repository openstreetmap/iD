iD.presets = function(context) {

    // an iD.presets.Collection with methods for
    // loading new data and returning defaults

    var other = iD.presets.Preset({
            name: 'other',
            icon: 'marker-stroked',
            match: {
                tags: {},
                type: ['point', 'vertex', 'line', 'area']
            },
            form: []
        }),
        all = iD.presets.Collection([iD.presets.Preset(other)]),
        defaults = { area: all, line: all, point: all, vertex: all },
        forms = {},
        recent = iD.presets.Collection([]);

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

        return all;
    };

    all.defaults = function(entity, n) {
        var rec = recent.matchType(entity, context.graph()).collection.slice(0, 4),
            def = _.uniq(rec.concat(defaults[entity.geometry(context.graph())].collection)).slice(0, n - 1);
        return iD.presets.Collection(_.unique(rec.concat(def).concat(other)));
    };

    all.choose = function(preset) {
        if (preset !== other) {
            recent = iD.presets.Collection(_.unique([preset].concat(recent.collection)));
        }
        return all;
    };


    return all;
};
