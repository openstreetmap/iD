iD.actions.Circularize = function(wayId, projection, count) {
    count = count || 12;

    function closestIndex(nodes, loc) {
        return iD.geo.chooseVertex(nodes, projection(loc), projection).index;
    }

    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = _.uniq(graph.childNodes(way)),
            points = nodes.map(function(n) { return projection(n.loc); }),
            centroid = d3.geom.polygon(points).centroid(),
            radius = d3.median(points, function(p) {
                return iD.geo.dist(centroid, p);
            }),
            ids = [],
            sign = d3.geom.polygon(points).area() > 0 ? -1 : 1;

        for (var i = 0; i < count; i++) {
            var node,
                loc = projection.invert([
                    centroid[0] + Math.cos(sign * (i / 12) * Math.PI * 2) * radius,
                    centroid[1] + Math.sin(sign * (i / 12) * Math.PI * 2) * radius]);

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
        way = way.update({nodes: ids});
        graph = graph.replace(way);

        for (i = 0; i < nodes.length; i++) {
            graph.parentWays(nodes[i]).forEach(function(parent) {
                graph = graph.replace(parent.replaceNode(nodes[i].id,
                    ids[closestIndex(graph.childNodes(way), nodes[i].loc)]));
            });

            graph = iD.actions.DeleteNode(nodes[i].id)(graph);
        }

        return graph;
    };

    action.disabled = function(graph) {
        if (!graph.entity(wayId).isClosed())
            return 'not_closed';
    };

    return action;
};
