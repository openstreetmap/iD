import { osmTagSuggestingArea } from '../osm/tags';
import { utilArrayGroupBy, utilArrayUniq, utilCompareIDs } from '../util';


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

            if (!point.isNew()) {
                // Try to preserve the original point if it already has
                // an ID in the database.

                var inserted = false;

                var canBeReplaced = function(node) {
                    return !(graph.parentWays(node).length > 1 ||
                        graph.parentRelations(node).length);
                };

                var replaceNode = function(node) {
                    graph = graph.replace(point.update({ tags: node.tags, loc: node.loc }));
                    target = target.replaceNode(node.id, point.id);
                    graph = graph.replace(target);
                    removeNode = node;
                    inserted = true;
                };

                var i;
                var node;

                // First, try to replace a new child node on the target way.
                for (i = 0; i < nodes.length; i++) {
                    node = nodes[i];
                    if (canBeReplaced(node) && node.isNew()) {
                        replaceNode(node);
                        break;
                    }
                }

                if (!inserted && point.hasInterestingTags()) {
                    // No new child node found, try to find an existing, but
                    // uninteresting child node instead.
                    for (i = 0; i < nodes.length; i++) {
                        node = nodes[i];
                        if (canBeReplaced(node) &&
                            !node.hasInterestingTags()) {
                            replaceNode(node);
                            break;
                        }
                    }

                    if (!inserted) {
                        // Still not inserted, try to find an existing, interesting,
                        // but more recent child node.
                        for (i = 0; i < nodes.length; i++) {
                            node = nodes[i];
                            if (canBeReplaced(node) &&
                                utilCompareIDs(point.id, node.id) < 0) {
                                replaceNode(node);
                                break;
                            }
                        }
                    }

                    // If the point still hasn't been inserted, we give up.
                    // There are more interesting or older nodes on the way.
                }
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
