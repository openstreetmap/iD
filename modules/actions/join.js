import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay } from './delete_way';
import { osmIsInterestingTag } from '../osm/tags';
import { osmJoinWays } from '../osm/multipolygon';
import { geoPathIntersections } from '../geo';
import { utilArrayGroupBy, utilArrayIntersection } from '../util';


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
        return Object.assign(
            { line: [] },
            utilArrayGroupBy(entities, function(entity) { return entity.geometry(graph); })
        );
    }


    var action = function(graph) {
        var ways = ids.map(graph.entity, graph);
        var survivorID = ways[0].id;

        // if any of the ways are sided (e.g. coastline, cliff, kerb)
        // sort them first so they establish the overall order - #6033
        ways.sort(function(a, b) {
            var aSided = a.isSided();
            var bSided = b.isSided();
            return (aSided && !bSided) ? -1
                : (bSided && !aSided) ? 1
                : 0;
        });

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

        // Finds if the join created a single-member multipolygon,
        // and if so turns it into a basic area instead
        function checkForSimpleMultipolygon() {
            if (!survivor.isClosed()) return;

            var multipolygons = graph.parentMultipolygons(survivor).filter(function(multipolygon) {
                // find multipolygons where the survivor is the only member
                return multipolygon.members.length === 1;
            });

            // skip if this is the single member of multiple multipolygons
            if (multipolygons.length !== 1) return;

            var multipolygon = multipolygons[0];

            for (var key in survivor.tags) {
                if (multipolygon.tags[key] &&
                    // don't collapse if tags cannot be cleanly merged
                    multipolygon.tags[key] !== survivor.tags[key]) return;
            }

            survivor = survivor.mergeTags(multipolygon.tags);
            graph = graph.replace(survivor);
            graph = actionDeleteRelation(multipolygon.id, true /* allow untagged members */)(graph);

            var tags = Object.assign({}, survivor.tags);
            if (survivor.geometry(graph) !== 'area') {
                // ensure the feature persists as an area
                tags.area = 'yes';
            }
            delete tags.type; // remove type=multipolygon
            survivor = survivor.update({ tags: tags });
            graph = graph.replace(survivor);
        }
        checkForSimpleMultipolygon();

        return graph;
    };

    // Returns the number of nodes the resultant way is expected to have
    action.resultingWayNodesLength = function(graph) {
        return ids.reduce(function(count, id) {
            return count + graph.entity(id).nodes.length;
        }, 0) - ids.length - 1;
    };


    action.disabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        if (ids.length < 2 || ids.length !== geometries.line.length) {
            return 'not_eligible';
        }

        var joined = osmJoinWays(ids.map(graph.entity, graph), graph);
        if (joined.length > 1) {
            return 'not_adjacent';
        }

        // Loop through all combinations of path-pairs
        // to check potential intersections between all pairs
        for (var i = 0; i < ids.length - 1; i++) {
            for (var j = i + 1; j < ids.length; j++) {
                var path1 = graph.childNodes(graph.entity(ids[i]))
                    .map(function(e) { return e.loc; });
                var path2 = graph.childNodes(graph.entity(ids[j]))
                    .map(function(e) { return e.loc; });
                var intersections = geoPathIntersections(path1, path2);

                // Check if intersections are just nodes lying on top of
                // each other/the line, as opposed to crossing it
                var common = utilArrayIntersection(
                    joined[0].nodes.map(function(n) { return n.loc.toString(); }),
                    intersections.map(function(n) { return n.toString(); })
                );
                if (common.length !== intersections.length) {
                    return 'paths_intersect';
                }
            }
        }

        var nodeIds = joined[0].nodes.map(function(n) { return n.id; }).slice(1, -1);
        var relation;
        var tags = {};
        var conflicting = false;

        joined[0].forEach(function(way) {
            var parents = graph.parentRelations(way);
            parents.forEach(function(parent) {
                if (parent.isRestriction() && parent.members.some(function(m) { return nodeIds.indexOf(m.id) >= 0; })) {
                    relation = parent;
                }
            });

            for (var k in way.tags) {
                if (!(k in tags)) {
                    tags[k] = way.tags[k];
                } else if (tags[k] && osmIsInterestingTag(k) && tags[k] !== way.tags[k]) {
                    conflicting = true;
                }
            }
        });

        if (relation) {
            return 'restriction';
        }

        if (conflicting) {
            return 'conflicting_tags';
        }
    };


    return action;
}
