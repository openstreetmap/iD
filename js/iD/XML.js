iD.XML = {
    mapping: function(entity) {
        if (this.mappings[entity.type]) {
            return this.mappings[entity.type](entity);
        }
    },
    mappings: {
        node: function(entity) {
            /*
            return {
                type: 'Feature',
                properties: entity.tags,
                geometry: {
                    type: 'Point',
                    coordinates: [entity.lon, entity.lat]
                }
            };
            */
        },
        way: function(entity) {
            return (new XMLSerializer()).serializeToString(
            JXON.unbuild({
                way: {
                    '@id': entity.id,
                    'nd': entity.children.map(function(e) {
                        return {
                            keyAttributes: {
                                ref: e.id
                            }
                        };
                    })
                }
            })).replace(/>/g,'&gt;').
                replace(/</g,'&lt;').
                replace(/"/g,'&quot;');
        }
    }
};
