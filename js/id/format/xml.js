iD.format.XML = {
    decode: function(s) {
        return s.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    },

    // Generate Changeset XML. Returns a string.
    changeset: function(tags) {
        return (new XMLSerializer()).serializeToString(
        JXON.unbuild({
            osm: {
                changeset: {
                    tag: _.map(tags, function(value, key) {
                        return { '@k': key, '@v': value };
                    }),
                    '@version': 0.3,
                    '@generator': 'iD'
                }
            }
        }));
    },

    // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
    // XML. Returns a string.
    osmChange: function(userid, changeset_id, changes) {
        function nest(x) {
            var groups = {};
            for (var i = 0; i < x.length; i++) {
                var tagName = Object.keys(x[i])[0];
                if (!groups[tagName]) groups[tagName] = [];
                groups[tagName].push(x[i][tagName]);
            }
            var order = ['node', 'way', 'relation'];
            var ordered = {};
            order.forEach(function(o) {
                if (groups[o]) ordered[o] = groups[o];
            });
            return ordered;
        }

        function rep(entity) {
            return entity.asJXON(changeset_id);
        }

        return (new XMLSerializer()).serializeToString(JXON.unbuild({
            osmChange: {
                '@version': 0.3,
                '@generator': 'iD',
                // TODO: copy elements first
                create: nest(changes.created.map(rep)),
                modify: changes.modified.map(rep),
                'delete': changes.deleted.map(function(x) {
                    x = rep(x);
                    x['@if-unused'] = true;
                    return x;
                })
            }
        }));
    }
};
