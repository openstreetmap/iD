iD.XML = {
    mapping: function(entity) {
        if (this.mappings[entity.type]) {
            return this.mappings[entity.type](entity);
        }
    },
    decode: function(s) {
        return s.replace(/>/g,'&gt;').
                replace(/</g,'&lt;').
                replace(/"/g,'&quot;');
    },
    mappings: {
        node: function(entity) {
            return iD.XML.decode((new XMLSerializer()).serializeToString(
                JXON.unbuild({
                    node: {
                        '@id': entity.id,
                        '@lat': entity.lat,
                        '@lon': entity.lon,
                        'tag': _.map(entity.tags, function(k, v) {
                            return {
                                keyAttributes: {
                                    k: k,
                                    v: v
                                }
                            };
                        })
                    }
                })
            ));
        },
        way: function(entity) {
            return iD.XML.decode(
                (new XMLSerializer()).serializeToString(
                    JXON.unbuild({
                        way: {
                            '@id': entity.id,
                            'nd': entity.nodes.map(function(e) {
                                return {
                                    keyAttributes: {
                                        ref: e.id
                                    }
                                };
                            }),
                            'tag': _.map(entity.tags, function(k, v) {
                                return {
                                    keyAttributes: {
                                        k: k,
                                        v: v
                                    }
                                };
                            })
                        }
                    })));
        }
    }
};
