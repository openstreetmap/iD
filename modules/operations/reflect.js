import { t } from '../util/locale';
import { actionReflect } from '../actions/index';
import _ from 'lodash';

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
        // For the passed selectIDs, filter out those relating to area geometries
        const areaCount = _(selectedIDs)
            .filter(function(s) { return context.geometry(s) === 'area';})
            // Only allow reflection if exactly 1 area is selected
            .size();
        return areaCount === 1;
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
