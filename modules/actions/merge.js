import { osmTagSuggestingArea } from '../osm/tags';
import { utilArrayGroupBy, utilArrayUniq } from '../util';


export function actionMerge(ids) {

    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return Object.assign(
            { point: [], area: [], line: [], relation: [] },
            utilArrayGroupBy(entities, function(entity) { return entity.geometry(graph); })
        );
    }


    var action = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        var target = geometries.area[0] || geometries.line[0];
        var points = geometries.point;

        points.forEach(function(point) {
            target = target.mergeTags(point.tags);
            graph = graph.replace(target);

            graph.parentRelations(point).forEach(function(parent) {
                graph = graph.replace(parent.replaceMember(point, target));
            });

            var nodes = utilArrayUniq(graph.childNodes(target));
            var removeNode = point;

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (graph.parentWays(node).length > 1 ||
                    graph.parentRelations(node).length ||
                    node.hasInterestingTags()) {
                    continue;
                }

                // Found an uninteresting child node on the target way.
                // Move orig point into its place to preserve point's history. #3683
                graph = graph.replace(point.update({ tags: {}, loc: node.loc }));
                target = target.replaceNode(node.id, point.id);
                graph = graph.replace(target);
                removeNode = node;
                break;
            }

            graph = graph.remove(removeNode);
        });

        if (target.tags.area === 'yes') {
            var tags = Object.assign({}, target.tags); // shallow copy
            delete tags.area;
            if (osmTagSuggestingArea(tags)) {
                // remove the `area` tag if area geometry is now implied - #3851
                target = target.update({ tags: tags });
                graph = graph.replace(target);
            }
        }

        return graph;
    };


    action.disabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        if (geometries.point.length === 0 ||
            (geometries.area.length + geometries.line.length) !== 1 ||
            geometries.relation.length !== 0) {
            return 'not_eligible';
        }
    };


    return action;
}
