import _uniq from 'lodash-es/uniq';

import { t } from '../util/locale';
import { actionOrthogonalize } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationOrthogonalize(selectedIDs, context) {
    var entityID = selectedIDs[0];
    var entity = context.entity(entityID);
    var extent = entity.extent(context.graph());
    var geometry = context.geometry(entityID);
    var action = actionOrthogonalize(entityID, context.projection);


    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            _uniq(entity.nodes).length > 2;
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
            t('operations.orthogonalize.' + disable) :
            t('operations.orthogonalize.description.' + geometry);
    };


    operation.annotation = function() {
        return t('operations.orthogonalize.annotation.' + geometry);
    };


    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
