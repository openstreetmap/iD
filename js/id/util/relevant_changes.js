// filters out verticies where the parent entity is already present
// for simpler changeset listing
iD.util.relevantChanges = function(graph, changes, base) {
    var relevant = {};

    function addEntity(entity, changeType) {
        relevant[entity.id] = {
            entity: entity,
            changeType: changeType,
        };
    }

    function addParents(entity, theGraph) {
        if (!theGraph) theGraph = graph;
        var parents = theGraph.parentWays(entity);
        for (var j = parents.length - 1; j >= 0; j--) {
            var parent = parents[j];
            if (!(parent.id in relevant)) addEntity(parent, 'modified');
        }
    }

    _.each(changes, function(entities, change) {
        _.each(entities, function(entity) {
            var relevantGraph = change === 'deleted' ? base : graph;
            if (entity.geometry(relevantGraph) === 'vertex') {
                addParents(entity, relevantGraph);
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
