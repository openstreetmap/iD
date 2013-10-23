// filters out verticies where the parent entity is already present
// for simpler changeset listing
iD.util.relevantChanges = function(graph, changes, base) {
    var relevant = {};

    function addEntity(entity, changeType) {
        relevant[entity.id] = {
            entity: entity,
            changeType: changeType
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
            if (entity.geometry(change === 'deleted' ? base : graph) !== 'vertex') {
                addEntity(entity, change);

            } else if (change === 'modified') {
                var moved    = entity.loc  !== base.entity(entity.id).loc,
                    retagged = entity.tags !== base.entity(entity.id).tags;

                if (moved) {
                    addParents(entity, graph);
                }

                if (retagged || (moved && entity.hasInterestingTags())) {
                    addEntity(entity, change);
                }
            }
        });
    });

    return d3.values(relevant);
};
