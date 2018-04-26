import { t } from '../util/locale';

import {
    actionChangePreset,
    actionJoin,
    actionMerge,
    actionMergeNodes,
    actionMergePolygon
} from '../actions';

import { behaviorOperation } from '../behavior';
import { modeSelect } from '../modes';


export function operationMerge(selectedIDs, context) {

    function updatePresetTags(newGraph, ids) {
        var id = ids[0];
        var newEntity = newGraph.hasEntity(id);

        if (!newEntity) return;
        var newPreset = context.presets().match(newEntity, newGraph);
        context.replace(actionChangePreset(id, null, newPreset), operation.annotation());
    }


    var join = actionJoin(selectedIDs);
    var merge = actionMerge(selectedIDs);
    var mergePolygon = actionMergePolygon(selectedIDs);
    var mergeNodes = actionMergeNodes(selectedIDs);


    var operation = function() {
        var doUpdateTags;
        var action;

        if (!join.disabled(context.graph())) {
            doUpdateTags = false;
            action = join;
        } else if (!merge.disabled(context.graph())) {
            doUpdateTags = true;
            action = merge;
        } else if (!mergePolygon.disabled(context.graph())) {
            doUpdateTags = false;
            action = mergePolygon;
        } else {
            doUpdateTags = true;
            action = mergeNodes;
        }

        context.perform(action, operation.annotation());

        var ids = selectedIDs.filter(function(id) {
            var entity = context.hasEntity(id);
            return entity && entity.type !== 'node';
        });

        // if we merged tags, rematch preset to update tags if necessary (#3851)
        if (doUpdateTags) {
            updatePresetTags(context.graph(), ids);
        }

        context.enter(modeSelect(context, ids));
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
        var j = join.disabled(context.graph());
        var m = merge.disabled(context.graph());
        var p = mergePolygon.disabled(context.graph());
        var n = mergeNodes.disabled(context.graph());

        if (j === 'restriction' && m && p && n) {
            return t('operations.merge.restriction',
                { relation: context.presets().item('type/restriction').name() });
        }

        if (p === 'incomplete_relation' && j && m && n) {
            return t('operations.merge.incomplete_relation');
        }

        if (j && m && p && n) {
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
