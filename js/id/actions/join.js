// Join ways at the end node they share.
//
// This is the inverse of `iD.actions.Split`.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeWaysAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/CombineWayAction.java
//
iD.actions.Join = function(ids) {

    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return _.extend({line: []}, _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
    }

    var action = function(graph) {
        var ways = ids.map(graph.entity, graph),
            survivor = ways[0];

        // Prefer to keep an existing way.
        for (var i = 0; i < ways.length; i++) {
            if (!ways[i].isNew()) {
                survivor = ways[i];
                break;
            }
        }

        var joined = iD.geo.joinWays(ways, graph)[0];

        survivor = survivor.update({nodes: _.pluck(joined.nodes, 'id')});
        graph = graph.replace(survivor);

        joined.forEach(function(way) {
            if (way.id === survivor.id)
                return;

            graph.parentRelations(way).forEach(function(parent) {
                graph = graph.replace(parent.replaceMember(way, survivor));
            });

            survivor = survivor.mergeTags(way.tags);

            graph = graph.replace(survivor);
            graph = iD.actions.DeleteWay(way.id)(graph);
        });

        return graph;
    };

    action.disabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        if (ids.length < 2 || ids.length !== geometries.line.length)
            return 'not_eligible';

        var joined = iD.geo.joinWays(ids.map(graph.entity, graph), graph);
        if (joined.length > 1)
            return 'not_adjacent';

        var nodeIds = _.pluck(joined[0].nodes, 'id').slice(1, -1),
            relation,
            tags = {},
            conflicting = false;

        joined[0].forEach(function(way) {
            var parents = graph.parentRelations(way);
            parents.forEach(function(parent) {
                if (parent.isRestriction() && parent.members.some(function(m) { return nodeIds.indexOf(m.id) >= 0; }))
                    relation = parent;
            });

            for (var k in way.tags) {
                if (!(k in tags)) {
                    tags[k] = way.tags[k];
                } else if (tags[k] && iD.interestingTag(k) && tags[k] !== way.tags[k]) {
                    conflicting = true;
                }
            }
        });

        if (relation)
            return 'restriction';

        if (conflicting)
            return 'conflicting_tags';
    };

    return action;
};
