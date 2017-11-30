import _uniq from 'lodash-es/uniq';

import { t } from '../util/locale';
import { actionStraighten } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationStraighten(selectedIDs, context) {
    var entityId = selectedIDs[0],
        action = actionStraighten(entityId, context.projection);


    function operation() {
        context.perform(action, operation.annotation());
    }


    operation.available = function() {
        var entity = context.entity(entityId);
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            !entity.isClosed() &&
            _uniq(entity.nodes).length > 2;
    };


    operation.disabled = function() {
        var reason;
        if (context.hasHiddenConnections(entityId)) {
            reason = 'connected_to_hidden';
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.straighten.' + disable) :
            t('operations.straighten.description');
    };


    operation.annotation = function() {
        return t('operations.straighten.annotation');
    };


    operation.id = 'straighten';
    operation.keys = [t('operations.straighten.key')];
    operation.title = t('operations.straighten.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
