import { t } from '../util/locale';
import {
    actionChangePreset,
    actionJoin,
    actionMerge,
    actionMergePolygon,
    actionMergeWayNodes
} from '../actions';

import { behaviorOperation } from '../behavior';
import { modeSelect } from '../modes';


export function operationMerge(selectedIDs, context) {

    function updatePresetTags(newGraph, ids) {
        var id = ids[0],
            newEntity = newGraph.hasEntity(id);

        if (!newEntity) return;

        var newPreset = context.presets().match(newEntity, newGraph);

        context.replace(actionChangePreset(id, null, newPreset), operation.annotation());
    }


    var join = actionJoin(selectedIDs),
        merge = actionMerge(selectedIDs),
        mergePolygon = actionMergePolygon(selectedIDs),
        mergeWayNodes = actionMergeWayNodes(selectedIDs);


    var operation = function() {
        var origGraph = context.graph(),
            action;

        if (!join.disabled(origGraph)) {
            action = join;
        } else if (!merge.disabled(origGraph)) {
            action = merge;
        } else if (!mergePolygon.disabled(origGraph)) {
            action = mergePolygon;
        } else {
            action = mergeWayNodes;
        }

        context.perform(action, operation.annotation());

        var ids = selectedIDs.filter(function(id) {
            var entity = context.hasEntity(id);
            return entity && entity.type !== 'node';
        });

        // if we merged tags, rematch preset to update tags if necessary (#3851)
        if (action === merge) {
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
            mergeWayNodes.disabled(context.graph());
    };


    operation.tooltip = function() {
        var j = join.disabled(context.graph()),
            m = merge.disabled(context.graph()),
            p = mergePolygon.disabled(context.graph()),
            n = mergeWayNodes.disabled(context.graph());

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
