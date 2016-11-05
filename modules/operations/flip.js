import { t } from '../util/locale';
import { actionFlip } from '../actions/index';


export function operationFlip(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.perform(
            actionFlip(entityId, false, context.projection),
            t('operations.flip.annotation')
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
        return t('operations.flip.description');
    };


    operation.id = 'flip';
    operation.keys = [t('operations.flip.key')];
    operation.title = t('operations.flip.title');


    return operation;
}
