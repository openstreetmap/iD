import { operationMerge } from '../operations/index';
import { utilDisplayLabel } from '../util';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmRoutableHighwayTagValues } from '../osm/tags';
import { geoExtent } from '../geo';


export function validationCloseNodes() {
    var type = 'close_nodes';


    function isNodeOnRoad(node, context) {
        var parentWays = context.graph().parentWays(node);
        for (var i = 0; i < parentWays.length; i++) {
            var parentWay = parentWays[i];
            if (osmRoutableHighwayTagValues[parentWay.tags.highway]) {
                return parentWay;
            }
        }
        return false;
    }

    function findDupeNode(node, context) {
        var epsilon = 2e-5,
            extent = geoExtent([
                [node.loc[0] - epsilon, node.loc[1] - epsilon],
                [node.loc[0] + epsilon, node.loc[1] + epsilon]
            ]);
        var filteredEnts = context.intersects(extent);
        for (var i = 0; i < filteredEnts.length; i++) {
            var entity = filteredEnts[i];
            if (entity.type === 'node' && entity.id !== node.id &&
                Math.abs(node.loc[0] - entity.loc[0]) < epsilon &&
                Math.abs(node.loc[1] - entity.loc[1]) < epsilon &&
                isNodeOnRoad(entity, context) ) {
                return entity;
            }
        }
        return null;
    }


    var validation = function(entity, context) {

        if (entity.type !== 'node') return [];

        var road = isNodeOnRoad(entity, context);
        if (!road) return [];

        var dupe = findDupeNode(entity, context);
        if (dupe === null) return [];

        var mergable = !operationMerge([entity.id, dupe.id], context).disabled();
        var fixes = [];
        if (mergable) {
            fixes.push(
                new validationIssueFix({
                    icon: 'iD-icon-plus',
                    title: t('issues.fix.merge_points.title'),
                    onClick: function() {
                        var entities = this.issue.entities,
                            operation = operationMerge([entities[0].id, entities[1].id], context);
                        if (!operation.disabled()) {
                            operation();
                        }
                    }
                })
            );
        }

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.close_nodes.message', { way: utilDisplayLabel(road, context) }),
            reference: showReference,
            entities: [entity, dupe],
            fixes: fixes
        })];


        function showReference(selection) {
            var referenceText = mergable
                ? t('issues.close_nodes.ref_merge')
                : t('issues.close_nodes.ref_move_away');
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(referenceText);
        }
    };


    validation.type = type;

    return validation;
}
