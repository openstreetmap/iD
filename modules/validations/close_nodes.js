import { operationMerge } from '../operations/index';
import { utilDisplayLabel } from '../util';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmRoutableHighwayTagValues } from '../osm/tags';
import { geoSphericalDistance } from '../geo';


export function validationCloseNodes() {
    var type = 'close_nodes';
    var thresholdMeters = 0.2;

    function getIssuesForWay(way, context) {
        if (!way.tags.highway ||
            !osmRoutableHighwayTagValues[way.tags.highway] ||
            way.nodes.length < 2) return [];

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

            if (!parentWay.tags.highway || !osmRoutableHighwayTagValues[parentWay.tags.highway]) continue;

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
            (node1.hasInterestingTags() && node2.hasInterestingTags()) ||
            geoSphericalDistance(node1.loc, node2.loc) >= thresholdMeters) {
            return null;
        }

        return new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.close_nodes.message', { way: utilDisplayLabel(way, context) }),
            reference: showReference,
            entityIds: [node1.id, node2.id, way.id],
            loc: node1.loc,
            fixes: [
                new validationIssueFix({
                    icon: 'iD-icon-plus',
                    title: t('issues.fix.merge_points.title'),
                    onClick: function() {
                        var entityIds = this.issue.entityIds;
                        var operation = operationMerge([entityIds[0], entityIds[1]], context);
                        operation();
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
