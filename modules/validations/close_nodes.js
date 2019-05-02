import { operationMerge } from '../operations/index';
import { utilDisplayLabel } from '../util';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmRoutableHighwayTagValues } from '../osm/tags';
import { geoExtent, geoSphericalDistance } from '../geo';


export function validationCloseNodes() {
    var type = 'close_nodes';

    var thresholdMeters = 0.2;

    function getVeryCloseNodeIssues(node, context) {

        var issues = [];

        function checkForCloseness(node1, node2, way) {
            if (node1.id !== node2.id &&
                !(node1.hasInterestingTags() && node2.hasInterestingTags()) &&
                geoSphericalDistance(node1.loc, node2.loc) < thresholdMeters) {

                issues.push(makeIssue(node1, node2, way, context));
            }
        }

        var parentWays = context.graph().parentWays(node);

        for (var i = 0; i < parentWays.length; i++) {
            var parentWay = parentWays[i];

            if (!parentWay.tags.highway || !osmRoutableHighwayTagValues[parentWay.tags.highway]) continue;

            var lastIndex = parentWay.nodes.length - 1;
            for (var j in parentWay.nodes) {
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

    function makeIssue(node1, node2, way, context) {

        return new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.close_nodes.message', { way: utilDisplayLabel(way, context) }),
            reference: showReference,
            entityIds: [node1.id, node2.id],
            fixes: [
                new validationIssueFix({
                    icon: 'iD-icon-plus',
                    title: t('issues.fix.merge_points.title'),
                    onClick: function() {
                        var entityIds = this.issue.entityIds,
                            operation = operationMerge([entityIds[0], entityIds[1]], context);
                        operation();
                    }
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

        if (entity.type !== 'node') return [];

        return getVeryCloseNodeIssues(entity, context);
    };


    validation.type = type;

    return validation;
}
