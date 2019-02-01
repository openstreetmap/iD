/*
Order the nodes of a way in reverse order and reverse any direction dependent tags
other than `oneway`. (We assume that correcting a backwards oneway is the primary
reason for reversing a way.)

In addition, numeric-valued `incline` tags are negated.

The JOSM implementation was used as a guide, but transformations that were of unclear benefit
or adjusted tags that don't seem to be used in practice were omitted.

References:
    http://wiki.openstreetmap.org/wiki/Forward_%26_backward,_left_%26_right
    http://wiki.openstreetmap.org/wiki/Key:direction#Steps
    http://wiki.openstreetmap.org/wiki/Key:incline
    http://wiki.openstreetmap.org/wiki/Route#Members
    http://josm.openstreetmap.de/browser/josm/trunk/src/org/openstreetmap/josm/corrector/ReverseWayTagCorrector.java
    http://wiki.openstreetmap.org/wiki/Tag:highway%3Dstop
    http://wiki.openstreetmap.org/wiki/Key:traffic_sign#On_a_way_or_area
*/
export function actionReverse(wayID, options) {
    var ignoreKey = /^.*(_|:)?(description|name|note|website|ref|source|comment|watch|attribution)(_|:)?/;
    var numeric = /^([+\-]?)(?=[\d.])/;
    var keyReplacements = [
        [/:right$/, ':left'],
        [/:left$/, ':right'],
        [/:forward$/, ':backward'],
        [/:backward$/, ':forward']
    ];
    var valueReplacements = {
        left: 'right',
        right: 'left',
        up: 'down',
        down: 'up',
        forward: 'backward',
        backward: 'forward',
        forwards: 'backward',
        backwards: 'forward',
    };
    var roleReplacements = {
        forward: 'backward',
        backward: 'forward',
        forwards: 'backward',
        backwards: 'forward'
    };
    var onewayReplacements = {
        yes: '-1',
        '1': '-1',
        '-1': 'yes'
    };


    function reverseKey(key) {
        for (var i = 0; i < keyReplacements.length; ++i) {
            var replacement = keyReplacements[i];
            if (replacement[0].test(key)) {
                return key.replace(replacement[0], replacement[1]);
            }
        }
        return key;
    }


    function reverseValue(key, value) {
        if (ignoreKey.test(key)) return value;

        if (key === 'incline' && numeric.test(value)) {
            return value.replace(numeric, function(_, sign) { return sign === '-' ? '' : '-'; });
        } else if (options && options.reverseOneway && key === 'oneway') {
            return onewayReplacements[value] || value;
        } else {
            return valueReplacements[value] || value;
        }
    }


    // Reverse the direction of tags attached to the nodes - #3076
    function reverseNodeTags(graph, nodeIDs) {
        for (var i = 0; i < nodeIDs.length; i++) {
            var node = graph.hasEntity(nodeIDs[i]);
            if (!node || !Object.keys(node.tags).length) continue;

            var tags = {};
            for (var key in node.tags) {
                tags[reverseKey(key)] = reverseValue(key, node.tags[key]);
            }
            graph = graph.replace(node.update({tags: tags}));
        }
        return graph;
    }


    return function(graph) {
        var way = graph.entity(wayID);
        var nodes = way.nodes.slice().reverse();
        var tags = {};
        var role;

        for (var key in way.tags) {
            tags[reverseKey(key)] = reverseValue(key, way.tags[key]);
        }

        graph.parentRelations(way).forEach(function(relation) {
            relation.members.forEach(function(member, index) {
                if (member.id === way.id && (role = roleReplacements[member.role])) {
                    relation = relation.updateMember({role: role}, index);
                    graph = graph.replace(relation);
                }
            });
        });

        // Reverse any associated directions on nodes on the way and then replace
        // the way itself with the reversed node ids and updated way tags
        return reverseNodeTags(graph, nodes)
            .replace(way.update({nodes: nodes, tags: tags}));
    };
}
