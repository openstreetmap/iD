import _transform from 'lodash-es/transform';


/*
  Order the nodes of a way in reverse order and reverse any direction dependent tags
  other than `oneway`. (We assume that correcting a backwards oneway is the primary
  reason for reversing a way.)

  The following transforms are performed:

    Keys:
          *:right=* ⟺ *:left=*
        *:forward=* ⟺ *:backward=*
       direction=up ⟺ direction=down
         incline=up ⟺ incline=down
            *=right ⟺ *=left

    Relation members:
       role=forward ⟺ role=backward
         role=north ⟺ role=south
          role=east ⟺ role=west

   In addition, numeric-valued `incline` tags are negated.

   The JOSM implementation was used as a guide, but transformations that were of unclear benefit
   or adjusted tags that don't seem to be used in practice were omitted.

   Also, each node on the way is examined for its own tags and the following transformations are performed
   in order to ensure associated nodes (eg a Stop Sign) is also reversed

    Node Keys:
        *direction=forward ⟺ *direction=backward
        *direction=left ⟺ *direction=right
        *:forward=* ⟺ *:backward=*
        *:left=* ⟺ *:right=*

   References:
      http://wiki.openstreetmap.org/wiki/Forward_%26_backward,_left_%26_right
      http://wiki.openstreetmap.org/wiki/Key:direction#Steps
      http://wiki.openstreetmap.org/wiki/Key:incline
      http://wiki.openstreetmap.org/wiki/Route#Members
      http://josm.openstreetmap.de/browser/josm/trunk/src/org/openstreetmap/josm/corrector/ReverseWayTagCorrector.java
      http://wiki.openstreetmap.org/wiki/Tag:highway%3Dstop
      http://wiki.openstreetmap.org/wiki/Key:traffic_sign#On_a_way_or_area
 */
export function actionReverse(wayId, options) {
    var replacements = [
            [/:right$/, ':left'], [/:left$/, ':right'],
            [/:forward$/, ':backward'], [/:backward$/, ':forward']
        ],
        numeric = /^([+\-]?)(?=[\d.])/,
        roleReversals = {
            forward: 'backward',
            backward: 'forward',
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east'
        };


    function reverseKey(key) {
        for (var i = 0; i < replacements.length; ++i) {
            var replacement = replacements[i];
            if (replacement[0].test(key)) {
                return key.replace(replacement[0], replacement[1]);
            }
        }
        return key;
    }


    function reverseValue(key, value) {
        if (key === 'incline' && numeric.test(value)) {
            return value.replace(numeric, function(_, sign) { return sign === '-' ? '' : '-'; });
        } else if (key === 'incline' || key === 'direction') {
            return {up: 'down', down: 'up'}[value] || value;
        } else if (options && options.reverseOneway && key === 'oneway') {
            return {yes: '-1', '1': '-1', '-1': 'yes'}[value] || value;
        } else {
            return {left: 'right', right: 'left'}[value] || value;
        }
    }


    function reverseDirectionTags(node) {
        // Update the direction based tags as appropriate then return an updated node
        return node.update({tags: _transform(node.tags, function(acc, tagValue, tagKey) {
            // See if this is a direction tag and reverse (or use existing value if not recognised)
            var re = /direction$/;
            if (re.test(tagKey)) {
                acc[tagKey] = {forward: 'backward', backward: 'forward', left: 'right', right: 'left'}[tagValue] || tagValue;
            } else {
                // Use the reverseKey method to cater for situations such as traffic_sign:forward=stop
                // This will pass through other tags unchanged
                acc[reverseKey(tagKey)] = tagValue;
            }
            return acc;
        }, {})});
    }


    function reverseTagsOnNodes(graph, nodeIds) {
        // Reverse the direction of appropriate tags attached to the nodes (#3076)
        return nodeIds
            // Get each node from the graph
            .map(function(nodeId) { return graph.entity(nodeId);})
            // Check tags on the node, if there aren't any, we can skip
            .filter(function(existingNode) { return existingNode.tags !== undefined;})
            // Get a new version of each node with the appropriate tags reversed
            .map(function(existingNode) { return reverseDirectionTags(existingNode);})
            // Chain together consecutive updates to the graph for each updated node and return
            .reduce(function (accGraph, value) { return accGraph.replace(value); }, graph);
    }


    return function(graph) {
        var way = graph.entity(wayId),
            nodes = way.nodes.slice().reverse(),
            tags = {}, key, role;

        for (key in way.tags) {
            tags[reverseKey(key)] = reverseValue(key, way.tags[key]);
        }

        graph.parentRelations(way).forEach(function(relation) {
            relation.members.forEach(function(member, index) {
                if (member.id === way.id && (role = roleReversals[member.role])) {
                    relation = relation.updateMember({role: role}, index);
                    graph = graph.replace(relation);
                }
            });
        });

        // Reverse any associated directions on nodes on the way and then replace
        // the way itself with the reversed node ids and updated way tags
        return reverseTagsOnNodes(graph, nodes).replace(way.update({nodes: nodes, tags: tags}));
    };
}
