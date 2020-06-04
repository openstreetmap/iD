import { actionAddVertex } from '../actions/add_vertex';
import { actionChangeTags } from '../actions/change_tags';
import { actionMergeNodes } from '../actions/merge_nodes';
import { actionExtract } from '../actions/extract';
import { modeSelect } from '../modes/select';
import { osmJoinWays } from '../osm/multipolygon';
import { osmNodeGeometriesForTags } from '../osm/tags';
import { presetManager } from '../presets';
import { geoHasSelfIntersections, geoSphericalDistance } from '../geo';
import { t } from '../core/localizer';
import { utilDisplayLabel, utilTagText } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMismatchedGeometry() {
    var type = 'mismatched_geometry';

    function tagSuggestingLineIsArea(entity) {
        if (entity.type !== 'way' || entity.isClosed()) return null;

        var tagSuggestingArea = entity.tagSuggestingArea();
        if (!tagSuggestingArea) {
            return null;
        }

        var asLine = presetManager.matchTags(tagSuggestingArea, 'line');
        var asArea = presetManager.matchTags(tagSuggestingArea, 'area');
        if (asLine && asArea && (asLine === asArea)) {
            // these tags also allow lines and making this an area wouldn't matter
            return null;
        }

        return tagSuggestingArea;
    }


    function makeConnectEndpointsFixOnClick(way, graph) {
        // must have at least three nodes to close this automatically
        if (way.nodes.length < 3) return null;

        var nodes = graph.childNodes(way), testNodes;
        var firstToLastDistanceMeters = geoSphericalDistance(nodes[0].loc, nodes[nodes.length-1].loc);

        // if the distance is very small, attempt to merge the endpoints
        if (firstToLastDistanceMeters < 0.75) {
            testNodes = nodes.slice();   // shallow copy
            testNodes.pop();
            testNodes.push(testNodes[0]);
            // make sure this will not create a self-intersection
            if (!geoHasSelfIntersections(testNodes, testNodes[0].id)) {
                return function(context) {
                    var way = context.entity(this.issue.entityIds[0]);
                    context.perform(
                        actionMergeNodes([way.nodes[0], way.nodes[way.nodes.length-1]], nodes[0].loc),
                        t('issues.fix.connect_endpoints.annotation')
                    );
                };
            }
        }

        // if the points were not merged, attempt to close the way
        testNodes = nodes.slice();   // shallow copy
        testNodes.push(testNodes[0]);
        // make sure this will not create a self-intersection
        if (!geoHasSelfIntersections(testNodes, testNodes[0].id)) {
            return function(context) {
                var wayId = this.issue.entityIds[0];
                var way = context.entity(wayId);
                var nodeId = way.nodes[0];
                var index = way.nodes.length;
                context.perform(
                    actionAddVertex(wayId, nodeId, index),
                    t('issues.fix.connect_endpoints.annotation')
                );
            };
        }
    }

    function lineTaggedAsAreaIssue(entity) {

        var tagSuggestingArea = tagSuggestingLineIsArea(entity);
        if (!tagSuggestingArea) return null;

        return new validationIssue({
            type: type,
            subtype: 'area_as_line',
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t('issues.tag_suggests_area.message', {
                    feature: utilDisplayLabel(entity, context.graph()),
                    tag: utilTagText({ tags: tagSuggestingArea })
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            hash: JSON.stringify(tagSuggestingArea),
            dynamicFixes: function(context) {

                var fixes = [];

                var entity = context.entity(this.entityIds[0]);
                var connectEndsOnClick = makeConnectEndpointsFixOnClick(entity, context.graph());

                fixes.push(new validationIssueFix({
                    title: t('issues.fix.connect_endpoints.title'),
                    onClick: connectEndsOnClick
                }));

                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.remove_tag.title'),
                    onClick: function(context) {
                        var entityId = this.issue.entityIds[0];
                        var entity = context.entity(entityId);
                        var tags = Object.assign({}, entity.tags);  // shallow copy
                        for (var key in tagSuggestingArea) {
                            delete tags[key];
                        }
                        context.perform(
                            actionChangeTags(entityId, tags),
                            t('issues.fix.remove_tag.annotation')
                        );
                    }
                }));

                return fixes;
            }
        });


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.tag_suggests_area.reference'));
        }
    }

    function vertexTaggedAsPointIssue(entity, graph) {
        // we only care about nodes
        if (entity.type !== 'node') return null;

        // ignore tagless points
        if (Object.keys(entity.tags).length === 0) return null;

        // address lines are special so just ignore them
        if (entity.isOnAddressLine(graph)) return null;

        var geometry = entity.geometry(graph);
        var allowedGeometries = osmNodeGeometriesForTags(entity.tags);

        if (geometry === 'point' && !allowedGeometries.point && allowedGeometries.vertex) {

            return new validationIssue({
                type: type,
                subtype: 'vertex_as_point',
                severity: 'warning',
                message: function(context) {
                    var entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t('issues.vertex_as_point.message', {
                        feature: utilDisplayLabel(entity, context.graph())
                    }) : '';
                },
                reference: function showReference(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .text(t('issues.vertex_as_point.reference'));
                },
                entityIds: [entity.id]
            });

        } else if (geometry === 'vertex' && !allowedGeometries.vertex && allowedGeometries.point) {

            return new validationIssue({
                type: type,
                subtype: 'point_as_vertex',
                severity: 'warning',
                message: function(context) {
                    var entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t('issues.point_as_vertex.message', {
                        feature: utilDisplayLabel(entity, context.graph())
                    }) : '';
                },
                reference: function showReference(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .text(t('issues.point_as_vertex.reference'));
                },
                entityIds: [entity.id],
                dynamicFixes: function(context) {

                    var entityId = this.entityIds[0];

                    var extractOnClick = null;
                    if (!context.hasHiddenConnections(entityId)) {

                        extractOnClick = function(context) {
                            var entityId = this.issue.entityIds[0];
                            var action = actionExtract(entityId);
                            context.perform(
                                action,
                                t('operations.extract.annotation.single')
                            );
                            // re-enter mode to trigger updates
                            context.enter(modeSelect(context, [action.getExtractedNodeID()]));
                        };
                    }

                    return [
                        new validationIssueFix({
                            icon: 'iD-operation-extract',
                            title: t('issues.fix.extract_point.title'),
                            onClick: extractOnClick
                        })
                    ];
                }
            });
        }

        return null;
    }

    function unclosedMultipolygonPartIssues(entity, graph) {

        if (entity.type !== 'relation' ||
            !entity.isMultipolygon() ||
            entity.isDegenerate() ||
            // cannot determine issues for incompletely-downloaded relations
            !entity.isComplete(graph)) return null;

        var sequences = osmJoinWays(entity.members, graph);

        var issues = [];

        for (var i in sequences) {
            var sequence = sequences[i];

            if (!sequence.nodes) continue;

            var firstNode = sequence.nodes[0];
            var lastNode = sequence.nodes[sequence.nodes.length - 1];

            // part is closed if the first and last nodes are the same
            if (firstNode === lastNode) continue;

            var issue = new validationIssue({
                type: type,
                subtype: 'unclosed_multipolygon_part',
                severity: 'warning',
                message: function(context) {
                    var entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t('issues.unclosed_multipolygon_part.message', {
                        feature: utilDisplayLabel(entity, context.graph())
                    }) : '';
                },
                reference: showReference,
                loc: sequence.nodes[0].loc,
                entityIds: [entity.id],
                hash: sequence.map(function(way) {
                    return way.id;
                }).join()
            });
            issues.push(issue);
        }

        return issues;

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.unclosed_multipolygon_part.reference'));
        }
    }

    var validation = function checkMismatchedGeometry(entity, graph) {
        var issues = [
            vertexTaggedAsPointIssue(entity, graph),
            lineTaggedAsAreaIssue(entity)
        ];
        issues = issues.concat(unclosedMultipolygonPartIssues(entity, graph));
        return issues.filter(Boolean);
    };

    validation.type = type;

    return validation;
}
