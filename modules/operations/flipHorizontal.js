import { t } from '../util/locale';
import { actionFlip } from '../actions/index';
import { uiCmd } from '../ui/index';

export function operationFlipHorizontal(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.perform(
            actionFlip(entityId, false, context.projection),
            t('operations.flipHorizontal.annotation')
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
        return t('operations.flipHorizontal.description');
    };

    operation.id = 'flipHorizontal';
    operation.keys = [uiCmd('⌥H')]; // Alt-H
    operation.title = t('operations.flipHorizontal.title');

    return operation;
}
