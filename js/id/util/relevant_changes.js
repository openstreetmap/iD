// filters out verticies where the parent entity is already present
// for simpler changeset listing
iD.util.relevantChanges = function(graph, entities) {
    var relevant = {};
    for (var i = entities.length - 1; i >= 0; i--) {
        var entity = entities[i];
        if (entity.geometry(graph) === 'vertex') {
            var parents = graph.parentWays(entity);
            for (var j = parents.length - 1; j >= 0; j--) {
                var parent = parents[j];
                relevant[parent.id] = parent;
            }
        } else {
            relevant[entity.id] = entity;
        }
    }
    return d3.values(relevant);
};
