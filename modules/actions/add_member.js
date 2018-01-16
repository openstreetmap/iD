import _groupBy from 'lodash-es/groupBy';

import { osmJoinWays, osmWay } from '../osm';


export function actionAddMember(relationId, member, memberIndex, insertPair) {

    // Relation.replaceMember() removes duplicates, and we don't want that.. #4696
    function replaceMemberAll(relation, needleID, replacement) {
        var members = [];
        for (var i = 0; i < relation.members.length; i++) {
            var member = relation.members[i];
            if (member.id !== needleID) {
                members.push(member);
            } else {
                members.push({id: replacement.id, type: replacement.type, role: member.role});
            }
        }
        return relation.update({members: members});
    }


    var action = function(graph) {
        var relation = graph.entity(relationId);

        if ((isNaN(memberIndex) || insertPair) && member.type === 'way') {
            // Try to perform sensible inserts based on how the ways join together
            graph = addWayMember(relation, graph);
        } else {
            graph = graph.replace(relation.addMember(member, memberIndex));
        }

        return graph;
    };


    // Add a way member into the relation "wherever it makes sense".
    // In this situation we were not supplied a memberIndex.
    function addWayMember(relation, graph) {
        var groups;
        var tempWay;
        var i, j;

        if (insertPair) {
            // We're adding a member that must stay paired with an existing member.
            // (This feature is used by `actionSplit`)
            //
            // This is tricky because the members may exist multiple times in the
            // member list, and with different A-B/B-A ordering and different roles.
            // (e.g. a bus route that loops out and back - #4589).
            //
            // Replace the existing member with a temporary way,
            // so that `osmJoinWays` can treat the pair like a single way.
            tempWay = osmWay({ id: 'wTemp', nodes: insertPair.nodes });
            graph = graph.replace(tempWay);
            var tempMember = { id: tempWay.id, type: 'way', role: '' };
            var tempRelation = replaceMemberAll(relation, insertPair.originalID, tempMember);
            groups = _groupBy(tempRelation.members, function(m) { return m.type; });
            groups.way = groups.way || [];

        } else {
            // Add the member anywhere.. Just push and let `osmJoinWays` decide where to put it.
            groups = _groupBy(relation.members, function(m) { return m.type; });
            groups.way = groups.way || [];
            groups.way.push(member);
        }

        var joined = osmJoinWays(groups.way, graph);

        var newWayMembers = [];
        for (i = 0; i < joined.length; i++) {
            var segment = joined[i];
            var nodes = segment.nodes.slice();

            for (j = 0; j < segment.length; j++) {
                var way = graph.entity(segment[j].id);
                if (tempWay && segment[j].id === tempWay.id) {
                    if (nodes[0].id === insertPair.nodes[0]) {
                        newWayMembers.push({ id: insertPair.originalID, type: 'way', role: segment[j].role });
                        newWayMembers.push({ id: insertPair.insertedID, type: 'way', role: segment[j].role });
                    } else {
                        newWayMembers.push({ id: insertPair.insertedID, type: 'way', role: segment[j].role });
                        newWayMembers.push({ id: insertPair.originalID, type: 'way', role: segment[j].role });
                    }
                } else {
                    newWayMembers.push(segment[j]);
                }
                nodes.splice(0, way.nodes.length - 1);
            }
        }

        if (tempWay) {
            graph = graph.remove(tempWay);
        }

        // Write members in the order: nodes, ways, relations
        // This is reccomended for Public Transport routes:
        // see https://wiki.openstreetmap.org/wiki/Public_transport#Service_routes
        var newMembers = (groups.node || []).concat(newWayMembers, (groups.relation || []));
        return graph.replace(relation.update({members: newMembers}));
    }


    return action;
}
