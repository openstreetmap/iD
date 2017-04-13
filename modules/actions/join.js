import _ from 'lodash';
import { actionDeleteWay } from './delete_way';
import { osmIsInterestingTag, osmJoinWays } from '../osm/index';


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

        var joined = osmJoinWays(ways, graph)[0];

        survivor = survivor.update({nodes: _.map(joined.nodes, 'id')});
        graph = graph.replace(survivor);

        joined.forEach(function(way) {
            if (way.id === survivor.id)
                return;

            graph.parentRelations(way).forEach(function(parent) {
                graph = graph.replace(parent.replaceMember(way, survivor));
            });
            window.ifNotMap(way.tags);
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

        var nodeIds = _.map(joined[0].nodes, 'id').slice(1, -1),
            relation,
            tags = new Map(),
            conflicting = false;

        joined[0].forEach(function(way) {
            var parents = graph.parentRelations(way);
            parents.forEach(function(parent) {
                if (parent.isRestriction() && parent.members.some(function(m) { return nodeIds.indexOf(m.id) >= 0; }))
                    relation = parent;
            });
            window.ifNotMap(way.tags);
            way.tags.forEach(function (v, k) {
                if (!(tags.has(k))) {
                    tags.set(k, way.tags.get(k));
                } else if (tags.get(k) && osmIsInterestingTag(k) && tags.get(k) !== way.tags.get(k)) {
                    conflicting = true;
                }
            });
        });

        if (relation)
            return 'restriction';

        if (conflicting)
            return 'conflicting_tags';
    };


    return action;
}
