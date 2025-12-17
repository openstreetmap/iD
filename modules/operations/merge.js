import { t } from '../core/localizer';

import { actionJoin } from '../actions/join';
import { actionMerge } from '../actions/merge';
import { actionMergeNodes } from '../actions/merge_nodes';
import { actionMergePolygon } from '../actions/merge_polygon';
import { actionMergeWithRelation } from '../actions/merge_with_relation';

import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { presetManager } from '../presets';

export function operationMerge(context, selectedIDs) {

    var _action = getAction();

    function getAction() {
        // prefer a non-disabled action first
        const join = actionJoin(selectedIDs);
        if (!join.disabled(context.graph())) return join;

        const merge = actionMerge(selectedIDs);
        if (!merge.disabled(context.graph())) return merge;

        const mergePolygon = actionMergePolygon(selectedIDs);
        if (!mergePolygon.disabled(context.graph())) return mergePolygon;

        const mergeNodes = actionMergeNodes(selectedIDs);
        if (!mergeNodes.disabled(context.graph())) return mergeNodes;

        const mergeWithRelation = actionMergeWithRelation(selectedIDs);
        if (!mergeWithRelation.disabled(context.graph())) return mergeWithRelation;

        // otherwise prefer an action with an interesting disabled reason
        if (join.disabled(context.graph()) !== 'not_eligible') return join;
        if (merge.disabled(context.graph()) !== 'not_eligible') return merge;
        if (mergePolygon.disabled(context.graph()) !== 'not_eligible') return mergePolygon;

        return mergeNodes;
    }

    var operation = function() {

        if (operation.disabled()) return;

        context.perform(_action, operation.annotation());

        context.validator().validate();

        var resultIDs = selectedIDs.filter(context.hasEntity);
        if (resultIDs.length > 1) {
            var interestingIDs = resultIDs.filter(function(id) {
                return context.entity(id).hasInterestingTags();
            });
            if (interestingIDs.length) resultIDs = interestingIDs;
        }
        context.enter(modeSelect(context, resultIDs));
    };

    operation.available = function() {
        return selectedIDs.length >= 2;
    };

    operation.disabled = function() {
        var actionDisabled = _action.disabled(context.graph());
        if (actionDisabled) return actionDisabled;

        var osm = context.connection();
        if (osm &&
            _action.resultingWayNodesLength &&
            _action.resultingWayNodesLength(context.graph()) > osm.maxWayNodes()) {
            return 'too_many_vertices';
        }

        return false;
    };

    operation.tooltip = function() {
        var disabled = operation.disabled();
        if (disabled) {
            if (disabled === 'conflicting_relations') {
                return t.append('operations.merge.conflicting_relations');
            }
            if (disabled === 'restriction' || disabled === 'connectivity') {
                return t.append('operations.merge.damage_relation',
                    { relation: presetManager.item('type/' + disabled).name() });
            }
            return t.append('operations.merge.' + disabled);
        }
        return t.append('operations.merge.description');
    };

    operation.annotation = function() {
        return t('operations.merge.annotation', { n: selectedIDs.length });
    };

    operation.id = 'merge';
    operation.keys = [t('operations.merge.key')];
    operation.title = t.append('operations.merge.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
