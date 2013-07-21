iD.Tree = function(graph) {

    var rtree = rbush(),
        m = 1000 * 1000 * 100,
        head = graph,
        queuedCreated = [],
        queuedModified = [],
        rectangles = {},
        x, y, dx, dy, rebased;

    function extentRectangle(extent) {
        return [
            ~~(m * extent[0][0]),
            ~~(m * extent[0][1]),
            ~~(m * extent[1][0]),
            ~~(m * extent[1][1])
        ];
    }

    function insert(entity) {
        var rect = rectangles[entity.id] = extentRectangle(entity.extent(head));
        rect.id = entity.id;
        rtree.insert(rect);
    }

    function remove(entity) {
        rtree.remove(rectangles[entity.id]);
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
