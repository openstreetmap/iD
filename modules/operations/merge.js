import { t } from '../util/locale';
import {
    actionJoin,
    actionMerge,
    actionMergePolygon
} from '../actions/index';

import { behaviorOperation } from '../behavior/index';
import { modeSelect } from '../modes/index';


export function operationMerge(selectedIDs, context) {
    var join = actionJoin(selectedIDs),
        merge = actionMerge(selectedIDs),
        mergePolygon = actionMergePolygon(selectedIDs);

    var operation = function() {
        var action;

        if (!join.disabled(context.graph())) {
            action = join;
        } else if (!merge.disabled(context.graph())) {
            action = merge;
        } else {
            action = mergePolygon;
        }

        context.perform(action, operation.annotation());
        var ids = selectedIDs.filter(function(id) {
            var entity = context.hasEntity(id);
            return entity && entity.type !== 'node';
        });
        context.enter(modeSelect(context, ids));
    };


    operation.available = function() {
        return selectedIDs.length >= 2;
    };


    operation.disabled = function() {
        return join.disabled(context.graph()) &&
            merge.disabled(context.graph()) &&
            mergePolygon.disabled(context.graph());
    };


    operation.tooltip = function() {
        var j = join.disabled(context.graph()),
            m = merge.disabled(context.graph()),
            p = mergePolygon.disabled(context.graph());

        if (j === 'restriction' && m && p) {
            return t('operations.merge.restriction',
                { relation: context.presets().item('type/restriction').name() });
        }

        if (p === 'incomplete_relation' && j && m) {
            return t('operations.merge.incomplete_relation');
        }

        if (j && m && p) {
            return t('operations.merge.' + j);
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
