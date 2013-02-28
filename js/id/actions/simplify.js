iD.actions.Simplify = function(wayId, projection) {
    
    function closestIndex(nodes, loc) {
        var idx, min = Infinity, dist;
        for (var i = 0; i < nodes.length; i++) {
            dist = iD.geo.dist(nodes[i].loc, loc);
            if (dist < min) {
                min = dist;
                idx = i;
            }
        }
        return idx;
    }

    // Handles two corner cases
    // 
    // 1. Reuse as many old nodes as possible
    // 2. Don't move or eliminate any nodes that have more than one
    //    parent way.
    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            node, i, j, ids = [], idx,
            singleParent = [], multiParent = [];

        for (i = 0; i < nodes.length; i++) {
            if (graph.parentWays(nodes[i]).length === 1) singleParent.push(nodes[i]);
            else multiParent.push(nodes[i]);
        }

        // all points that have a single way parent
        var points = singleParent.map(function(n) {
            // simplify.js accepts {x,y} objects.
            var p = projection(n.loc);
            return { x: p[0], y: p[1] };
        });

        // tolerance of 0.8 - adjust as needed. simplification is guaranteed
        // to produce fewer points in output than input
        var simplified = simplify(points, 0.8).map(function(p) {
            // convert back to iD's 2-elem array pattern
            return { loc: projection.invert([p.x, p.y]) };
        });

        // first reuse all singleParent nodes. the
        // ones not reused will be deleted
        for (i = 0; i < simplified.length; i++) {
            // reuse nodes for single parent nodes
            idx = closestIndex(singleParent, simplified[i].loc);
            node = singleParent[idx];
            singleParent.splice(idx, 1);
            graph = graph.replace(node.move(simplified[i].loc));
            ids.push(node.id);
        }

        // then insert all multiParent nodes
        for (i = 0; i < multiParent.length; i++) {
            idx = closestIndex(simplified, multiParent[i].loc);
            ids.splice(idx, 0, multiParent[i].id);
        }

        graph = graph.replace(way.update({ nodes: ids }));

        // remove all single parent nodes that were not reused earlier
        for (i = 0; i < singleParent.length; i++) {
            graph = iD.actions.DeleteNode(singleParent[i].id)(graph);
        }

        return graph;
    };

    action.enabled = function(graph) {
        return true;
    };

    return action;
};
