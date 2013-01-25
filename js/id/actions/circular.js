iD.actions.Circular = function(wayId, map) {

    var action = function(graph) {
        var way = graph.fetch(wayId),
            tags = {}, key, role;

        var points = way.nodes.map(function(n) {
                return map.projection(n.loc);
            }),
            centroid = d3.geom.polygon(points).centroid(),
            radius = d3.median(points, function(p) {
                return iD.geo.dist(centroid, p);
            }),
            circular_nodes = [];

        for (var i = 0; i < 12; i++) {
            circular_nodes.push(iD.Node({ loc: map.projection.invert([
                centroid[0] + Math.cos((i / 12) * Math.PI * 2) * radius,
                centroid[1] + Math.sin((i / 12) * Math.PI * 2) * radius])
            }));
        }

        circular_nodes.push(circular_nodes[0]);

        for (i = 0; i < way.nodes.length; i++) {
            if (graph.parentWays(way.nodes[i]).length > 1) {
                var closest, closest_dist = Infinity, dist;
                for (var j = 0; j < circular_nodes.length; j++) {
                    dist = iD.geo.dist(circular_nodes[j].loc, way.nodes[i].loc);
                    if (dist < closest_dist) {
                        closest_dist = dist;
                        closest = j;
                    }
                }
                circular_nodes.splice(closest, 1, way.nodes[i]);
                if (closest === 0) circular_nodes.splice(circular_nodes.length - 1, 1, way.nodes[i]);
                else if (closest === circular_nodes.length - 1) circular_nodes.splice(0, 1, way.nodes[i]);
            } else {
                graph = graph.remove(way.nodes[i]);
            }
        }

        for (i = 0; i < circular_nodes.length; i++) {
            graph = graph.replace(circular_nodes[i]);
        }

        return graph.replace(way.update({
            nodes: _.pluck(circular_nodes, 'id')
        }));
    };

    action.enabled = function(graph) {
        return true;
    };

    return action;
};
