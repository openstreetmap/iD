import { t } from '../util/locale';
import { actionReflect } from '../actions/index';

export function operationReflect(selectedIDs, context) {
    var entityId = selectedIDs[0];
    var entity = context.entity(entityId);
    var extent = entity.extent(context.graph());
    var action = actionReflect(entityId, context.projection);

    var operation = function() {
        context.perform(
            action,
            t('operations.reflect.annotation')
        );
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            context.geometry(entityId) === 'area';
    };

    operation.disabled = function() {
        if (extent.percentContainedIn(context.extent()) < 0.8) {
            return 'too_large';
        } else if (context.hasHiddenConnections(entityId)) {
            return 'connected_to_hidden';
        } else {
            return false;
        }
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.reflect.' + disable) :
            t('operations.reflect.description');
    };

    operation.id = 'reflect';
    operation.keys = [t('operations.reflect.key')];
    operation.title = t('operations.reflect.title');

    return operation;
}
