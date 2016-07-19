import { t } from '../util/locale';
import { Reverse as ReverseAction } from '../actions/index';
export function Reverse(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.perform(
            ReverseAction(entityId),
            t('operations.reverse.annotation'));
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            context.geometry(entityId) === 'line';
    };

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.reverse.description');
    };

    operation.id = 'reverse';
    operation.keys = [t('operations.reverse.key')];
    operation.title = t('operations.reverse.title');

    return operation;
}
