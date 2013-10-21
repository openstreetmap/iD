// filters out verticies where the parent entity is already present
// for simpler changeset listing
iD.util.relevantChanges = function(graph, changes, base) {
    var relevant = {};

    function addEntity(entity, changeType) {
        relevant[entity.id] = {
            name: iD.util.displayName(entity) || '',
            entity: entity,
            changeType: changeType,
            geometryType: base.entity(entity.id).geometry(base)
        };
    }

    function addParents(entity) {
        var parents = graph.parentWays(entity);
        for (var j = parents.length - 1; j >= 0; j--) {
            var parent = parents[j];
            if (!(parent.id in relevant)) addEntity(parent, 'modified');
        }
    }

    _.each(changes, function(entities, change) {
        _.each(entities, function(entity) {
            if (entity.geometry(change === 'deleted' ? base : graph) === 'vertex') {
                addParents(entity);
                if (change === 'modified' && (entity.tags !== base.entity(entity.id).tags)) {
                    addEntity(entity, change);
                }
            } else {
                addEntity(entity, change);
            }
        });
    });

    return d3.values(relevant);
};
