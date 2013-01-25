iD.format.GeoJSON = {
    mapping: function(entity, graph) {
        if (this.mappings[entity.type]) {
            return this.mappings[entity.type](entity, graph);
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
        way: function(entity, graph) {
            return {
                type: 'Feature',
                properties: entity.tags,
                geometry: {
                    'type': 'LineString',
                    'coordinates': _.pluck(graph.childNodes(entity), 'loc')
                }
            };
        }
    }
};
