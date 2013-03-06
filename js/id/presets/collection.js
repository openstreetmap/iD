iD.presets.Collection = function(collection) {

    var presets = {

        collection: collection,

        item: function(id) {
            return _.find(collection, function(d) {
                return d.name === id;
            });
        },

        matchType: function(entity, resolver) {
            var newcollection = collection.filter(function(d) {
                return d.matchType(entity, resolver);
            });

            return iD.presets.Collection(newcollection);
        },

        matchTags: function(entity) {

            var best = -1,
                match;

            for (var i = 0; i < collection.length; i++) {
                var score = collection[i].matchTags(entity);
                if (score > best) {
                    best = score;
                    match = collection[i];
                }
            }

            return match;
        },

        search: function(value) {
            if (!value) return this;

            value = value.toLowerCase();

            var substring_name = _.filter(collection, function(a) {
                return a.name.indexOf(value) !== -1;
            }),
            substring_terms = _.filter(collection, function(a) {
                return _.any(a.match.terms || [], function(b) {
                    return iD.util.editDistance(value, b) - b.length + value.length < 3;
                });
            }),
            levenstein_name = collection.map(function(a) {
                return { preset: a, dist: iD.util.editDistance(value, a.name) };
            }).filter(function(a) {
                return a.dist - a.preset.name.length + value.length < 3;
            }).sort(function(a, b) {
                return a.dist - b.dist;
            }).map(function(a) {
                return a.preset;
            }),
            other = _.find(collection, function(a) {
                return a.name === 'other';
            });

            return iD.presets.Collection(
                _.unique(
                    substring_name.concat(
                        substring_terms,
                        levenstein_name,
                        other)));
        }
    };

    return presets;
};
