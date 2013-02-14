iD.actions.Circularize = function(wayId, projection, count) {
    count = count || 12;

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
            nodes = _.uniq(graph.childNodes(way)),
            points = nodes.map(function(n) { return projection(n.loc); }),
            centroid = d3.geom.polygon(points).centroid(),
            radius = d3.median(points, function(p) {
                return iD.geo.dist(centroid, p);
            }),
            ids = [];

        for (var i = 0; i < count; i++) {
            var node,
                loc = projection.invert([
                    centroid[0] + Math.cos((i / 12) * Math.PI * 2) * radius,
                    centroid[1] + Math.sin((i / 12) * Math.PI * 2) * radius]);

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

        ids.push(ids[0]);
        graph = graph.replace(way.update({nodes: ids}));

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
        return graph.entity(wayId).isClosed();
    };

    return action;
};
