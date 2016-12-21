import _ from 'lodash';
import { t } from '../util/locale';
import { behaviorOperation } from '../behavior/index';
import { geoExtent } from '../geo/index';
import { modeRotate } from '../modes/index';


export function operationRotate(selectedIDs, context) {
    var extent = selectedIDs.reduce(function(extent, id) {
            return extent.extend(context.entity(id).extent(context.graph()));
        }, geoExtent());


    var operation = function() {
        context.enter(modeRotate(context, selectedIDs));
    };


    operation.available = function() {
        return selectedIDs.length > 1 ||
            context.entity(selectedIDs[0]).type !== 'node';
    };


    operation.disabled = function() {
        var reason;
        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (_.some(selectedIDs, context.hasHiddenConnections)) {
            reason = 'connected_to_hidden';
        } else if (_.some(selectedIDs, incompleteRelation)) {
            reason = 'incomplete_relation';
        }
        return reason;

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(graph);
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.rotate.' + disable) :
            t('operations.rotate.description.' + (selectedIDs.length === 1 ? 'single' : 'multiple'));
    };


    operation.id = 'rotate';
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
