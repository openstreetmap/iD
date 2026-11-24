import type { coreGraph } from '../core';
import type { Action } from '../core/history';
import type { EntityId, osmNode } from '../osm';
import { osmWay, osmRelation } from '../osm';
import { osmTagSuggestingArea } from '../osm/tags';
import { utilArrayGroupBy, utilArrayUniq, utilCompareIDs } from '../util';


export function actionMerge(ids: EntityId[]): Action {

    function groupEntitiesByGeometry(graph: coreGraph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return Object.assign(
            { point: [], area: [], line: [], relation: [] },
            utilArrayGroupBy(entities, function(entity) { return entity.geometry(graph); })
        ) as {
            point: osmNode[];
            vertex: osmNode[];
            line: osmWay[];
            area: (osmWay | osmRelation)[];
            relation: osmRelation[];
        };
    }


    var action: Action = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        var target = geometries.area[0] || geometries.line[0];
        var points = geometries.point;

        points.forEach(function(point) {
            target = target.mergeTags(point.tags);
            graph = graph.replace(target);

            graph.parentRelations(point).forEach(function(parent) {
                if (parent === target) {
                    // #7983: don't replace the target with itself
                    // instead, drop the member node
                    graph = graph.replace(parent.removeMembersWithID(point.id));
                } else {
                    graph = graph.replace(parent.replaceMember(point, target));
                }
            });

            let targetWay: osmWay;
            if (target instanceof osmRelation) {
                // if the target is a multipolygon: choose a random way as the target for the node
                const targetMember = target.members.find(member => member.type === 'way')!; // a multipolygon area always hat at least one way member
                targetWay = graph.entity<osmWay>(targetMember.id);
            } else {
                targetWay = target;
            };

            var nodes = utilArrayUniq(graph.childNodes(targetWay));
            var removeNode = point;

            if (!point.isNew()) {
                // Try to preserve the original point if it already has
                // an ID in the database.

                var inserted = false;

                var canBeReplaced = function(node: osmNode) {
                    return !(graph.parentWays(node).length > 1 ||
                        graph.parentRelations(node).length);
                };

                var replaceNode = function(node: osmNode) {
                    graph = graph.replace(point.update({ tags: node.tags, loc: node.loc }));
                    targetWay = targetWay.replaceNode(node.id, point.id);
                    graph = graph.replace(targetWay);
                    if (target instanceof osmWay) {
                        target = targetWay;
                    }
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
            var tags = { ...target.tags }; // shallow copy
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
