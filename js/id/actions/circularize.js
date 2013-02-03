iD.actions.Circularize = function(wayId, projection) {

    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = _.uniq(graph.childNodes(way));

        var points = nodes.map(function(n) {
                return projection(n.loc);
            }),
            centroid = d3.geom.polygon(points).centroid(),
            radius = d3.median(points, function(p) {
                return iD.geo.dist(centroid, p);
            }),
            circular_nodes = [];

        for (var i = 0; i < 12; i++) {
            circular_nodes.push(iD.Node({ loc: projection.invert([
                centroid[0] + Math.cos((i / 12) * Math.PI * 2) * radius,
                centroid[1] + Math.sin((i / 12) * Math.PI * 2) * radius])
            }));
        }

        for (i = 0; i < nodes.length; i++) {
            if (graph.parentWays(nodes[i]).length > 1) {
                var closest, closest_dist = Infinity, dist;
                for (var j = 0; j < circular_nodes.length; j++) {
                    dist = iD.geo.dist(circular_nodes[j].loc, nodes[i].loc);
                    if (dist < closest_dist) {
                        closest_dist = dist;
                        closest = j;
                    }
                }
                circular_nodes.splice(closest, 1, nodes[i]);
            }
        }

        for (i = 0; i < circular_nodes.length; i++) {
            graph = graph.replace(circular_nodes[i]);
        }

        var ids = _.pluck(circular_nodes, 'id'),
            difference = _.difference(_.uniq(way.nodes), ids);

        ids.push(ids[0]);

        graph = graph.replace(way.update({nodes: ids}));

        for (i = 0; i < difference.length; i++) {
            graph = iD.actions.DeleteNode(difference[i])(graph);
        }

        return graph;
    };

    action.enabled = function(graph) {
        return graph.entity(wayId).isClosed();
    };

    return action;
};
