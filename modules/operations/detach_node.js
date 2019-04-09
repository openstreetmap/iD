import { actionDetachNode, actionMoveNode } from '../actions';
import { behaviorOperation } from '../behavior';
import { modeMove } from '../modes';
import { t } from '../util/locale';


export function operationDetachNode(selectedIDs, context) {
    var nodeID = selectedIDs.length && selectedIDs[0];
    var action = actionDetachNode(nodeID);

    var operation = function () {
        context.perform(action);  // do the detach

        var mouse = context.map().mouseCoordinates();
        if (mouse.some(isNaN)) {
            enterMoveMode();

        } else {
            // move detached node to the mouse location (transitioned)
            context.perform(actionMoveNode(nodeID, mouse));

            // after transition completes, put at final mouse location and enter move mode.
            window.setTimeout(function() {
                mouse = context.map().mouseCoordinates();
                context.replace(actionMoveNode(nodeID, mouse));
                enterMoveMode();
            }, 150);
        }

        function enterMoveMode() {
            var baseGraph = context.graph();
            context.enter(modeMove(context, [nodeID], baseGraph));
        }
    };


    operation.available = function () {
        if (selectedIDs.length !== 1) return false;

        var graph = context.graph();
        var entity = graph.hasEntity(nodeID);
        if (!entity) return false;

        return entity.type === 'node' &&
            entity.hasInterestingTags() &&
            graph.parentWays(entity).length > 0;
    };


    operation.disabled = function () {
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }
        return false;
    };


    operation.tooltip = function () {
        var disableReason = operation.disabled();
        if (disableReason) {
            return t('operations.detach_node.' + disableReason,
                { relation: context.presets().item('type/restriction').name() }
            );
        } else {
            return t('operations.detach_node.description');
        }
    };


    operation.annotation = function () {
        return t('operations.detach_node.annotation');
    };


    operation.id = 'detach-node';
    operation.keys = [t('operations.detach_node.key')];
    operation.title = t('operations.detach_node.title');
    operation.behavior = behaviorOperation(context).which(operation);


    return operation;
}

