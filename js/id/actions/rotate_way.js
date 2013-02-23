iD.actions.RotateWay = function(wayId, ref_points, pivot, mousePoint, projection) {
    return function(graph) {
        return graph.update(function(graph) {
            var way = graph.entity(wayId),
                nodes = _.uniq(graph.childNodes(way)),
                angle, i, points;

            points = deepCopy(ref_points);

            angle = Math.atan2(mousePoint[1] - pivot[1], mousePoint[0] - pivot[0]);

            for (i = 0; i < points.length; i++) {
                var radial = [0,0];

                radial[0] = points[i][0] - pivot[0];
                radial[1] = points[i][1] - pivot[1];

                points[i][0] = radial[0] * Math.cos(angle) - radial[1] * Math.sin(angle) + pivot[0];
                points[i][1] = radial[0] * Math.sin(angle) + radial[1] * Math.cos(angle) + pivot[1];

            }

            for (i = 0; i < points.length; i++) {
                graph = graph.replace(graph.entity(nodes[i].id).move(projection.invert(points[i])));
            }

            function deepCopy(o) {
                var copy = o,k;
                if (o && typeof o === 'object') {
                    copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
                    for (k in o) {
                        copy[k] = deepCopy(o[k]);
                    }
                }
                return copy;
            }
        });
    };
};
