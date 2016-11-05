import { t } from '../util/locale';
import { actionFlip } from '../actions/index';

export function operationFlipVertical(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.perform(
            actionFlip(entityId, true, context.projection),
            t('operations.flipVertical.annotation')
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
        return t('operations.flipVertical.description');
    };

    operation.id = 'flipVertical';
    operation.keys = [t('operations.flipVertical.key')];
    operation.title = t('operations.flipVertical.title');

    return operation;
}
