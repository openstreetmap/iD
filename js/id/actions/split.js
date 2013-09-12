// Split a way at the given node.
//
// Optionally, split only the given ways, if multiple ways share
// the given node.
//
// This is the inverse of `iD.actions.Join`.
//
// For testing convenience, accepts an ID to assign to the new way.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
//
iD.actions.Split = function(nodeId, newWayIds) {
    var wayIds;

    function split(graph, wayA, newWayId) {
        // if the way is closed, we need to search for a partner node
        // to split the way at.
        //
        // The following looks for a node that is both far away from
        // the initial node in terms of way segment length and nearby
        // in terms of beeline-distance. This assures that areas get
        // split on the most "natural" points (independent of the number
        // of nodes).
        // For example: bone-shaped areas get split across their waist
        // line, circles across the diameter.
        var wayB = iD.Way({id: newWayId, tags: wayA.tags}),
            nodesA,
            nodesB,
            isArea = wayA.isArea();

        if (wayA.isClosed()) {
            var nodes = wayA.nodes.slice(0, -1),
                idxA = _.indexOf(nodes, nodeId),
                idxB,
                lengths = Array(nodes.length),
                cum_length,
                i,
                best = 0.0;

            function _wrap(index) {
                return iD.util.wrap(index,nodes.length);
            }
            function _dist(nA, nB) {
                return iD.geo.geoDist(graph.entity(nA).loc, graph.entity(nB).loc);
            }

            // calculate lengths
            cum_length = 0.0;
            for (i = _wrap(idxA+1); i != idxA; i = _wrap(i+1)) {
                cum_length += _dist(nodes[i], nodes[_wrap(i-1)]);
                lengths[i] = cum_length;
            }
            cum_length = 0.0;
            for (i = _wrap(idxA-1); i != idxA; i = _wrap(i-1)) {
                cum_length += _dist(nodes[i], nodes[_wrap(i+1)]);
                if (cum_length < lengths[i])
                    lengths[i] = cum_length;
            }
            // determine best opposite node to split
            for (i = 0; i < nodes.length; i++) {
                var cost = lengths[i] / _dist(nodes[idxA], nodes[i]);
                if (cost > best) {
                    idxB = i;
                    best = cost;
                }
            }

            if (idxB < idxA) {
                nodesA = nodes.slice(idxA).concat(nodes.slice(0, idxB + 1));
                nodesB = nodes.slice(idxB, idxA + 1);
            } else {
                nodesA = nodes.slice(idxA, idxB + 1);
                nodesB = nodes.slice(idxB).concat(nodes.slice(0, idxA + 1));
            }
        } else {
            var idx = _.indexOf(wayA.nodes, nodeId, 1);
            nodesA = wayA.nodes.slice(0, idx + 1);
            nodesB = wayA.nodes.slice(idx);
        }

        wayA = wayA.update({nodes: nodesA});
        wayB = wayB.update({nodes: nodesB});

        graph = graph.replace(wayA);
        graph = graph.replace(wayB);

        graph.parentRelations(wayA).forEach(function(relation) {
            if (relation.isRestriction()) {
                var via = relation.memberByRole('via');
                if (via && wayB.contains(via.id)) {
                    relation = relation.updateMember({id: wayB.id}, relation.memberById(wayA.id).index);
                    graph = graph.replace(relation);
                }
            } else {
                var role = relation.memberById(wayA.id).role,
                    last = wayB.last(),
                    i = relation.memberById(wayA.id).index,
                    j;

                for (j = 0; j < relation.members.length; j++) {
                    var entity = graph.hasEntity(relation.members[j].id);
                    if (entity && entity.type === 'way' && entity.contains(last)) {
                        break;
                    }
                }

                relation = relation.addMember({id: wayB.id, type: 'way', role: role}, i <= j ? i + 1 : i);
                graph = graph.replace(relation);
            }
        });

        if (isArea) {
            var multipolygon = iD.Relation({
                tags: _.extend({}, wayA.tags, {type: 'multipolygon'}),
                members: [
                    {id: wayA.id, role: 'outer', type: 'way'},
                    {id: wayB.id, role: 'outer', type: 'way'}
                ]});

            graph = graph.replace(multipolygon);
            graph = graph.replace(wayA.update({tags: {}}));
            graph = graph.replace(wayB.update({tags: {}}));
        }

        return graph;
    }

    var action = function(graph) {
        var candidates = action.ways(graph);
        for (var i = 0; i < candidates.length; i++) {
            graph = split(graph, candidates[i], newWayIds && newWayIds[i]);
        }
        return graph;
    };

    action.ways = function(graph) {
        var node = graph.entity(nodeId),
            parents = graph.parentWays(node);

        return parents.filter(function(parent) {
            if (wayIds && wayIds.indexOf(parent.id) === -1)
                return false;

            if (parent.isClosed()) {
                return true;
            }

            for (var i = 1; i < parent.nodes.length - 1; i++) {
                if (parent.nodes[i] === nodeId) {
                    return true;
                }
            }

            return false;
        });
    };

    action.disabled = function(graph) {
        var candidates = action.ways(graph);
        if (candidates.length === 0 || (wayIds && wayIds.length !== candidates.length))
            return 'not_eligible';
    };

    action.limitWays = function(_) {
        if (!arguments.length) return wayIds;
        wayIds = _;
        return action;
    };

    return action;
};
