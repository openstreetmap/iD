import { t } from '../core/localizer';
import { actionCloneTags } from '../actions/clone_tags';
import { behaviorOperation } from '../behavior/operation';

/**
 * Base operation for cloning.
 * It is used by the specific clone operations (cloneAddress, cloneBusLanes, ...).
 * @param params object with the following attributes :
 *                 context : the context
 *                 selectedIDs : ids that are selected
 *                 cloneTags : the tags to clone
 *                 operationName : name of the operation that called this base operation
 * @returns operation
 */
export function operationCloneTags(params) {

    const context = params.context;
    const selectedIDs = params.selectedIDs;
    const cloneTags = params.cloneTags;
    const operationName = params.operationName;

    var action = actionCloneTags(selectedIDs, cloneTags);

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
            t('operations.' + operationName + '.' + disable) :
            t('operations.' + operationName + '.description');
    };


    operation.annotation = function () {
        return t('operations.' + operationName + '.annotation');
    };


    operation.id = operationName;
    operation.keys = [t('operations.' + operationName + '.key')];
    operation.title = t('operations.' + operationName + '.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
