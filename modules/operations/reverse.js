import { t } from '../util/locale';
import { actionReverse } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationReverse(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.perform(actionReverse(entityId), operation.annotation());
    };


    operation.available = function() {
        return selectedIDs.length === 1 && context.geometry(entityId) === 'line';
    };


    operation.disabled = function() {
        return false;
    };


    operation.tooltip = function() {
        return t('operations.reverse.description');
    };


    operation.annotation = function() {
        return t('operations.reverse.annotation');
    };


    operation.id = 'reverse';
    operation.keys = [t('operations.reverse.key')];
    operation.title = t('operations.reverse.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
