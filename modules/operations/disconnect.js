import _ from 'lodash';
import { t } from '../util/locale';
import { actionDisconnect } from '../actions/index';


export function operationDisconnect(selectedIDs, context) {
    var vertices = _.filter(selectedIDs, function(entityId) {
        return context.geometry(entityId) === 'vertex';
    });

    var entityId = vertices[0],
        action = actionDisconnect(entityId);

    if (selectedIDs.length > 1) {
        action.limitWays(_.without(selectedIDs, entityId));
    }

    var operation = function() {
        context.perform(action, t('operations.disconnect.annotation'));
    };


    operation.available = function() {
        return vertices.length === 1;
    };


    operation.disabled = function() {
        var reason;
        if (_.some(selectedIDs, context.hasHiddenConnections)) {
            reason = 'connected_to_hidden';
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.disconnect.' + disable) :
            t('operations.disconnect.description');
    };


    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');


    return operation;
}
