import { t } from '../util/locale';
import { actionReverse } from '../actions/reverse';
import { behaviorOperation } from '../behavior/operation';


export function operationReverse(selectedIDs, context) {
    var entityID = selectedIDs[0];

    var operation = function() {
        context.perform(actionReverse(entityID), operation.annotation());
        context.validator().validate();
    };


    operation.available = function() {
        return selectedIDs.length === 1 && context.geometry(entityID) === 'line';
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
