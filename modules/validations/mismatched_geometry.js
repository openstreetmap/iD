import deepEqual from 'fast-deep-equal';

import { actionAddVertex } from '../actions/add_vertex';
import { actionChangeTags } from '../actions/change_tags';
import { actionMergeNodes } from '../actions/merge_nodes';
import { actionExtract } from '../actions/extract';
import { modeSelect } from '../modes/select';
import { osmJoinWays } from '../osm/multipolygon';
import { osmNodeGeometriesForTags, osmTagSuggestingArea } from '../osm/tags';
import { presetManager } from '../presets';
import { geoHasSelfIntersections, geoSphericalDistance } from '../geo';
import { t } from '../core/localizer';
import { utilTagText } from '../util';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMismatchedGeometry() {
    const type = 'mismatched_geometry';

    function tagSuggestingLineIsArea(entity) {
        if (entity.type !== 'way' || entity.isClosed()) return null;

        const tagSuggestingArea = entity.tagSuggestingArea();

        if (!tagSuggestingArea) {
            return null;
        }

        const asLine = presetManager.matchTags(tagSuggestingArea, 'line');
        const asArea = presetManager.matchTags(tagSuggestingArea, 'area');
        if (asLine && asArea && deepEqual(asLine.tags, asArea.tags)) {
            // this tag also allows lines and making this an area wouldn't matter
            return null;
        }

        if (asLine.isFallback() && asArea.isFallback() && !deepEqual(tagSuggestingArea, { area: 'yes' })) {
            // if the entity matches the fallback preset, regardless of the
            // geometry, then changing the geometry will not help.
            return null;
        }

        return tagSuggestingArea;
    }


    function makeConnectEndpointsFixOnClick(way, graph) {
        // must have at least three nodes to close this automatically
        if (way.nodes.length < 3) return null;

        const nodes = graph.childNodes(way);
        let testNodes;
        const firstToLastDistanceMeters = geoSphericalDistance(nodes[0].loc, nodes[nodes.length-1].loc);

        // if the distance is very small, attempt to merge the endpoints
        if (firstToLastDistanceMeters < 0.75) {
            testNodes = nodes.slice();   // shallow copy
            testNodes.pop();
            testNodes.push(testNodes[0]);
            // make sure this will not create a self-intersection
            if (!geoHasSelfIntersections(testNodes, testNodes[0].id)) {
                return function(context) {
                    const way = context.entity(this.issue.entityIds[0]);
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
                const wayId = this.issue.entityIds[0];
                const way = context.entity(wayId);
                const nodeId = way.nodes[0];
                const index = way.nodes.length;
                context.perform(
                    actionAddVertex(wayId, nodeId, index),
                    t('issues.fix.connect_endpoints.annotation')
                );
            };
        }
    }

    function lineTaggedAsAreaIssue(entity) {

        const tagSuggestingArea = tagSuggestingLineIsArea(entity);
        if (!tagSuggestingArea) return null;

        let validAsLine = false;
        const presetAsLine = presetManager.matchTags(entity.tags, 'line');
        if (presetAsLine) {
            validAsLine = true;
            const key = Object.keys(tagSuggestingArea)[0];
            if (presetAsLine.tags[key] && presetAsLine.tags[key] === '*') {
                // only matches a fallback preset of the tag which is suggesting to be an area
                validAsLine = false;
            }
            if (Object.keys(presetAsLine.tags).length === 0) {
                // only matches the fallback "line" preset
                validAsLine = false;
            }
        }

        return new validationIssue({
            type: type,
            subtype: 'area_as_line',
            severity: 'warning',
            message: function(context) {
                const entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.tag_suggests_area.message', {
                    feature: utilDisplayLabel(entity, 'area', true /* verbose */),
                    tag: utilTagText({ tags: tagSuggestingArea })
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            hash: JSON.stringify(tagSuggestingArea),
            dynamicFixes: function(context) {

                const fixes = [];

                const entity = context.entity(this.entityIds[0]);
                const connectEndsOnClick = makeConnectEndpointsFixOnClick(entity, context.graph());

                if (!validAsLine) {
                    // only suggest to "connect the ends" if the feature is not also valid as a line
                    fixes.push(new validationIssueFix({
                        title: t.append('issues.fix.connect_endpoints.title'),
                        onClick: connectEndsOnClick
                    }));
                }

                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t.append('issues.fix.remove_tag.title'),
                    onClick: function(context) {
                        const entityId = this.issue.entityIds[0];
                        const entity = context.entity(entityId);
                        const tags = Object.assign({}, entity.tags);  // shallow copy
                        for (const key in tagSuggestingArea) {
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
                .call(t.append('issues.tag_suggests_area.reference'));
        }
    }

    function vertexPointIssue(entity, graph) {
        // we only care about nodes
        if (entity.type !== 'node') return null;

        // ignore tagless points
        if (Object.keys(entity.tags).length === 0) return null;

        // address lines are special so just ignore them
        if (entity.isOnAddressLine(graph)) return null;

        const geometry = entity.geometry(graph);
        const allowedGeometries = osmNodeGeometriesForTags(entity.tags);

        if (geometry === 'point' && !allowedGeometries.point && allowedGeometries.vertex) {

            return new validationIssue({
                type: type,
                subtype: 'vertex_as_point',
                severity: 'warning',
                message: function(context) {
                    const entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t.append('issues.vertex_as_point.message', {
                        feature: utilDisplayLabel(entity, 'vertex', true /* verbose */)
                    }) : '';
                },
                reference: function showReference(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .call(t.append('issues.vertex_as_point.reference'));
                },
                entityIds: [entity.id]
            });

        } else if (geometry === 'vertex' && !allowedGeometries.vertex && allowedGeometries.point) {

            return new validationIssue({
                type: type,
                subtype: 'point_as_vertex',
                severity: 'warning',
                message: function(context) {
                    const entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t.append('issues.point_as_vertex.message', {
                        feature: utilDisplayLabel(entity, 'point', true /* verbose */)
                    }) : '';
                },
                reference: function showReference(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .call(t.append('issues.point_as_vertex.reference'));
                },
                entityIds: [entity.id],
                dynamicFixes: extractPointDynamicFixes
            });
        }

        return null;
    }


    function otherMismatchIssue(entity, graph) {
        // ignore boring features
        if (!entity.hasInterestingTags()) return null;

        if (entity.type !== 'node' && entity.type !== 'way') return null;

        // address lines are special so just ignore them
        if (entity.type === 'node' && entity.isOnAddressLine(graph)) return null;

        let sourceGeom = entity.geometry(graph);

        const targetGeoms = entity.type === 'way' ? ['point', 'vertex'] : ['line', 'area'];

        if (sourceGeom === 'area') targetGeoms.unshift('line');

        const asSource = presetManager.match(entity, graph);

        let targetGeom = targetGeoms.find(nodeGeom => {
            const asTarget = presetManager.matchTags(
                entity.tags,
                nodeGeom,
                entity.extent(graph).center(),
            );
            if (!asSource || !asTarget ||
                asSource === asTarget ||
                // sometimes there are two presets with the same tags for different geometries
                deepEqual(asSource.tags, asTarget.tags)) return false;

            if (asTarget.isFallback()) return false;

            const primaryKey = Object.keys(asTarget.tags)[0];

            // special case: buildings-as-points are discouraged by iD, but common in OSM, so ignore them
            if (primaryKey === 'building') return false;

            if (asTarget.tags[primaryKey] === '*') return false;

            return asSource.isFallback() || asSource.tags[primaryKey] === '*';
        });

        if (!targetGeom) return null;

        const subtype = targetGeom + '_as_' + sourceGeom;

        if (targetGeom === 'vertex') targetGeom = 'point';
        if (sourceGeom === 'vertex') sourceGeom = 'point';

        const referenceId = targetGeom + '_as_' + sourceGeom;

        let dynamicFixes;
        if (targetGeom === 'point') {
            dynamicFixes = extractPointDynamicFixes;

        } else if (sourceGeom === 'area' && targetGeom === 'line') {
            dynamicFixes = lineToAreaDynamicFixes;
        }

        return new validationIssue({
            type: type,
            subtype: subtype,
            severity: 'warning',
            message: function(context) {
                const entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.' + referenceId + '.message', {
                    feature: utilDisplayLabel(entity, targetGeom, true /* verbose */)
                }) : '';
            },
            reference: function showReference(selection) {
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .call(t.append('issues.mismatched_geometry.reference'));
            },
            entityIds: [entity.id],
            dynamicFixes: dynamicFixes
        });
    }

    function lineToAreaDynamicFixes(context) {

        let convertOnClick;

        const entityId = this.entityIds[0];
        const entity = context.entity(entityId);
        const tags = Object.assign({}, entity.tags);  // shallow copy
        delete tags.area;
        if (!osmTagSuggestingArea(tags)) {
            // if removing the area tag would make this a line, offer that as a quick fix
            convertOnClick = function(context) {
                const entityId = this.issue.entityIds[0];
                const entity = context.entity(entityId);
                const tags = Object.assign({}, entity.tags);  // shallow copy
                if (tags.area) {
                    delete tags.area;
                }
                context.perform(
                    actionChangeTags(entityId, tags),
                    t('issues.fix.convert_to_line.annotation')
                );
            };
        }

        return [
            new validationIssueFix({
                icon: 'iD-icon-line',
                title: t.append('issues.fix.convert_to_line.title'),
                onClick: convertOnClick
            })
        ];
    }

    function extractPointDynamicFixes(context) {

        const entityId = this.entityIds[0];

        let extractOnClick = null;
        if (!context.hasHiddenConnections(entityId)) {

            extractOnClick = function(context) {
                const entityId = this.issue.entityIds[0];
                const action = actionExtract(entityId, context.projection);
                context.perform(
                    action,
                    t('operations.extract.annotation', { n: 1 })
                );
                // re-enter mode to trigger updates
                context.enter(modeSelect(context, [action.getExtractedNodeID()]));
            };
        }

        return [
            new validationIssueFix({
                icon: 'iD-operation-extract',
                title: t.append('issues.fix.extract_point.title'),
                onClick: extractOnClick
            })
        ];
    }

    function unclosedMultipolygonPartIssues(entity, graph) {

        if (entity.type !== 'relation' ||
            !entity.isMultipolygon() ||
            entity.isDegenerate() ||
            // cannot determine issues for incompletely-downloaded relations
            !entity.isComplete(graph)) return [];

        const sequences = osmJoinWays(entity.members, graph);

        const issues = [];

        for (const i in sequences) {
            const sequence = sequences[i];

            if (!sequence.nodes) continue;

            const firstNode = sequence.nodes[0];
            const lastNode = sequence.nodes[sequence.nodes.length - 1];

            // part is closed if the first and last nodes are the same
            if (firstNode === lastNode) continue;

            const issue = new validationIssue({
                type: type,
                subtype: 'unclosed_multipolygon_part',
                severity: 'warning',
                message: function(context) {
                    const entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t.append('issues.unclosed_multipolygon_part.message', {
                        feature: utilDisplayLabel(entity, context.graph(), true /* verbose */)
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
                .call(t.append('issues.unclosed_multipolygon_part.reference'));
        }
    }

    const validation = function checkMismatchedGeometry(entity, graph) {
        const vertexPoint = vertexPointIssue(entity, graph);
        if (vertexPoint) return [vertexPoint];

        const lineAsArea = lineTaggedAsAreaIssue(entity);
        if (lineAsArea) return [lineAsArea];

        const mismatch = otherMismatchIssue(entity, graph);
        if (mismatch) return [mismatch];

        return unclosedMultipolygonPartIssues(entity, graph);
    };

    validation.type = type;

    return validation;
}
