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
// If `restriction` is not provided, it is automatically determined by the
// angle of the turn:
//
//    0-23  degrees: no_u_turn
//   23-158 degrees: no_right_turn
//  158-202 degrees: no_straight_on
//  202-326 degrees: no_left_turn
//  336-360 degrees: no_u_turn
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
    var dispatch = d3.dispatch('split');

    function action(graph) {
        var from = graph.entity(turn.from.way),
            via  = graph.entity(turn.via.node),
            to   = graph.entity(turn.to.way);

        if (!from.affix(via.id)) {
            var newFromId = turn.from.newID || iD.Way().id;

            graph = iD.actions.Split(via.id, [newFromId])
                .limitWays([from.id])(graph);

            dispatch.split(from.id, newFromId, graph);

            var newFrom = graph.entity(newFromId);
            if (newFrom.nodes.indexOf(turn.from.node) !== -1)
                from = newFrom;
        }

        if (turn.from.way === turn.to.way) {
            to = from;
        } else if (!to.affix(via.id)) {
            var newToId = turn.to.newID || iD.Way().id;

            graph = iD.actions.Split(via.id, [newToId])
                .limitWays([to.id])(graph);

            dispatch.split(to.id, newToId, graph);

            var newTo = graph.entity(newToId);
            if (newTo.nodes.indexOf(turn.to.node) !== -1)
                to = newTo;
        }

        return graph.replace(iD.Relation({
            id: restrictionId,
            tags: {
                type: 'restriction',
                restriction: turn.restriction ||
                    iD.geo.inferRestriction(
                        graph.entity(turn.from.node),
                        via,
                        graph.entity(turn.to.node),
                        projection)
            },
            members: [
                {id: from.id, type: 'way',  role: 'from'},
                {id: via.id,  type: 'node', role: 'via'},
                {id: to.id,   type: 'way',  role: 'to'}
            ]
        }));
    }

    return d3.rebind(action, dispatch, 'on');
};
