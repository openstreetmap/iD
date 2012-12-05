iD.format.GeoJSON = {
    mapping: function(entity) {
        if (this.mappings[entity.type]) {
            return this.mappings[entity.type](entity);
        }
    },
    mappings: {
        node: function(entity) {
            return {
                type: 'Feature',
                properties: entity.tags,
                geometry: {
                    type: 'Point',
                    coordinates: entity.loc
                }
            };
        },
        way: function(entity) {
            return {
                type: 'Feature',
                properties: entity.tags,
                geometry: {
                    'type': 'LineString',
                    'coordinates': entity.nodes.map(function(node) {
                        return node.loc;
                    })
                }
            };
        }
    }
};
