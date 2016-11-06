import { t } from '../util/locale';
import { actionReflect } from '../actions/index';

export function operationReflect(selectedIDs, context) {
    const entityId = selectedIDs[0];
    const entity = context.entity(entityId);
    const extent = entity.extent(context.graph());
    const action = actionReflect(entityId);

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
        return t('operations.reflect.description');
    };

    operation.id = 'flipHorizontal';
    operation.keys = [t('operations.reflect.key')];
    operation.title = t('operations.reflect.title');

    return operation;
}
