iD.format.XML = {
    mapping: function(entity) {
        if (iD.format.XML.mappings[entity.type]) {
            return iD.format.XML.mappings[entity.type](entity);
        }
    },
    rep: function(entity, changeset_id) {
        if (iD.format.XML.reps[entity.type]) {
            return iD.format.XML.reps[entity.type](entity, changeset_id);
        } else {
            if (typeof console !== 'undefined') console.log(entity.type);
        }
    },
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
            return iD.format.XML.rep(entity, changeset_id);
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
    },
    reps: {
        node: function(entity, changeset_id) {
            var r = {
                node: {
                    '@id': entity.id.replace('n', ''),
                    '@lon': entity.loc[0],
                    '@lat': entity.loc[1],
                    '@version': (entity.version || 0),
                    tag: _.map(entity.tags, function(v, k) {
                        return { keyAttributes: { k: k, v: v } };
                    })
                }
            };
            if (changeset_id) r.node['@changeset'] = changeset_id;
            return r;
        },
        way: function(entity, changeset_id) {
            var r = {
                way: {
                    '@id': entity.id.replace('w', ''),
                    nd: entity.nodes.map(function(e) {
                        return { keyAttributes: { ref: e.id.replace('n', '') } };
                    }),
                    '@version': (entity.version || 0),
                    tag: _.map(entity.tags, function(v, k) {
                        return { keyAttributes: { k: k, v: v } };
                    })
                }
            };
            if (changeset_id) r.way['@changeset'] = changeset_id;
            return r;
        }
    },
    mappings: {
        node: function(entity) {
            return iD.format.XML.decode((new XMLSerializer()).serializeToString(
                JXON.unbuild(iD.format.XML.reps.node(entity))
            ));
        },
        way: function(entity) {
            return iD.format.XML.decode((new XMLSerializer()).serializeToString(
                JXON.unbuild(iD.format.XML.reps.way(entity))));
        }
    }
};
