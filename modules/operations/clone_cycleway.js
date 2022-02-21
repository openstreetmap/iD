import {
    t
} from '../util/locale';
import {
    actionCloneRoadAttributes
} from '../actions/clone_road_attributes';
import {
    behaviorOperation
} from '../behavior/operation';

export function operationCloneCycleway(selectedIDs, context) {

    const cloneTags = ['routing:bicycle', 'bicycle', 'cycleway:both', 'cycleway:right', 'cycleway:left', 'oneway:bicycle']
    var action = actionCloneRoadAttributes(selectedIDs, cloneTags);

    var operation = function () {
        context.perform(action, operation.annotation());

        window.setTimeout(function () {
            context.validator().validate();
        }, 300); // after any transition
    };


    operation.available = function () {

        if (selectedIDs.length >= 2) {
            const entity = context.entity(selectedIDs[0]);
            for (let i = 0, count = cloneTags.length; i < count; i++) {
                if (entity.tags[cloneTags[i]] !== undefined) {
                    return true;
                }
            }
        }
        return false;

    };


    // don't cache this because the visible extent could change
    operation.disabled = function () {
        
        return false;

    };

    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable ?
            t('operations.clone_cycleway.' + disable) :
            t('operations.clone_cycleway.description');
    };


    operation.annotation = function () {
        return t('operations.clone_cycleway.annotation');
    };


    operation.id = 'clone_cycleway';
    operation.keys = [t('operations.clone_cycleway.key')];
    operation.title = t('operations.clone_cycleway.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
