import {
    t
} from '../util/locale';
import {
    actionCloneAddress
} from '../actions/clone_address';
import {
    behaviorOperation
} from '../behavior/operation';
import {
    utilGetAllNodes
} from '../util';


export function operationCloneAddress(selectedIDs, context) {

    var action = actionCloneAddress(selectedIDs, context.projection);

    var operation = function () {
        context.perform(action, operation.annotation());

        window.setTimeout(function () {
            context.validator().validate();
        }, 300); // after any transition
    };


    operation.available = function () {

        if (selectedIDs.length < 2) {
            return false;
        }

        return true;

    };


    // don't cache this because the visible extent could change
    operation.disabled = function () {
        
        return false;

    };

    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable ?
            t('operations.clone_address.' + disable) :
            t('operations.clone_address.description');
    };


    operation.annotation = function () {
        return t('operations.clone_address.annotation');
    };


    operation.id = 'clone_address';
    operation.keys = [t('operations.clone_address.key')];
    operation.title = t('operations.clone_address.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
