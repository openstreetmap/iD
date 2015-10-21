// Create a restriction relation for `turn`, which must have the following structure:
//
//     {
//         from: { node: <node ID>, way: <way ID> },
//         via:  { node: <node ID> },
//         to:   { node: <node ID>, way: <way ID> },
//         restriction: <'no_right_turn', 'no_left_turn', etc.>
//     }
//
// This specifies a restriction of type `restriction` when traveling from
// `from.node` in `from.way` toward `to.node` in `to.way` via `via.node`.
// (The action does not check that these entities form a valid intersection.)
//
// If `restriction` is not provided, it is automatically determined by
// iD.geo.inferRestriction.
//
// If necessary, the `from` and `to` ways are split. In these cases, `from.node`
// and `to.node` are used to determine which portion of the split ways become
// members of the restriction.
//
// For testing convenience, accepts an ID to assign to the new relation.
// Normally, this will be undefined and the relation will automatically
// be assigned a new ID.
//
iD.actions.RestrictTurn = function(turn, projection, restrictionId) {
    return function(graph) {
        var from = graph.entity(turn.from.way),
            via  = graph.entity(turn.via.node),
            to   = graph.entity(turn.to.way);

        function isClosingNode(way, nodeId) {
            return nodeId === way.first() && nodeId === way.last();
        }

        function split(toOrFrom) {
            var newID = toOrFrom.newID || iD.Way().id;
            graph = iD.actions.Split(via.id, [newID])
                .limitWays([toOrFrom.way])(graph);

            var a = graph.entity(newID),
                b = graph.entity(toOrFrom.way);

            if (a.nodes.indexOf(toOrFrom.node) !== -1) {
                return [a, b];
            } else {
                return [b, a];
            }
        }

        if (!from.affix(via.id) || isClosingNode(from, via.id)) {
            if (turn.from.node === turn.to.node) {
                // U-turn
                from = to = split(turn.from)[0];
            } else if (turn.from.way === turn.to.way) {
                // Straight-on or circular
                var s = split(turn.from);
                from = s[0];
                to   = s[1];
            } else {
                // Other
                from = split(turn.from)[0];
            }
        }

        if (!to.affix(via.id) || isClosingNode(to, via.id)) {
            to = split(turn.to)[0];
        }

        return graph.replace(iD.Relation({
            id: restrictionId,
            tags: {
                type: 'restriction',
                restriction: turn.restriction ||
                    iD.geo.inferRestriction(
                        graph,
                        turn.from,
                        turn.via,
                        turn.to,
                        projection)
            },
            members: [
                {id: from.id, type: 'way',  role: 'from'},
                {id: via.id,  type: 'node', role: 'via'},
                {id: to.id,   type: 'way',  role: 'to'}
            ]
        }));
    };
};
