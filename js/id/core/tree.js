iD.Tree = function(graph) {

    var rtree = new RTree(),
        m = 1000 * 1000 * 100,
        head = graph,
        queuedCreated = [],
        queuedModified = [],
        x, y, dx, dy, rebased;

    function extentRectangle(extent) {
            x = m * extent[0][0],
            y = m * extent[0][1],
            dx = Math.max(m * extent[1][0] - x, 1),
            dy = Math.max(m * extent[1][1] - y, 1);
        return new RTree.Rectangle(~~x, ~~y, ~~dx, ~~dy);
    }

    function insert(entity) {
        rtree.insert(extentRectangle(entity.extent(head)), entity.id);
    }

    function remove(entity) {
        rtree.remove(extentRectangle(entity.extent(graph)), entity.id);
    }

    function reinsert(entity) {
        remove(graph.entities[entity.id]);
        insert(entity);
    }

    var tree = {

        rebase: function(entities) {
            for (var i = 0; i < entities.length; i++) {
                if (!graph.entities.hasOwnProperty(entities[i])) {
                    insert(graph.entity(entities[i]), true);
                }
            }
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

                modified.forEach(function(d) {
                    if (head.hasAllChildren(d)) reinsert(d);
                    else queuedModified.push(d);
                });

                created.forEach(function(d) {
                    if (head.hasAllChildren(d)) insert(d);
                    else queuedCreated.push(d);
                });

                diff.deleted().forEach(remove);

                graph = head;
                rebased = false;
            }

            return rtree.search(extentRectangle(extent))
                .map(function(id) { return graph.entity(id); });
        },

        graph: function() {
            return graph;
        }

    };

    return tree;
};
