import { actionMergeNodes } from '../actions/merge_nodes';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { t } from '../core/localizer';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmPathHighwayTagValues } from '../osm/tags';
import { geoMetersToLat, geoMetersToLon, geoSphericalDistance } from '../geo/geo';
import { geoExtent } from '../geo/extent';

export function validationCloseNodes(context) {
    const type = 'close_nodes';

    const pointThresholdMeters = 0.2;

    const validation = function(entity, graph) {
        if (entity.type === 'node') {
            return getIssuesForNode(entity);
        } else if (entity.type === 'way') {
            return getIssuesForWay(entity);
        }
        return [];

        function getIssuesForNode(node) {
            const parentWays = graph.parentWays(node);
            if (parentWays.length) {
                return getIssuesForVertex(node, parentWays);
            } else {
                return getIssuesForDetachedPoint(node);
            }
        }

        function wayTypeFor(way) {

            if (way.tags.boundary && way.tags.boundary !== 'no') return 'boundary';
            if (way.tags.indoor && way.tags.indoor !== 'no') return 'indoor';
            if ((way.tags.building && way.tags.building !== 'no') ||
                (way.tags['building:part'] && way.tags['building:part'] !== 'no')) return 'building';
            if (osmPathHighwayTagValues[way.tags.highway]) return 'path';

            const parentRelations = graph.parentRelations(way);
            for (const i in parentRelations) {
                const relation = parentRelations[i];

                if (relation.tags.type === 'boundary') return 'boundary';

                if (relation.isMultipolygon()) {
                    if (relation.tags.indoor && relation.tags.indoor !== 'no') return 'indoor';
                    if ((relation.tags.building && relation.tags.building !== 'no') ||
                        (relation.tags['building:part'] && relation.tags['building:part'] !== 'no')) return 'building';
                }
            }

            return 'other';
        }

        function shouldCheckWay(way) {

            // don't flag issues where merging would create degenerate ways
            if (way.nodes.length <= 2 ||
                (way.isClosed() && way.nodes.length <= 4)) return false;

            const bbox = way.extent(graph).bbox();
            const hypotenuseMeters = geoSphericalDistance([bbox.minX, bbox.minY], [bbox.maxX, bbox.maxY]);
            // don't flag close nodes in very small ways
            if (hypotenuseMeters < 1.5) return false;

            return true;
        }

        function getIssuesForWay(way) {
            if (!shouldCheckWay(way)) return [];

            const issues = [],
                nodes = graph.childNodes(way);
            for (let i = 0; i < nodes.length - 1; i++) {
                const node1 = nodes[i];
                const node2 = nodes[i+1];

                const issue = getWayIssueIfAny(node1, node2, way);
                if (issue) issues.push(issue);
            }
            return issues;
        }

        function getIssuesForVertex(node, parentWays) {
            const issues = [];

            function checkForCloseness(node1, node2, way) {
                const issue = getWayIssueIfAny(node1, node2, way);
                if (issue) issues.push(issue);
            }

            for (let i = 0; i < parentWays.length; i++) {
                const parentWay = parentWays[i];

                if (!shouldCheckWay(parentWay)) continue;

                const lastIndex = parentWay.nodes.length - 1;
                for (let j = 0; j < parentWay.nodes.length; j++) {
                    if (j !== 0) {
                        if (parentWay.nodes[j-1] === node.id) {
                            checkForCloseness(node, graph.entity(parentWay.nodes[j]), parentWay);
                        }
                    }
                    if (j !== lastIndex) {
                        if (parentWay.nodes[j+1] === node.id) {
                            checkForCloseness(graph.entity(parentWay.nodes[j]), node, parentWay);
                        }
                    }
                }
            }
            return issues;
        }

        function thresholdMetersForWay(way) {
            if (!shouldCheckWay(way)) return 0;

            const wayType = wayTypeFor(way);

            // don't flag boundaries since they might be highly detailed and can't be easily verified
            if (wayType === 'boundary') return 0;
            // expect some features to be mapped with higher levels of detail
            if (wayType === 'indoor') return 0.01;
            if (wayType === 'building') return 0.05;
            if (wayType === 'path') return 0.1;
            return 0.2;
        }

        function getIssuesForDetachedPoint(node) {

            const issues = [];

            const lon = node.loc[0];
            const lat = node.loc[1];
            const lon_range = geoMetersToLon(pointThresholdMeters, lat) / 2;
            const lat_range = geoMetersToLat(pointThresholdMeters) / 2;
            const queryExtent = geoExtent([
                [lon - lon_range, lat - lat_range],
                [lon + lon_range, lat + lat_range]
            ]);

            const intersected = context.history().tree().intersects(queryExtent, graph);
            for (let j = 0; j < intersected.length; j++) {
                const nearby = intersected[j];

                if (nearby.id === node.id) continue;
                if (nearby.type !== 'node' || nearby.geometry(graph) !== 'point') continue;

                if (nearby.loc === node.loc ||
                    geoSphericalDistance(node.loc, nearby.loc) < pointThresholdMeters) {

                    // ignore stolperstein (https://wiki.openstreetmap.org/wiki/DE:Stolpersteine)
                    if ('memorial:type' in node.tags && 'memorial:type' in nearby.tags && node.tags['memorial:type']==='stolperstein' && nearby.tags['memorial:type']==='stolperstein') continue;
                    if ('memorial' in node.tags && 'memorial' in nearby.tags && node.tags.memorial==='stolperstein' && nearby.tags.memorial === 'stolperstein') continue;

                    // allow very close points if tags indicate the z-axis might vary
                    const zAxisKeys = { layer: true, level: true, 'addr:housenumber': true, 'addr:unit': true };
                    let zAxisDifferentiates = false;
                    for (const key in zAxisKeys) {
                        const nodeValue = node.tags[key] || '0';
                        const nearbyValue = nearby.tags[key] || '0';
                        if (nodeValue !== nearbyValue) {
                            zAxisDifferentiates = true;
                            break;
                        }
                    }
                    if (zAxisDifferentiates) continue;

                    issues.push(new validationIssue({
                        type: type,
                        subtype: 'detached',
                        severity: 'warning',
                        message: function(context) {
                            const entity = context.hasEntity(this.entityIds[0]),
                                entity2 = context.hasEntity(this.entityIds[1]);
                            return (entity && entity2) ? t.append('issues.close_nodes.detached.message', {
                                feature: utilDisplayLabel(entity, context.graph()),
                                feature2: utilDisplayLabel(entity2, context.graph())
                            }) : '';
                        },
                        reference: showReference,
                        entityIds: [node.id, nearby.id],
                        dynamicFixes: function() {
                            return [
                                new validationIssueFix({
                                    icon: 'iD-operation-disconnect',
                                    title: t.append('issues.fix.move_points_apart.title')
                                }),
                                new validationIssueFix({
                                    icon: 'iD-icon-layers',
                                    title: t.append('issues.fix.use_different_layers_or_levels.title')
                                })
                            ];
                        }
                    }));
                }
            }

            return issues;

            function showReference(selection) {
                const referenceText = t('issues.close_nodes.detached.reference');
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .html(referenceText);
            }
        }

        function getWayIssueIfAny(node1, node2, way) {
            if (node1.id === node2.id ||
                (node1.hasInterestingTags() && node2.hasInterestingTags())) {
                return null;
            }

            if (node1.loc !== node2.loc) {
                const parentWays1 = graph.parentWays(node1);
                const parentWays2 = new Set(graph.parentWays(node2));

                const sharedWays = parentWays1.filter(function(parentWay) {
                    return parentWays2.has(parentWay);
                });

                const thresholds = sharedWays.map(function(parentWay) {
                    return thresholdMetersForWay(parentWay);
                });

                const threshold = Math.min(...thresholds);
                const distance = geoSphericalDistance(node1.loc, node2.loc);
                if (distance > threshold) return null;
            }

            return new validationIssue({
                type: type,
                subtype: 'vertices',
                severity: 'warning',
                message: function(context) {
                    const entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t.append('issues.close_nodes.message', { way: utilDisplayLabel(entity, context.graph()) }) : '';
                },
                reference: showReference,
                entityIds: [way.id, node1.id, node2.id],
                loc: node1.loc,
                dynamicFixes: function() {
                    return [
                        new validationIssueFix({
                            icon: 'iD-icon-plus',
                            title: t.append('issues.fix.merge_points.title'),
                            onClick: function(context) {
                                const entityIds = this.issue.entityIds;
                                const action = actionMergeNodes([entityIds[1], entityIds[2]]);
                                context.perform(action, t('issues.fix.merge_close_vertices.annotation'));
                            }
                        }),
                        new validationIssueFix({
                            icon: 'iD-operation-disconnect',
                            title: t.append('issues.fix.move_points_apart.title')
                        })
                    ];
                }
            });

            function showReference(selection) {
                const referenceText = t('issues.close_nodes.reference');
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .html(referenceText);
            }
        }

    };


    validation.type = type;

    return validation;
}
