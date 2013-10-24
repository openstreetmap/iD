iD.actions.Circularize = function(wayId, projection, maxAngle) {
    maxAngle = (maxAngle || 20) * Math.PI / 180;

    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = _.uniq(graph.childNodes(way)),
            keyNodes = nodes.filter(function(n) { return graph.parentWays(n).length !== 1; }),
            points = nodes.map(function(n) { return projection(n.loc); }),
            keyPoints = keyNodes.map(function(n) { return projection(n.loc); }),
            centroid = d3.geom.polygon(points).centroid(),
            radius = d3.median(points, function(p) { return iD.geo.euclideanDistance(centroid, p); }),
            sign = d3.geom.polygon(points).area() > 0 ? 1 : -1,
            ids;

        // we need atleast two key nodes for the algorithm to work
        if (!keyNodes.length) {
            keyNodes = [nodes[0]];
            keyPoints = [points[0]];
        }

        if (keyNodes.length === 1) {
            var index = nodes.indexOf(keyNodes[0]),
                oppositeIndex = Math.floor((index + nodes.length / 2) % nodes.length);

            keyNodes.push(nodes[oppositeIndex]);
            keyPoints.push(points[oppositeIndex]);
        }

        // key points and nodes are those connected to the ways,
        // they are projected onto the circle, inbetween nodes are moved
        // to constant internals between key nodes, extra inbetween nodes are
        // added if necessary.
        for (var i = 0; i < keyPoints.length; i++) {
            var nextKeyNodeIndex = (i + 1) % keyNodes.length,
                startNodeIndex = nodes.indexOf(keyNodes[i]),
                endNodeIndex = nodes.indexOf(keyNodes[nextKeyNodeIndex]),
                numberNewPoints = -1,
                indexRange = endNodeIndex - startNodeIndex,
                distance, totalAngle, eachAngle, startAngle, endAngle,
                angle, loc, node, j;

            if (indexRange < 0) {
                indexRange += nodes.length;
            }

            // position this key node
            distance = iD.geo.euclideanDistance(centroid, keyPoints[i]);
            keyPoints[i] = [
                centroid[0] + (keyPoints[i][0] - centroid[0]) / distance * radius,
                centroid[1] + (keyPoints[i][1] - centroid[1]) / distance * radius];
            graph = graph.replace(keyNodes[i].move(projection.invert(keyPoints[i])));

            // figure out the between delta angle we want to match to
            startAngle = Math.atan2(keyPoints[i][1] - centroid[1], keyPoints[i][0] - centroid[0]);
            endAngle = Math.atan2(keyPoints[nextKeyNodeIndex][1] - centroid[1], keyPoints[nextKeyNodeIndex][0] - centroid[0]);
            totalAngle = endAngle - startAngle;

            // detects looping around -pi/pi
            if (totalAngle*sign > 0) {
                totalAngle = -sign * (2 * Math.PI - Math.abs(totalAngle));
            }

            do {
                numberNewPoints++;
                eachAngle = totalAngle / (indexRange + numberNewPoints);
            } while (Math.abs(eachAngle) > maxAngle);

            // move existing points
            for (j = 1; j < indexRange; j++) {
                angle = startAngle + j * eachAngle;
                loc = projection.invert([
                    centroid[0] + Math.cos(angle)*radius,
                    centroid[1] + Math.sin(angle)*radius]);

                node = nodes[(j + startNodeIndex) % nodes.length].move(loc);
                graph = graph.replace(node);
            }

            // add new inbetween nodes if necessary
            for (j = 0; j < numberNewPoints; j++) {
                angle = startAngle + (indexRange + j) * eachAngle;
                loc = projection.invert([
                    centroid[0] + Math.cos(angle) * radius,
                    centroid[1] + Math.sin(angle) * radius]);

                node = iD.Node({loc: loc});
                graph = graph.replace(node);

                nodes.splice(endNodeIndex + j, 0, node);
            }
        }

        // update the way to have all the new nodes
        ids = nodes.map(function(n) { return n.id; });
        ids.push(ids[0]);

        way = way.update({nodes: ids});
        graph = graph.replace(way);

        return graph;
    };

    action.disabled = function(graph) {
        if (!graph.entity(wayId).isClosed())
            return 'not_closed';
    };

    return action;
};
