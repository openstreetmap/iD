import { actionMergeNodes } from '../actions/merge_nodes';
import { utilDisplayLabel } from '../util';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmPathHighwayTagValues } from '../osm/tags';
import { geoMetersToLat, geoMetersToLon, geoSphericalDistance } from '../geo/geo';
import { geoExtent } from '../geo/extent';

export function validationCloseNodes() {
    var type = 'close_nodes';

    var pointThresholdMeters = 0.2;

    var defaultWayThresholdMeters = 0.2;
    // expect some features to be mapped with higher levels of detail
    var indoorThresholdMeters = 0.01;
    var buildingThresholdMeters = 0.05;
    var pathThresholdMeters = 0.1;

    function featureTypeForWay(way, graph) {

        if (way.tags.boundary && way.tags.boundary !== 'no') return 'boundary';
        if (way.tags.indoor && way.tags.indoor !== 'no') return 'indoor';
        if ((way.tags.building && way.tags.building !== 'no') ||
            (way.tags['building:part'] && way.tags['building:part'] !== 'no')) return 'building';
        if (osmPathHighwayTagValues[way.tags.highway]) return 'path';

        var parentRelations = graph.parentRelations(way);
        for (var i in parentRelations) {
            var relation = parentRelations[i];

            if (relation.tags.type === 'boundary') return 'boundary';

            if (relation.isMultipolygon()) {
                if (relation.tags.indoor && relation.tags.indoor !== 'no') return 'indoor';
                if ((relation.tags.building && relation.tags.building !== 'no') ||
                    (relation.tags['building:part'] && relation.tags['building:part'] !== 'no')) return 'building';
            }
        }

        return 'other';
    }

    function shouldCheckWay(way, context) {

        // don't flag issues where merging would create degenerate ways
        if (way.nodes.length <= 2 ||
            (way.isClosed() && way.nodes.length <= 4)) return false;

        var featureType = featureTypeForWay(way, context.graph());
        if (featureType === 'boundary') return false;

        var bbox = way.extent(context.graph()).bbox();
        var hypotenuseMeters = geoSphericalDistance([bbox.minX, bbox.minY], [bbox.maxX, bbox.maxY]);
        // don't flag close nodes in very small ways
        if (hypotenuseMeters < 1.5) return false;

        return true;
    }

    function getIssuesForWay(way, context) {
        if (!shouldCheckWay(way, context)) return [];

        var issues = [],
            nodes = context.graph().childNodes(way);
        for (var i = 0; i < nodes.length - 1; i++) {
            var node1 = nodes[i];
            var node2 = nodes[i+1];

            var issue = getWayIssueIfAny(node1, node2, way, context);
            if (issue) issues.push(issue);
        }
        return issues;
    }

    function getIssuesForVertex(node, parentWays, context) {
        var issues = [];

        function checkForCloseness(node1, node2, way) {
            var issue = getWayIssueIfAny(node1, node2, way, context);
            if (issue) issues.push(issue);
        }

        for (var i = 0; i < parentWays.length; i++) {
            var parentWay = parentWays[i];

            if (!shouldCheckWay(parentWay, context)) continue;

            var lastIndex = parentWay.nodes.length - 1;
            for (var j = 0; j < parentWay.nodes.length; j++) {
                if (j !== 0) {
                    if (parentWay.nodes[j-1] === node.id) {
                        checkForCloseness(node, context.entity(parentWay.nodes[j]), parentWay);
                    }
                }
                if (j !== lastIndex) {
                    if (parentWay.nodes[j+1] === node.id) {
                        checkForCloseness(context.entity(parentWay.nodes[j]), node, parentWay);
                    }
                }
            }
        }
        return issues;
    }

    function getIssuesForDetachedPoint(node, context) {

        var issues = [];

        var lon = node.loc[0];
        var lat = node.loc[1];
        var lon_range = geoMetersToLon(pointThresholdMeters, lat) / 2;
        var lat_range = geoMetersToLat(pointThresholdMeters) / 2;
        var queryExtent = geoExtent([
            [lon - lon_range, lat - lat_range],
            [lon + lon_range, lat + lat_range]
        ]);

        var intersected = context.history().tree().intersects(queryExtent, context.graph());
        for (var j = 0; j < intersected.length; j++) {
            var nearby = intersected[j];

            if (nearby.id === node.id) continue;
            if (nearby.type !== 'node' || nearby.geometry(context.graph()) !== 'point') continue;

            if (nearby.loc === node.loc ||
                geoSphericalDistance(node.loc, nearby.loc) < pointThresholdMeters) {

                issues.push(new validationIssue({
                    type: type,
                    severity: 'warning',
                    message: function() {
                        var entity = context.hasEntity(this.entityIds[0]),
                            entity2 = context.hasEntity(this.entityIds[1]);
                        return (entity && entity2) ? t('issues.close_nodes.detached.message', {
                            feature: utilDisplayLabel(entity, context),
                            feature2: utilDisplayLabel(entity2, context)
                        }) : '';
                    },
                    reference: showReference,
                    entityIds: [node.id, nearby.id],
                    fixes: [
                        new validationIssueFix({
                            icon: 'iD-operation-disconnect',
                            title: t('issues.fix.move_points_apart.title')
                        })
                    ]
                }));
            }
        }

        return issues;

        function showReference(selection) {
            var referenceText = t('issues.close_nodes.detached.reference');
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(referenceText);
        }
    }

    function getIssuesForNode(node, context) {
        var parentWays = context.graph().parentWays(node);
        if (parentWays.length) {
            return getIssuesForVertex(node, parentWays, context);
        } else {
            return getIssuesForDetachedPoint(node, context);
        }
    }

    function getWayIssueIfAny(node1, node2, way, context) {
        if (node1.id === node2.id ||
            (node1.hasInterestingTags() && node2.hasInterestingTags())) {
            return null;
        }

        if (node1.loc !== node2.loc) {

            var featureType = featureTypeForWay(way, context.graph());
            var threshold = defaultWayThresholdMeters;
            if (featureType === 'indoor') threshold = indoorThresholdMeters;
            else if (featureType === 'building') threshold = buildingThresholdMeters;
            else if (featureType === 'path') threshold = pathThresholdMeters;

            var distance = geoSphericalDistance(node1.loc, node2.loc);
            if (distance > threshold) return null;
        }

        return new validationIssue({
            type: type,
            severity: 'warning',
            message: function() {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t('issues.close_nodes.message', { way: utilDisplayLabel(entity, context) }) : '';
            },
            reference: showReference,
            entityIds: [way.id, node1.id, node2.id],
            loc: node1.loc,
            fixes: [
                new validationIssueFix({
                    icon: 'iD-icon-plus',
                    title: t('issues.fix.merge_points.title'),
                    onClick: function() {
                        var entityIds = this.issue.entityIds;
                        var action = actionMergeNodes([entityIds[1], entityIds[2]]);
                        context.perform(action, t('issues.fix.merge_close_vertices.annotation'));
                    }
                }),
                new validationIssueFix({
                    icon: 'iD-operation-disconnect',
                    title: t('issues.fix.move_points_apart.title')
                })
            ]
        });

        function showReference(selection) {
            var referenceText = t('issues.close_nodes.reference');
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(referenceText);
        }
    }


    var validation = function(entity, context) {
        if (entity.type === 'node') {
            return getIssuesForNode(entity, context);
        } else if (entity.type === 'way') {
            return getIssuesForWay(entity, context);
        }
        return [];
    };


    validation.type = type;

    return validation;
}
