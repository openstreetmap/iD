iD.Tree = function(graph) {

    var rtree = rbush(),
        head = graph,
        queuedCreated = [],
        queuedModified = [],
        rectangles = {},
        rebased;

    function extentRectangle(extent) {
        return [
            extent[0][0],
            extent[0][1],
            extent[1][0],
            extent[1][1]
        ];
    }

    function entityRectangle(entity) {
        var rect = extentRectangle(entity.extent(head));
        rect.id = entity.id;
        rectangles[entity.id] = rect;
        return rect;
    }

    function remove(entity) {
        rtree.remove(rectangles[entity.id]);
        delete rectangles[entity.id];
    }

    function bulkInsert(entities) {
        for (var i = 0, rects = []; i < entities.length; i++) {
            rects.push(entityRectangle(entities[i]));
        }
        rtree.load(rects);
    }

    function bulkReinsert(entities) {
        entities.forEach(remove);
        bulkInsert(entities);
    }

    var tree = {

        rebase: function(entities) {
            for (var i = 0, inserted = []; i < entities.length; i++) {
                if (!graph.entities.hasOwnProperty(entities[i])) {
                    inserted.push(graph.entity(entities[i]));
                }
            }
            bulkInsert(inserted);
            rebased = true;
            return tree;
        },

        intersects: function(extent, g) {

            head = g;

            if (graph !== head || rebased) {
                var diff = iD.Difference(graph, head),
                    modified = {};

                diff.modified().forEach(function(d) {
                    var loc = graph.entities[d.id].loc;
                    if (!loc || loc[0] !== d.loc[0] || loc[1] !== d.loc[1]) {
                        modified[d.id] = d;
                    }
                });

                var created = diff.created().concat(queuedCreated);
                modified = d3.values(diff.addParents(modified))
                    // some parents might be created, not modified
                    .filter(function(d) { return !!graph.hasEntity(d.id); })
                    .concat(queuedModified);
                queuedCreated = [];
                queuedModified = [];

                var reinserted = [],
                    inserted = [];

                modified.forEach(function(d) {
                    if (head.hasAllChildren(d)) reinserted.push(d);
                    else queuedModified.push(d);
                });

                created.forEach(function(d) {
                    if (head.hasAllChildren(d)) inserted.push(d);
                    else queuedCreated.push(d);
                });

                bulkReinsert(reinserted);
                bulkInsert(inserted);

                diff.deleted().forEach(remove);

                graph = head;
                rebased = false;
            }

            return rtree.search(extentRectangle(extent)).map(function (rect) {
                return graph.entities[rect.id];
            });
        },

        graph: function() {
            return graph;
        }

    };

    return tree;
};
