import _ from 'lodash';
import { Extent } from '../geo/index';
import { Move as MoveAction } from '../actions/index';
import { Move as MoveMode } from '../modes/index';

export function Move(selectedIDs, context) {
    var extent = selectedIDs.reduce(function(extent, id) {
            return extent.extend(context.entity(id).extent(context.graph()));
        }, Extent());

    var operation = function() {
        context.enter(MoveMode(context, selectedIDs));
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
        }
        return MoveAction(selectedIDs).disabled(context.graph()) || reason;
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.move.' + disable) :
            t('operations.move.description');
    };

    operation.id = 'move';
    operation.keys = [t('operations.move.key')];
    operation.title = t('operations.move.title');

    return operation;
}
