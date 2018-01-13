import { actionReverse } from '../actions/reverse';
import { osmIsInterestingTag } from './tags';
import { osmWay } from './way';


// For fixing up rendering of multipolygons with tags on the outer member.
// https://github.com/openstreetmap/iD/issues/613
export function osmIsSimpleMultipolygonOuterMember(entity, graph) {
    if (entity.type !== 'way' || Object.keys(entity.tags).filter(osmIsInterestingTag).length === 0)
        return false;

    var parents = graph.parentRelations(entity);
    if (parents.length !== 1)
        return false;

    var parent = parents[0];
    if (!parent.isMultipolygon() || Object.keys(parent.tags).filter(osmIsInterestingTag).length > 1)
        return false;

    var members = parent.members, member;
    for (var i = 0; i < members.length; i++) {
        member = members[i];
        if (member.id === entity.id && member.role && member.role !== 'outer')
            return false; // Not outer member
        if (member.id !== entity.id && (!member.role || member.role === 'outer'))
            return false; // Not a simple multipolygon
    }

    return parent;
}


export function osmSimpleMultipolygonOuterMember(entity, graph) {
    if (entity.type !== 'way')
        return false;

    var parents = graph.parentRelations(entity);
    if (parents.length !== 1)
        return false;

    var parent = parents[0];
    if (!parent.isMultipolygon() || Object.keys(parent.tags).filter(osmIsInterestingTag).length > 1)
        return false;

    var members = parent.members, member, outerMember;
    for (var i = 0; i < members.length; i++) {
        member = members[i];
        if (!member.role || member.role === 'outer') {
            if (outerMember)
                return false; // Not a simple multipolygon
            outerMember = member;
        }
    }

    if (!outerMember)
        return false;

    var outerEntity = graph.hasEntity(outerMember.id);
    if (!outerEntity || !Object.keys(outerEntity.tags).filter(osmIsInterestingTag).length)
        return false;

    return outerEntity;
}


// Join `array` into sequences of connecting ways.
//
// Segments which share identical start/end nodes will, as much as possible,
// be connected with each other.
//
// The return value is a nested array. Each constituent array contains elements
// of `array` which have been determined to connect. Each consitituent array
// also has a `nodes` property whose value is an ordered array of member nodes,
// with appropriate order reversal and start/end coordinate de-duplication.
//
// Members of `array` must have, at minimum, `type` and `id` properties.
// Thus either an array of `osmWay`s or a relation member array may be
// used.
//
// If an member has a `tags` property, its tags will be reversed via
// `actionReverse` in the output.
//
// Incomplete members (those for which `graph.hasEntity(element.id)` returns
// false) and non-way members are ignored.
//
export function osmJoinWays(toJoin, graph) {
    function resolve(member) {
        return graph.childNodes(graph.entity(member.id));
    }

    function reverse(which) {
        var action = actionReverse(which.id, { reverseOneway: true });
        sequences.actions.push(action);
        return (which instanceof osmWay) ? action(graph).entity(which.id) : which;
    }


    // make a copy containing only the ways to join
    toJoin = toJoin.filter(function(member) {
        return member.type === 'way' && graph.hasEntity(member.id);
    });

    var sequences = [];
    sequences.actions = [];

    while (toJoin.length) {
        // start a new sequence
        var way = toJoin.shift();
        var currWays = [way];
        var currNodes = resolve(way).slice();
        var doneSequence = false;

        // add to it
        while (toJoin.length && !doneSequence) {
            var start = currNodes[0];
            var end = currNodes[currNodes.length - 1];
            var fn = null;
            var nodes = null;
            var i;

            // find the next way
            for (i = 0; i < toJoin.length; i++) {
                way = toJoin[i];
                nodes = resolve(way);

                // Strongly prefer to generate a forward path that preserves the order
                // of the members array. For multipolygons and most relations, member
                // order does not matter - but for routes, it does. If we started this
                // sequence backwards (i.e. next member way attaches to the start node
                // and not the end node), reverse the initial way before continuing.
                if (currWays.length === 1 && nodes[0] !== end && nodes[nodes.length - 1] !== end &&
                    (nodes[nodes.length - 1] === start || nodes[0] === start)
                ) {
                    currWays[0] = reverse(currWays[0]);
                    currNodes.reverse();
                    start = currNodes[0];
                    end = currNodes[currNodes.length - 1];
                }

                if (nodes[0] === end) {
                    fn = currNodes.push;               // join to end
                    nodes = nodes.slice(1);
                    break;
                } else if (nodes[nodes.length - 1] === end) {
                    fn = currNodes.push;               // join to end
                    nodes = nodes.slice(0, -1).reverse();
                    way = reverse(way);
                    break;
                } else if (nodes[nodes.length - 1] === start) {
                    fn = currNodes.unshift;            // join to beginning
                    nodes = nodes.slice(0, -1);
                    break;
                } else if (nodes[0] === start) {
                    fn = currNodes.unshift;            // join to beginning
                    nodes = nodes.slice(1).reverse();
                    way = reverse(way);
                    break;
                } else {
                    fn = nodes = null;
                }
            }

            if (!nodes) {
                doneSequence = true;     // couldn't find a joinable way
                break;
            }

            fn.apply(currWays, [way]);
            fn.apply(currNodes, nodes);

            toJoin.splice(i, 1);
        }


        currWays.nodes = currNodes;
        sequences.push(currWays);
    }

    return sequences;
}
