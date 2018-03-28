import _some from 'lodash-es/some';

import { t } from '../util/locale';
import { behaviorOperation } from '../behavior';
import { geoExtent } from '../geo';
import { modeMove } from '../modes';


export function operationMove(selectedIDs, context) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    var extent = selectedIDs.reduce(function(extent, id) {
        return extent.extend(context.entity(id).extent(context.graph()));
    }, geoExtent());


    var operation = function() {
        context.enter(modeMove(context, selectedIDs));
    };


    operation.available = function() {
        return selectedIDs.length > 1 ||
            context.entity(selectedIDs[0]).type !== 'node';
    };


    operation.disabled = function() {
        var reason;
        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (_some(selectedIDs, context.hasHiddenConnections)) {
            reason = 'connected_to_hidden';
        } else if (_some(selectedIDs, incompleteRelation)) {
            reason = 'incomplete_relation';
        }
        return reason;

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.move.' + disable + '.' + multi) :
            t('operations.move.description.' + multi);
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.move.annotation.' + context.geometry(selectedIDs[0])) :
            t('operations.move.annotation.multiple');
    };


    operation.id = 'move';
    operation.keys = [t('operations.move.key')];
    operation.title = t('operations.move.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
