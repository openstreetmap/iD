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

    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            points = nodes.map(function(n) { return projection(n.loc); }),
            best, i, j, ids = [];

        var xys = points.map(function(p) {
                return { x: p[0], y: p[1] };
            }),
            simplified = simplify(xys, 0.7),
            multiNodes = nodes.filter(function(n) {
                return graph.parentWays(n).length > 1;
            });

        for (i = 0; i < simplified.length; i++) {

            var loc = projection.invert([simplified[i].x, simplified[i].y]);

            if (nodes.length) {
                var idx = closestIndex(nodes, loc);
                node = nodes[idx];
                nodes.splice(idx, 1);
            } else {
                node = iD.Node();
            }

            ids.push(node.id);
            graph = graph.replace(node.move(loc));
        }

        for (i = 0; i < nodes.length; i++) {
            graph.parentWays(nodes[i]).forEach(function(parent) {
                graph = graph.replace(parent.replaceNode(nodes[i].id,
                ids[closestIndex(graph.childNodes(way), nodes[i].loc)]));
            });
            graph = iD.actions.DeleteNode(nodes[i].id)(graph);
        }

        return graph;
    };

    action.enabled = function(graph) {
        return true;
    };

    return action;
};
