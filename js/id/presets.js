iD.presets = function(context) {

    // an iD.presets.Collection with methods for
    // loading new data and returning defaults

    var other = iD.presets.Preset('other', {
            tags: {},
            geometry: ['point', 'vertex', 'line', 'area']
        }),
        otherarea = iD.presets.Preset('other/area', {
            tags: { area: 'yes' },
            geometry: ['area']
        }),
        all = iD.presets.Collection([other, otherarea]),
        defaults = { area: all, line: all, point: all, vertex: all },
        fields = {},
        universal = [],
        recent = iD.presets.Collection([]);

    all.load = function(d) {

        if (d.fields) {
            _.forEach(d.fields, function(d, id) {
                fields[id] = iD.presets.Field(id, d);
                if (d.universal) universal.push(fields[id]);
            });
        }

        if (d.presets) {
            _.forEach(d.presets, function(d, id) {
                all.collection.push(iD.presets.Preset(id, d, fields));
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

    all.universal = function() {
        return universal;
    };

    all.defaults = function(entity, n) {
        var rec = recent.matchGeometry(entity, context.graph()).collection.slice(0, 4),
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
