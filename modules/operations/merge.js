import { t } from '../core/localizer';

import { actionJoin } from '../actions/join';
import { actionMerge } from '../actions/merge';
import { actionMergeNodes } from '../actions/merge_nodes';
import { actionMergePolygon } from '../actions/merge_polygon';

import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { presetManager } from '../presets';

export function operationMerge(context, selectedIDs) {

    var _action = getAction();

    function getAction() {
        // prefer a non-disabled action first
        var join = actionJoin(selectedIDs);
        if (!join.disabled(context.graph())) return join;

        var merge = actionMerge(selectedIDs);
        if (!merge.disabled(context.graph())) return merge;

        var mergePolygon = actionMergePolygon(selectedIDs);
        if (!mergePolygon.disabled(context.graph())) return mergePolygon;

        var mergeNodes = actionMergeNodes(selectedIDs);
        if (!mergeNodes.disabled(context.graph())) return mergeNodes;

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
            if (disabled === 'restriction') {
                return t('operations.merge.restriction',
                    { relation: presetManager.item('type/restriction').name() });
            }
            return t('operations.merge.' + disabled);
        }
        return t('operations.merge.description');
    };

    operation.annotation = function() {
        return t('operations.merge.annotation', { n: selectedIDs.length });
    };

    operation.id = 'merge';
    operation.keys = [t('operations.merge.key')];
    operation.title = t('operations.merge.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
