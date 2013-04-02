iD.presets = function(context) {

    // an iD.presets.Collection with methods for
    // loading new data and returning defaults

    var all = iD.presets.Collection([]),
        defaults = { area: all, line: all, point: all, vertex: all },
        fields = {},
        universal = [],
        recent = iD.presets.Collection([]),
        other,
        other_area;

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

        other = all.item('other');
        other_area = all.item('other_area');

        return all;
    };

    all.field = function(id) {
        return fields[id];
    };

    all.universal = function() {
        return universal;
    };

    all.defaults = function(entity, n) {
        var rec = recent.matchGeometry(entity, context.graph()).collection.slice(0, 4),
            def = _.uniq(rec.concat(defaults[entity.geometry(context.graph())].collection)).slice(0, n - 1),
            geometry = entity.geometry(context.graph());
        return iD.presets.Collection(_.unique(rec.concat(def).concat(geometry === 'area' ? other_area : other)));
    };

    all.choose = function(preset) {
        if (preset !== other && preset !== other_area) {
            recent = iD.presets.Collection(_.unique([preset].concat(recent.collection)));
        }
        return all;
    };

    return all;
};
