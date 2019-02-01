import _extend from 'lodash-es/extend';
import _groupBy from 'lodash-es/groupBy';

import { actionDeleteWay } from './delete_way';
import { osmIsInterestingTag, osmJoinWays } from '../osm';


// Join ways at the end node they share.
//
// This is the inverse of `iD.actionSplit`.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeWaysAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/CombineWayAction.java
//
export function actionJoin(ids) {

    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return _extend({line: []}, _groupBy(entities, function(entity) { return entity.geometry(graph); }));
    }


    var action = function(graph) {
        var ways = ids.map(graph.entity, graph);
        var survivorID = ways[0].id;

        // Prefer to keep an existing way.
        for (var i = 0; i < ways.length; i++) {
            if (!ways[i].isNew()) {
                survivorID = ways[i].id;
                break;
            }
        }

        var sequences = osmJoinWays(ways, graph);
        var joined = sequences[0];

        // We might need to reverse some of these ways before joining them.  #4688
        // `joined.actions` property will contain any actions we need to apply.
        graph = sequences.actions.reduce(function(g, action) { return action(g); }, graph);

        var survivor = graph.entity(survivorID);
        survivor = survivor.update({ nodes: joined.nodes.map(function(n) { return n.id; }) });
        graph = graph.replace(survivor);

        joined.forEach(function(way) {
            if (way.id === survivorID) return;

            graph.parentRelations(way).forEach(function(parent) {
                graph = graph.replace(parent.replaceMember(way, survivor));
            });

            survivor = survivor.mergeTags(way.tags);

            graph = graph.replace(survivor);
            graph = actionDeleteWay(way.id)(graph);
        });

        return graph;
    };


    action.disabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        if (ids.length < 2 || ids.length !== geometries.line.length)
            return 'not_eligible';

        var joined = osmJoinWays(ids.map(graph.entity, graph), graph);
        if (joined.length > 1)
            return 'not_adjacent';

        var nodeIds = joined[0].nodes.map(function(n) { return n.id; }).slice(1, -1);
        var relation;
        var tags = {};
        var conflicting = false;

        joined[0].forEach(function(way) {
            var parents = graph.parentRelations(way);
            parents.forEach(function(parent) {
                if (parent.isRestriction() && parent.members.some(function(m) { return nodeIds.indexOf(m.id) >= 0; }))
                    relation = parent;
            });

            for (var k in way.tags) {
                if (!(k in tags)) {
                    tags[k] = way.tags[k];
                } else if (tags[k] && osmIsInterestingTag(k) && tags[k] !== way.tags[k]) {
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
}
