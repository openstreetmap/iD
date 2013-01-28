iD.behavior.DragMidpoint = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    return iD.behavior.drag()
        .delegate(".midpoint")
        .origin(function(d) {
            return projection(d.loc);
        })
        .on('start', function(d) {
            var w, nds;
            d.node = iD.Node({loc: d.loc});
            var args = [iD.actions.AddNode(d.node)];
            for (var i = 0; i < d.ways.length; i++) {
                w = d.ways[i], nds = w.nodes;
                for (var j = 0; j < nds.length; j++) {
                    if ((nds[j] === d.nodes[0] && nds[j + 1] === d.nodes[1]) ||
                        (nds[j] === d.nodes[1] && nds[j + 1] === d.nodes[0])) {
                        args.push(iD.actions.AddWayNode(w.id, d.node.id, j + 1));
                    }
                }
            }
            history.perform.apply(history, args);
        })
        .on('move', function(d) {
            d3.event.sourceEvent.stopPropagation();
            history.replace(
                iD.actions.MoveNode(d.node.id, projection.invert(d3.event.point)));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'added a node to a way');
        });
};
