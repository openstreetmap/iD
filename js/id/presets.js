iD.presets = function() {

    // an iD.presets.Collection with methods for
    // loading new data and returning defaults

    var all = iD.presets.Collection([]),
        defaults = { area: all, line: all, point: all, vertex: all },
        fields = {},
        universal = [],
        recent = iD.presets.Collection([]);

    // Index of presets by (geometry, tag key).
    var index = {
        point: {},
        vertex: {},
        line: {},
        area: {},
        relation: {}
    };

    all.match = function(entity, resolver) {
        var geometry = entity.geometry(resolver),
            geometryMatches = index[geometry],
            best = -1,
            match;

        for (var k in entity.tags) {
            var keyMatches = geometryMatches[k];
            if (!keyMatches) continue;

            for (var i = 0; i < keyMatches.length; i++) {
                var score = keyMatches[i].matchScore(entity);
                if (score > best) {
                    best = score;
                    match = keyMatches[i];
                }
            }
        }

        return match || all.item(geometry);
    };

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
            _.forEach(d.categories, function(d, id) {
                all.collection.push(iD.presets.Category(id, d, all));
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

        for (var i = 0; i < all.collection.length; i++) {
            var preset = all.collection[i],
                geometry = preset.geometry;

            for (var j = 0; j < geometry.length; j++) {
                var g = index[geometry[j]];
                for (var k in preset.tags) {
                    (g[k] = g[k] || []).push(preset);
                }
            }
        }

        return all;
    };

    all.field = function(id) {
        return fields[id];
    };

    all.universal = function() {
        return universal;
    };

    all.defaults = function(geometry, n) {
        var rec = recent.matchGeometry(geometry).collection.slice(0, 4),
            def = _.uniq(rec.concat(defaults[geometry].collection)).slice(0, n - 1);
        return iD.presets.Collection(_.unique(rec.concat(def).concat(all.item(geometry))));
    };

    all.choose = function(preset) {
        if (!preset.isFallback()) {
            recent = iD.presets.Collection(_.unique([preset].concat(recent.collection)));
        }
        return all;
    };

    return all;
};
