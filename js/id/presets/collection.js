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

            // Uses levenshtein distance, with a couple of hacks
            // to prioritize exact substring matches
            return iD.presets.Collection(collection.sort(function(a, b) {
                var ia = a.name.indexOf(value) >= 0,
                    ib = b.name.indexOf(value) >= 0;

                if (ia && !ib) {
                    return -1;
                } else if (ib && !ia) {
                    return 1;
                }

                return iD.util.editDistance(value, a.name) - iD.util.editDistance(value, b.name);
            }).filter(function(d) {
                return iD.util.editDistance(value, d.name) - d.name.length + value.length < 3 ||
                    d.name === 'other';
            }));
        }

    };

    return presets;
};
