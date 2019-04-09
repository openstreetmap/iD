import { t } from '../util/locale';
import { actionDisconnect } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationDisconnect(selectedIDs, context) {
    var vertices = selectedIDs
        .filter(function(id) { return context.geometry(id) === 'vertex'; });
    var entityID = vertices[0];
    var action = actionDisconnect(entityID);

    if (entityID && selectedIDs.length > 1) {
        var ids = selectedIDs.filter(function(id) { return id !== entityID; });
        action.limitWays(ids);
    }


    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return vertices.length === 1;
    };


    operation.disabled = function() {
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }
        return false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.disconnect.' + disable) :
            t('operations.disconnect.description');
    };


    operation.annotation = function() {
        return t('operations.disconnect.annotation');
    };


    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
