import { actionMergeNodes } from '../actions/merge_nodes';
import { utilDisplayLabel } from '../util';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validation';
import { geoSphericalDistance } from '../geo/geo';


export function validationCloseNodes() {
    var type = 'close_nodes';
    var thresholdMeters = 0.2;

    function shouldCheckWay(way, context) {

        // don't flag issues where merging would create degenerate ways
        if (way.nodes.length <= 2 ||
            (way.isClosed() && way.nodes.length <= 4)) return false;

        // expect that indoor features may be mapped in very fine detail
        if (way.tags.indoor) return false;

        var parentRelations = context.graph().parentRelations(way);

        // don't flag close nodes in boundaries since it's unlikely the user can accurately resolve them
        if (way.tags.boundary) return false;
        if (parentRelations.length && parentRelations.some(function(parentRelation) {
            return parentRelation.tags.type === 'boundary';
        })) return false;

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

            var issue = getIssueIfAny(node1, node2, way, context);
            if (issue) issues.push(issue);
        }
        return issues;
    }

    function getIssuesForNode(node, context) {
        var issues = [];

        function checkForCloseness(node1, node2, way) {
            var issue = getIssueIfAny(node1, node2, way, context);
            if (issue) issues.push(issue);
        }

        var parentWays = context.graph().parentWays(node);

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

    function getIssueIfAny(node1, node2, way, context) {
        if (node1.id === node2.id ||
            (node1.hasInterestingTags() && node2.hasInterestingTags())) {
            return null;
        }

        var nodesAreVeryClose = node1.loc === node2.loc ||
            geoSphericalDistance(node1.loc, node2.loc) < thresholdMeters;

        if (!nodesAreVeryClose) return null;

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
