import { osmRelation } from '../osm';


// `actionRestrictTurn` creates a turn restriction relation.
//
// `turn` must be an `osmTurn` object
// see osm/intersection.js, pathToTurn()
//
// This specifies a restriction of type `restriction` when traveling from
// `turn.from.way` toward `turn.to.way` via `turn.via.node` OR `turn.via.ways`.
// (The action does not check that these entities form a valid intersection.)
//
// From, to, and via ways should be split before calling this action.
// (old versions of the code would split the ways here, but we no longer do it)
//
// For testing convenience, accepts a restrictionID to assign to the new
// relation. Normally, this will be undefined and the relation will
// automatically be assigned a new ID.
//
export function actionRestrictTurn(turn, restrictionType, restrictionID) {

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
                restriction: restrictionType
            },
            members: members
        }));
    };
}
