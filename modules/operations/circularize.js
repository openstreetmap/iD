import _ from 'lodash';
import { t } from '../util/locale';
import { actionCircularize } from '../actions/index';


export function operationCircularize(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = actionCircularize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.circularize.annotation.' + geometry);
        context.perform(action, annotation);
    };


    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            _.uniq(entity.nodes).length > 1;
    };


    operation.disabled = function() {
        var reason;
        if (extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (context.hasHiddenConnections(entityId)) {
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


    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');


    return operation;
}
