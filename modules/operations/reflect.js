import { t } from '../util/locale';
import { actionReflect } from '../actions/index';

export function operationReflect(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.perform(
            actionReflect(entityId, false),
            t('operations.reflect.annotation')
        );
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            context.geometry(entityId) === 'area';
    };

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.reflect.description');
    };

    operation.id = 'flipHorizontal';
    operation.keys = [t('operations.reflect.key')];
    operation.title = t('operations.reflect.title');

    return operation;
}
