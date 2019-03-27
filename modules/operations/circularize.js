import { t } from '../util/locale';
import { actionCircularize } from '../actions';
import { behaviorOperation } from '../behavior';


export function operationCircularize(selectedIDs, context) {
    var entityID = selectedIDs[0];
    var entity = context.entity(entityID);
    var extent = entity.extent(context.graph());
    var geometry = context.geometry(entityID);
    var action = actionCircularize(entityID, context.projection);


    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            new Set(entity.nodes).size > 1;
    };


    operation.disabled = function() {
        var reason;
        if (extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (context.hasHiddenConnections(entityID)) {
            reason = 'connected_to_hidden';
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.circularize.' + disable) :
            t('operations.circularize.description.' + geometry);
    };


    operation.annotation = function() {
        return t('operations.circularize.annotation.' + geometry);
    };


    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
