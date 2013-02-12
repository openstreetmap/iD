iD.Tree = function(graph) {

    var rtree = new RTree(),
        m = 1000 * 1000 * 100,
        head = graph;

    function extentRectangle(extent) {
            x = m * extent[0][0],
            y = m * extent[0][1],
            dx = m * extent[1][0] - x || 2,
            dy = m * extent[1][1] - y || 2;
        return new RTree.Rectangle(~~x, ~~y, ~~dx - 1, ~~dy - 1);
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
                insert(graph.entities[entities[i]]);
            }
            return tree;
        },

        intersects: function(extent, g) {

            head = g;

            if (graph !== head) {
                var diff = iD.Difference(graph, head),
                    modified = {};

                diff.modified().forEach(function(d) {
                    var loc = graph.entities[d.id].loc;
                    if (!loc || loc[0] !== d.loc[0] || loc[1] !== d.loc[1]) {
                        modified[d.id] = d;
                    }
                });

                d3.values(diff.addParents(modified)).map(reinsert);
                diff.created().forEach(insert);
                diff.deleted().forEach(remove);

                graph = head;
            }

            return rtree.search(extentRectangle(extent))
                .map(function(id) { return graph.entity(id); });
        },

        base: function() {
            return graph;
        }

    };

    return tree;
};
