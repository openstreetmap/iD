import { operationMerge } from '../operations/index';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validation';
import { geoExtent } from '../geo';


export function validationDupeNodeOnRoad() {
    var type = 'dupe_node_on_road';


    function isNodeOnRoad(node, context) {
        var parentWays = context.graph().parentWays(node);
        for (var i = 0; i < parentWays.length; i++) {
            if (parentWays[i].tags.highway) {
              return true;
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
        if (entity.type !== 'node' || !isNodeOnRoad(entity, context)) return [];

        var dupe = findDupeNode(entity, context);
        if (dupe === null) return [];

        var mergable = !operationMerge([entity.id, dupe.id], context).disabled();
        var fixes = [];
        if (mergable) {
            fixes.push(
                new validationIssueFix({
                    icon: 'iD-icon-plus',
                    title: t('issues.fix.merge_nodes.title'),
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
            message: t('issues.dupe_node_on_road.message'),
            reference: showReference,
            entities: [entity, dupe],
            fixes: fixes
        })];


        function showReference(selection) {
            var referenceText = mergable
                ? t('issues.dupe_node_on_road.ref_merge')
                : t('issues.dupe_node_on_road.ref_move_away');
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
