import { t } from '../util/locale';

import { actionJoin } from '../actions/join';
import { actionMerge } from '../actions/merge';
import { actionMergeNodes } from '../actions/merge_nodes';
import { actionMergePolygon } from '../actions/merge_polygon';

import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';


export function operationMerge(selectedIDs, context) {

    var join = actionJoin(selectedIDs);
    var merge = actionMerge(selectedIDs);
    var mergePolygon = actionMergePolygon(selectedIDs);
    var mergeNodes = actionMergeNodes(selectedIDs);

    function getAction() {
        if (!join.disabled(context.graph())) {
            return join;

        } else if (!merge.disabled(context.graph())) {
            return merge;

        } else if (!mergePolygon.disabled(context.graph())) {
            return mergePolygon;
        }
        return mergeNodes;
    }

    var operation = function() {
        var action = getAction();

        context.perform(action, operation.annotation());

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
        return join.disabled(context.graph()) &&
            merge.disabled(context.graph()) &&
            mergePolygon.disabled(context.graph()) &&
            mergeNodes.disabled(context.graph());
    };

    operation.tooltip = function() {
        var j = join.disabled(context.graph());          // 'not_eligible', 'not_adjacent', 'restriction', 'conflicting_tags'
        var m = merge.disabled(context.graph());         // 'not_eligible'
        var p = mergePolygon.disabled(context.graph());  // 'not_eligible', 'incomplete_relation'
        var n = mergeNodes.disabled(context.graph());    // 'not_eligible', 'relation', 'restriction'

        // disabled for one of various reasons
        if (j && m && p && n) {
            if (j === 'restriction' || n === 'restriction') {
                return t('operations.merge.restriction',
                    { relation: context.presets().item('type/restriction').name() });

            } else if (p === 'incomplete_relation') {
                return t('operations.merge.incomplete_relation');

            } else if (n === 'relation') {
                return t('operations.merge.relation');

            } else {
                return t('operations.merge.' + j);
            }

        } else {
            return t('operations.merge.description');
        }
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
