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
export function actionReverse(entityID, options) {
    var ignoreKey = /^.*(_|:)?(description|name|note|website|ref|source|comment|watch|attribution)(_|:)?/;
    var numeric = /^([+\-]?)(?=[\d.])/;
    var directionKey = /direction$/;
    var turn_lanes = /^turn:lanes:?/;
    var keyReplacements = [
        [/:right$/, ':left'],
        [/:left$/, ':right'],
        [/:forward$/, ':backward'],
        [/:backward$/, ':forward'],
        [/:right:/, ':left:'],
        [/:left:/, ':right:'],
        [/:forward:/, ':backward:'],
        [/:backward:/, ':forward:']
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

    var compassReplacements = {
        N: 'S',
        NNE: 'SSW',
        NE: 'SW',
        ENE: 'WSW',
        E: 'W',
        ESE: 'WNW',
        SE: 'NW',
        SSE: 'NNW',
        S: 'N',
        SSW: 'NNE',
        SW: 'NE',
        WSW: 'ENE',
        W: 'E',
        WNW: 'ESE',
        NW: 'SE',
        NNW: 'SSE'
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


    function reverseValue(key, value, includeAbsolute) {
        if (ignoreKey.test(key)) return value;

        // Turn lanes are left/right to key (not way) direction - #5674
        if (turn_lanes.test(key)) {
            return value;

        } else if (key === 'incline' && numeric.test(value)) {
            return value.replace(numeric, function(_, sign) { return sign === '-' ? '' : '-'; });

        } else if (options && options.reverseOneway && key === 'oneway') {
            return onewayReplacements[value] || value;

        } else if (includeAbsolute && directionKey.test(key)) {
            if (compassReplacements[value]) return compassReplacements[value];

            var degrees = parseFloat(value);
            if (typeof degrees === 'number' && !isNaN(degrees)) {
                if (degrees < 180) {
                    degrees += 180;
                } else {
                    degrees -= 180;
                }
                return degrees.toString();
            }
        }

        return valueReplacements[value] || value;
    }


    // Reverse the direction of tags attached to the nodes - #3076
    function reverseNodeTags(graph, nodeIDs) {
        for (var i = 0; i < nodeIDs.length; i++) {
            var node = graph.hasEntity(nodeIDs[i]);
            if (!node || !Object.keys(node.tags).length) continue;

            var tags = {};
            for (var key in node.tags) {
                tags[reverseKey(key)] = reverseValue(key, node.tags[key], node.id === entityID);
            }
            graph = graph.replace(node.update({tags: tags}));
        }
        return graph;
    }


    function reverseWay(graph, way) {
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
    }


    var action = function(graph) {
        var entity = graph.entity(entityID);
        if (entity.type === 'way') {
            return reverseWay(graph, entity);
        }
        return reverseNodeTags(graph, [entityID]);
    };

    action.disabled = function(graph) {
        var entity = graph.hasEntity(entityID);
        if (!entity || entity.type === 'way') return false;

        for (var key in entity.tags) {
            var value = entity.tags[key];
            if (reverseKey(key) !== key || reverseValue(key, value, true) !== value) {
                return false;
            }
        }
        return 'nondirectional_node';
    };

    action.entityID = function() {
        return entityID;
    };

    return action;
}
