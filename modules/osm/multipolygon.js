import { actionReverse } from '../actions/reverse';
import { osmIsInterestingTag } from './tags';
import { osmWay } from './way';


// "Old" multipolyons, previously known as "simple" multipolygons, are as follows:
//
// 1. Relation tagged with `type=multipolygon` and no interesting tags.
// 2. One and only one member with the `outer` role. Must be a way with interesting tags.
// 3. No members without a role.
//
// Old multipolygons are no longer recommended but are still rendered as areas by iD.

export function osmOldMultipolygonOuterMemberOfRelation(entity, graph) {
    if (entity.type !== 'relation' ||
        !entity.isMultipolygon()
        || Object.keys(entity.tags).filter(osmIsInterestingTag).length > 1) {
        return false;
    }

    var outerMember;
    for (var memberIndex in entity.members) {
        var member = entity.members[memberIndex];
        if (!member.role || member.role === 'outer') {
            if (outerMember) return false;
            if (member.type !== 'way') return false;
            if (!graph.hasEntity(member.id)) return false;

            outerMember = graph.entity(member.id);

            if (Object.keys(outerMember.tags).filter(osmIsInterestingTag).length === 0) {
                return false;
            }
        }
    }

    return outerMember;
}

// For fixing up rendering of multipolygons with tags on the outer member.
// https://github.com/openstreetmap/iD/issues/613
export function osmIsOldMultipolygonOuterMember(entity, graph) {
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


export function osmOldMultipolygonOuterMember(entity, graph) {
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


// Join `toJoin` array into sequences of connecting ways.

// Segments which share identical start/end nodes will, as much as possible,
// be connected with each other.
//
// The return value is a nested array. Each constituent array contains elements
// of `toJoin` which have been determined to connect.
//
// Each consitituent array also has a `nodes` property whose value is an
// ordered array of member nodes, with appropriate order reversal and
// start/end coordinate de-duplication.
//
// Members of `toJoin` must have, at minimum, `type` and `id` properties.
// Thus either an array of `osmWay`s or a relation member array may be used.
//
// If an member is an `osmWay`, its tags and childnodes may be reversed via
// `actionReverse` in the output.
//
// The returned sequences array also has an `actions` array property, containing
// any reversal actions that should be applied to the graph, should the calling
// code attempt to actually join the given ways.
//
// Incomplete members (those for which `graph.hasEntity(element.id)` returns
// false) and non-way members are ignored.
//
export function osmJoinWays(toJoin, graph) {
    function resolve(member) {
        return graph.childNodes(graph.entity(member.id));
    }

    function reverse(item) {
        var action = actionReverse(item.id, { reverseOneway: true });
        sequences.actions.push(action);
        return (item instanceof osmWay) ? action(graph).entity(item.id) : item;
    }

    // make a copy containing only the items to join
    toJoin = toJoin.filter(function(member) {
        return member.type === 'way' && graph.hasEntity(member.id);
    });

    // Are the things we are joining relation members or `osmWays`?
    // If `osmWays`, skip the "prefer a forward path" code below (see #4872)
    var i;
    var joinAsMembers = true;
    for (i = 0; i < toJoin.length; i++) {
        if (toJoin[i] instanceof osmWay) {
            joinAsMembers = false;
            break;
        }
    }

    var sequences = [];
    sequences.actions = [];

    while (toJoin.length) {
        // start a new sequence
        var item = toJoin.shift();
        var currWays = [item];
        var currNodes = resolve(item).slice();
        var doneSequence = false;

        // add to it
        while (toJoin.length && !doneSequence) {
            var start = currNodes[0];
            var end = currNodes[currNodes.length - 1];
            var fn = null;
            var nodes = null;

            // Find the next way/member to join.
            for (i = 0; i < toJoin.length; i++) {
                item = toJoin[i];
                nodes = resolve(item);

                // (for member ordering only, not way ordering - see #4872)
                // Strongly prefer to generate a forward path that preserves the order
                // of the members array. For multipolygons and most relations, member
                // order does not matter - but for routes, it does. (see #4589)
                // If we started this sequence backwards (i.e. next member way attaches to
                // the start node and not the end node), reverse the initial way before continuing.
                if (joinAsMembers && currWays.length === 1 && nodes[0] !== end && nodes[nodes.length - 1] !== end &&
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
                    item = reverse(item);
                    break;
                } else if (nodes[nodes.length - 1] === start) {
                    fn = currNodes.unshift;            // join to beginning
                    nodes = nodes.slice(0, -1);
                    break;
                } else if (nodes[0] === start) {
                    fn = currNodes.unshift;            // join to beginning
                    nodes = nodes.slice(1).reverse();
                    item = reverse(item);
                    break;
                } else {
                    fn = nodes = null;
                }
            }

            if (!nodes) {     // couldn't find a joinable way/member
                doneSequence = true;
                break;
            }

            fn.apply(currWays, [item]);
            fn.apply(currNodes, nodes);

            toJoin.splice(i, 1);
        }

        currWays.nodes = currNodes;
        sequences.push(currWays);
    }

    return sequences;
}
