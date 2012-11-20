iD.format.XML = {
    mapping: function(entity) {
        if (this.mappings[entity.type]) {
            return this.mappings[entity.type](entity);
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
                        { '@k': 'created_by', '@v': 'iD' },
                        { '@k': 'comment', '@v': comment || '' }
                    ],
                    '@version': 0.3,
                    '@generator': 'iD'
                }
            }
        }));
    },
    osmChange: function() {
        return (new XMLSerializer()).serializeToString(
        JXON.unbuild({
            osmChange: {
                '@version': 0.3,
                '@generator': 'iD'
            }
        }));
    },
    mappings: {
        node: function(entity) {
            return iD.format.XML.decode((new XMLSerializer()).serializeToString(
                JXON.unbuild({
                    node: {
                        '@id': entity.id,
                        '@lat': entity.lat, '@lon': entity.lon,
                        tag: _.map(entity.tags, function(k, v) {
                            return { keyAttributes: { k: k, v: v } };
                        })
                    }
                })
            ));
        },
        way: function(entity) {
            return iD.format.XML.decode(
                (new XMLSerializer()).serializeToString(
                    JXON.unbuild({
                        way: {
                            '@id': entity.id,
                            nd: entity.nodes.map(function(e) {
                                return { keyAttributes: { ref: e.id } };
                            }),
                            tag: _.map(entity.tags, function(k, v) {
                                return {
                                    keyAttributes: { k: k, v: v }
                                };
                            })
                        }
                    })));
        }
    }
};
