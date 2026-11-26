import { osmJoinWays } from '../osm/multipolygon';
import { utilArrayGroupBy, utilObjectOmit } from '../util';


export function actionAddMember(relationId, member, memberIndex) {

    return function action(graph) {
        var relation = graph.entity(relationId);

        // There are some special rules for Public Transport v2 routes.
        var isPTv2 = /stop|platform/.test(member.role);

        if (member.type === 'way' && !isPTv2) {
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
    function addWayMember(relation, graph) {
        var groups, item, i, j, k;

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

        // Add the member anywhere, one time. Just push and let `osmJoinWays` decide where to put it.
        groups = utilArrayGroupBy(relation.members, 'type');
        groups.way = groups.way || [];
        groups.way.push(member);

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

                // reorder `members` if necessary
                if (k > 0) {
                    if (j+k >= members.length || item.index !== members[j+k].index) {
                        moveMember(members, item.index, j+k);
                    }
                }

                nodes.splice(0, way.nodes.length - 1);
            }
        }

        // Final pass: skip dead items, remove index properties
        var wayMembers = [];
        for (i = 0; i < members.length; i++) {
            item = members[i];
            if (item.index === -1) continue;

            wayMembers.push(utilObjectOmit(item, ['index']));
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
            var i;
            for (i = 0; i < arr.length; i++) {
                if (arr[i].index === findIndex) {
                    break;
                }
            }

            var item = Object.assign({}, arr[i]);   // shallow copy
            arr[i].index = -1; // mark previous entry as dead
            delete item.index; // inserted items must never be moved again
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
