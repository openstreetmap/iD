import { osmJoinWays } from '../osm/multipolygon';
import { osmWay } from '../osm/way';
import { utilArrayGroupBy, utilObjectOmit } from '../util';


export function actionAddMember(relationId, member, memberIndex, insertPair) {

    return function action(graph) {
        var relation = graph.entity(relationId);

        // There are some special rules for Public Transport v2 routes.
        var isPTv2 = /stop|platform/.test(member.role);

        if ((isNaN(memberIndex) || insertPair) && member.type === 'way' && !isPTv2) {
            // Try to perform sensible inserts based on how the ways join together
            graph = addWayMember(relation, graph);
        } else {
            // see https://wiki.openstreetmap.org/wiki/Public_transport#Service_routes
            // Stops and Platforms for PTv2 should be ordered first.
            // hack: We do not currently have the ability to place them in the exactly correct order.
            if (isPTv2 && isNaN(memberIndex)) {
                memberIndex = 0;
            }

            graph = graph.replace(relation.addMember(member, memberIndex));
        }

        return graph;
    };


    // Add a way member into the relation "wherever it makes sense".
    // In this situation we were not supplied a memberIndex.
    function addWayMember(relation, graph) {
        var groups, tempWay, item, i, j, k;

        // remove PTv2 stops and platforms before doing anything.
        var PTv2members = [];
        var members = [];
        for (i = 0; i < relation.members.length; i++) {
            var m = relation.members[i];
            if (/stop|platform/.test(m.role)) {
                PTv2members.push(m);
            } else {
                members.push(m);
            }
        }
        relation = relation.update({ members: members });


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
            var tempMember = { id: tempWay.id, type: 'way', role: member.role };
            var tempRelation = relation.replaceMember({id: insertPair.originalID}, tempMember, true);
            groups = utilArrayGroupBy(tempRelation.members, 'type');
            groups.way = groups.way || [];

        } else {
            // Add the member anywhere, one time. Just push and let `osmJoinWays` decide where to put it.
            groups = utilArrayGroupBy(relation.members, 'type');
            groups.way = groups.way || [];
            groups.way.push(member);
        }

        members = withIndex(groups.way);
        var joined = osmJoinWays(members, graph);

        // `joined` might not contain all of the way members,
        // But will contain only the completed (downloaded) members
        for (i = 0; i < joined.length; i++) {
            var segment = joined[i];
            var nodes = segment.nodes.slice();
            var startIndex = segment[0].index;

            // j = array index in `members` where this segment starts
            for (j = 0; j < members.length; j++) {
                if (members[j].index === startIndex) {
                    break;
                }
            }

            // k = each member in segment
            for (k = 0; k < segment.length; k++) {
                item = segment[k];
                var way = graph.entity(item.id);

                // If this is a paired item, generate members in correct order and role
                if (tempWay && item.id === tempWay.id) {
                    if (nodes[0].id === insertPair.nodes[0]) {
                        item.pair = [
                            { id: insertPair.originalID, type: 'way', role: item.role },
                            { id: insertPair.insertedID, type: 'way', role: item.role }
                        ];
                    } else {
                        item.pair = [
                            { id: insertPair.insertedID, type: 'way', role: item.role },
                            { id: insertPair.originalID, type: 'way', role: item.role }
                        ];
                    }
                }

                // reorder `members` if necessary
                if (k > 0) {
                    if (j+k >= members.length || item.index !== members[j+k].index) {
                        moveMember(members, item.index, j+k);
                    }
                }

                nodes.splice(0, way.nodes.length - 1);
            }
        }

        if (tempWay) {
            graph = graph.remove(tempWay);
        }

        // Final pass: skip dead items, split pairs, remove index properties
        var wayMembers = [];
        for (i = 0; i < members.length; i++) {
            item = members[i];
            if (item.index === -1) continue;

            if (item.pair) {
                wayMembers.push(item.pair[0]);
                wayMembers.push(item.pair[1]);
            } else {
                wayMembers.push(utilObjectOmit(item, ['index']));
            }
        }

        // Put stops and platforms first, then nodes, ways, relations
        // This is recommended for Public Transport v2 routes:
        // see https://wiki.openstreetmap.org/wiki/Public_transport#Service_routes
        var newMembers = PTv2members.concat( (groups.node || []), wayMembers, (groups.relation || []) );

        return graph.replace(relation.update({ members: newMembers }));


        // `moveMember()` changes the `members` array in place by splicing
        // the item with `.index = findIndex` to where it belongs,
        // and marking the old position as "dead" with `.index = -1`
        //
        // j=5, k=0                jk
        // segment                 5 4 7 6
        // members       0 1 2 3 4 5 6 7 8 9        keep 5 in j+k
        //
        // j=5, k=1                j k
        // segment                 5 4 7 6
        // members       0 1 2 3 4 5 6 7 8 9        move 4 to j+k
        // members       0 1 2 3 x 5 4 6 7 8 9      moved
        //
        // j=5, k=2                j   k
        // segment                 5 4 7 6
        // members       0 1 2 3 x 5 4 6 7 8 9      move 7 to j+k
        // members       0 1 2 3 x 5 4 7 6 x 8 9    moved
        //
        // j=5, k=3                j     k
        // segment                 5 4 7 6
        // members       0 1 2 3 x 5 4 7 6 x 8 9    keep 6 in j+k
        //
        function moveMember(arr, findIndex, toIndex) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].index === findIndex) {
                    break;
                }
            }

            var item = Object.assign({}, arr[i]);   // shallow copy
            arr[i].index = -1;   // mark as dead
            item.index = toIndex;
            arr.splice(toIndex, 0, item);
        }


        // This is the same as `Relation.indexedMembers`,
        // Except we don't want to index all the members, only the ways
        function withIndex(arr) {
            var result = new Array(arr.length);
            for (var i = 0; i < arr.length; i++) {
                result[i] = Object.assign({}, arr[i]);   // shallow copy
                result[i].index = i;
            }
            return result;
        }
    }

}
