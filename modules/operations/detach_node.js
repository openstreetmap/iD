import { actionDetachNode } from '../actions/index';
import { behaviorOperation } from '../behavior/index';
import { modeMove } from '../modes/index';
import { t } from '../util/locale';

export function operationDetachNode(selectedIDs, context) {
    var selectedNode = selectedIDs[0];
    var operation = function () {
        context.perform(actionDetachNode(selectedNode));
        context.enter(modeMove(context, [selectedNode], context.graph));
    };
    var hasTags = function (entity) {
        return Object.keys(entity.tags).length > 0;
    };
    operation.available = function () {
        // Check multiple items aren't selected
        if (selectedIDs.length !== 1) {
            return false;
        }
        // Get the entity itself
        var graph = context.graph();
        var entity = graph.hasEntity(selectedNode);
        if (!entity) {
            // This probably isn't possible
            return false;
        }
        // Confirm entity is a node with tags
        if (entity.type === 'node' && hasTags(entity)) {
            // Confirm that the node is owned by at least 1 parent way
            var parentWays = graph.parentWays(entity);
            return parentWays && parentWays.length > 0;
        }
        // Not appropriate
        return false;
    };
    operation.disabled = function () {
        return false;
    };
    operation.tooltip = function () {
        return t('operations.detachNode.description');
    };
    operation.annotation = function () {
        return t('operations.detachNode.annotation');
    };
    operation.id = 'detachNode';
    operation.keys = [t('operations.detachNode.key')];
    operation.title = t('operations.detachNode.title');
    operation.behavior = behaviorOperation(context).which(operation);
    return operation;
}
