import {
    osmInferRestriction,
    osmRelation
} from '../osm';


// Create a restriction relation for `turn`, which must have the following structure:
//
//     {
//         from: { node: <node ID>, way: <way ID> },
//         via:  { node: <node ID>, ways: [<way ID>,<way ID>,...] },
//         to:   { node: <node ID>, way: <way ID> },
//         restriction: <'no_right_turn', 'no_left_turn', etc.>
//     }
//
// This specifies a restriction of type `restriction` when traveling from
// `from.node` in `from.way` toward `to.node` in `to.way` via `via.node` OR `via.ways`.
// (The action does not check that these entities form a valid intersection.)
//
// If `restriction` is not provided, it is automatically determined by
// osmInferRestriction.
//
// From, to, and via ways should be split before calling this action.
// (old versions of the code would split the ways here, but we no longer do it)
//
// For testing convenience, accepts an ID to assign to the new relation.
// Normally, this will be undefined and the relation will automatically
// be assigned a new ID.
//
export function actionRestrictTurn(turn, projection, restrictionID) {

    return function(graph) {
        var fromWay = graph.entity(turn.from.way);
        var toWay = graph.entity(turn.to.way);
        var viaNode = turn.via.node && graph.entity(turn.via.node);
        var viaWays = turn.via.ways && turn.via.ways.map(function(id) { return graph.entity(id); });
        var members = [];

        members.push({ id: fromWay.id, type: 'way',  role: 'from' });

        if (viaNode) {
            members.push({ id: viaNode.id,  type: 'node', role: 'via' });
        } else if (viaWays) {
            viaWays.forEach(function(viaWay) {
                members.push({ id: viaWay.id,  type: 'way', role: 'via' });
            });
        }

        members.push({ id: toWay.id, type: 'way',  role: 'to' });

        return graph.replace(osmRelation({
            id: restrictionID,
            tags: {
                type: 'restriction',
                restriction: turn.restriction || osmInferRestriction(graph, turn.from, turn.to, projection)
            },
            members: members
        }));
    };
}
