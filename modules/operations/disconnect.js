import _filter from 'lodash-es/filter';
import _some from 'lodash-es/some';
import _without from 'lodash-es/without';

import { t } from '../util/locale';
import { actionDisconnect } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationDisconnect(selectedIDs, context) {
    var vertices = _filter(selectedIDs, function(entityId) {
        return context.geometry(entityId) === 'vertex';
    });

    var entityId = vertices[0],
        action = actionDisconnect(entityId);

    if (selectedIDs.length > 1) {
        action.limitWays(_without(selectedIDs, entityId));
    }


    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return vertices.length === 1;
    };


    operation.disabled = function() {
        var reason;
        if (_some(selectedIDs, context.hasHiddenConnections)) {
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


    operation.annotation = function() {
        return t('operations.disconnect.annotation');
    };


    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
