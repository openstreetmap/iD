iD.format.XML = {
    mapping: function(entity) {
        if (iD.format.XML.mappings[entity.type]) {
            return iD.format.XML.mappings[entity.type](entity);
        }
    },
    rep: function(entity) {
        if (iD.format.XML.reps[entity.type]) {
            return iD.format.XML.reps[entity.type](entity);
        }
    },
    decode: function(s) {
        return s.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    },
    changeset: function(comment) {
        return (new XMLSerializer()).serializeToString(
        JXON.unbuild({
            osm: {
                changeset: {
                    tag: [
                        { '@k': 'created_by', '@v': 'iD 0.0.0' },
                        { '@k': 'comment', '@v': comment || '' }
                    ],
                    '@version': 0.3,
                    '@generator': 'iD'
                }
            }
        }));
    },
    osmChange: function(userid, changeset, changes) {
        return (new XMLSerializer()).serializeToString(
        JXON.unbuild({
            osmChange: {
                '@version': 0.3,
                '@generator': 'iD',
                // TODO: copy elements first
                create: changes.created.map(function(c) {
                    var x = Object.create(c);
                    x.changeset = changeset;
                    return x;
                }).map(iD.format.XML.rep),
                modify: changes.modified.map(function(c) {
                    var x = Object.create(c);
                    x.changeset = changeset;
                    return x;
                }).map(iD.format.XML.rep)
            }
        }));
    },
    reps: {
        node: function(entity) {
            var r = {
                node: {
                    '@id': entity.id.replace('n', ''),
                    '@lat': entity.lat, '@lon': entity.lon,
                    tag: _.map(entity.tags, function(k, v) {
                        return { keyAttributes: { k: k, v: v } };
                    })
                }
            };
            if (entity.changeset) r.node['@changeset'] = entity.changeset;
            return r;
        },
        way: function(entity) {
            var r = {
                way: {
                    '@id': entity.id.replace('w', ''),
                    nd: entity.nodes.map(function(e) {
                        return { keyAttributes: { ref: e.id } };
                    }),
                    tag: _.map(entity.tags, function(k, v) {
                        return {
                            keyAttributes: { k: k, v: v }
                        };
                    })
                }
            };
            if (entity.changeset) r.way['@changeset'] = entity.changeset;
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
