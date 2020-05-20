import { t } from '../core/localizer';
import { actionSplit } from '../actions/split';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';


export function operationSplit(context, selectedIDs) {
    var vertices = selectedIDs
        .filter(function(id) { return context.graph().geometry(id) === 'vertex'; });
    var entityID = vertices[0];
    var action = actionSplit(entityID);
    var ways = [];

    if (vertices.length === 1) {
        if (entityID && selectedIDs.length > 1) {
            var ids = selectedIDs.filter(function(id) { return id !== entityID; });
            action.limitWays(ids);
        }
        ways = action.ways(context.graph());
    }


    var operation = function() {
        var difference = context.perform(action, operation.annotation());
        context.enter(modeSelect(context, difference.extantIDs()));
    };


    operation.available = function() {
        return vertices.length === 1;
    };


    operation.disabled = function() {
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }

        return false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        if (disable) {
            return t('operations.split.' + disable);
        } else if (ways.length === 1) {
            return t('operations.split.description.' + context.graph().geometry(ways[0].id));
        } else {
            return t('operations.split.description.multiple');
        }
    };


    operation.annotation = function() {
        return ways.length === 1 ?
            t('operations.split.annotation.' + context.graph().geometry(ways[0].id)) :
            t('operations.split.annotation.multiple', { n: ways.length });
    };


    operation.id = 'split';
    operation.keys = [t('operations.split.key')];
    operation.title = t('operations.split.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
