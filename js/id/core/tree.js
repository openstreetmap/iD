iD.Tree = function(head) {
    var rtree = rbush(),
        rectangles = {};

    function entityRectangle(entity) {
        var rect = entity.extent(head).rectangle();
        rect.id = entity.id;
        rectangles[entity.id] = rect;
        return rect;
    }

    function updateParents(entity, insertions, memo) {
        head.parentWays(entity).forEach(function(way) {
            if (rectangles[way.id]) {
                rtree.remove(rectangles[way.id]);
                insertions[way.id] = way;
            }
            updateParents(way, insertions, memo);
        });

        head.parentRelations(entity).forEach(function(relation) {
            if (memo[entity.id]) return;
            memo[entity.id] = true;
            if (rectangles[relation.id]) {
                rtree.remove(rectangles[relation.id]);
                insertions[relation.id] = relation;
            }
            updateParents(relation, insertions, memo);
        });
    }

    var tree = {};

    tree.rebase = function(entities, force) {
        var insertions = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (!entity.visible)
                continue;

            if (head.entities.hasOwnProperty(entity.id) || rectangles[entity.id]) {
                if (!force) {
                    continue;
                } else if (rectangles[entity.id]) {
                    rtree.remove(rectangles[entity.id]);
                }
            }

            insertions[entity.id] = entity;
            updateParents(entity, insertions, {});
        }

        rtree.load(_.map(insertions, entityRectangle));

        return tree;
    };

    tree.intersects = function(extent, graph) {
        if (graph !== head) {
            var diff = iD.Difference(head, graph),
                insertions = {};

            head = graph;

            diff.deleted().forEach(function(entity) {
                rtree.remove(rectangles[entity.id]);
                delete rectangles[entity.id];
            });

            diff.modified().forEach(function(entity) {
                rtree.remove(rectangles[entity.id]);
                insertions[entity.id] = entity;
                updateParents(entity, insertions, {});
            });

            diff.created().forEach(function(entity) {
                insertions[entity.id] = entity;
            });

            rtree.load(_.map(insertions, entityRectangle));
        }

        return rtree.search(extent.rectangle()).map(function(rect) {
            return head.entity(rect.id);
        });
    };

    return tree;
};
