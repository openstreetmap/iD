iD.Tree = function(head) {
    var rtree = rbush(),
        rectangles = {};

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

    function updateParents(entity, insertions) {
        head.parentWays(entity).forEach(function(parent) {
            if (rectangles[parent.id]) {
                rtree.remove(rectangles[parent.id]);
                insertions.push(parent);
            }
        });

        head.parentRelations(entity).forEach(function(parent) {
            if (rectangles[parent.id]) {
                rtree.remove(rectangles[parent.id]);
                insertions.push(parent);
            }
            updateParents(parent, insertions);
        });
    }

    var tree = {};

    tree.rebase = function(entities) {
        var insertions = [];

        entities.forEach(function(entity) {
            if (head.entities.hasOwnProperty(entity.id) || rectangles[entity.id])
                return;

            insertions.push(entity);
            updateParents(entity, insertions);
        });

        insertions = _.unique(insertions).map(entityRectangle);
        rtree.load(insertions);

        return tree;
    };

    tree.intersects = function(extent, graph) {
        if (graph !== head) {
            var diff = iD.Difference(head, graph),
                insertions = [];

            head = graph;

            diff.deleted().forEach(function(entity) {
                rtree.remove(rectangles[entity.id]);
                delete rectangles[entity.id];
            });

            diff.modified().forEach(function(entity) {
                rtree.remove(rectangles[entity.id]);
                insertions.push(entity);
                updateParents(entity, insertions);
            });

            diff.created().forEach(function(entity) {
                insertions.push(entity);
            });

            insertions = _.unique(insertions).map(entityRectangle);
            rtree.load(insertions);
        }

        return rtree.search(extentRectangle(extent)).map(function(rect) {
            return head.entity(rect.id);
        });
    };

    return tree;
};
