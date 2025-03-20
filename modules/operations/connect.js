import { t } from '../core/localizer';
import { actionConnect } from '../actions/connect';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';

export function operationConnect(context, selectedIDs) {
    var nodeID = selectedIDs[0];
    let _matchingNodeID = null;

    function findCoincidentNode(graph) {
        var node1 = graph.entity(nodeID);
        if (node1.type !== 'node') return null;

        var coords = node1.loc;
        for (var id in graph.entities) {
            var entity = graph.entities[id];

            if (entity && entity.type === 'node' && id !== nodeID) {
                var loc = entity.loc;
                if (loc[0] === coords[0] && loc[1] === coords[1]) {
                    return id;
                }
            }
        }
        return null;
    }

    var graph = context.graph();
    _matchingNodeID = findCoincidentNode(graph);
    var _isAvailable = graph.entity(nodeID).type === 'node' && !!_matchingNodeID;

    var operation = function () {
        // No coincident node, nothing to do
        if (!_matchingNodeID) return;

        var nodeIDs = [nodeID, _matchingNodeID];
        var action = actionConnect(nodeIDs);
        var disabledReason = action.disabled(context.graph());
        if (disabledReason) {
            console.warn(`Cannot connect ${nodeID} and ${matchingNodeID}: ${disabledReason}`);
            return;
        }

        context.perform(action);
        context.enter(modeSelect(context, [nodeID]));
    };

    operation.relatedEntityIds = function () {
        return [];
    };

    operation.available = function () {
        return _isAvailable;
    };

    operation.disabled = function () {
        var graph = context.graph();
        if (graph.entity(nodeID).type !== 'node') {
            return 'not_vertex';
        }
        if (!_matchingNodeID) {
            return 'no_coincident_node';
        }

        var action = actionConnect([nodeID, _matchingNodeID]);
        var reason = action.disabled(graph);
        if (reason) {
            return reason;
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }
        return false;
    };

    operation.icon = function () {
        return '#iD-operation-connect';
    };

    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable
            ? t.append(`operations.connect.${disable}`)
            : t.append('operations.connect.description.single');
    };

    operation.annotation = function () {
        return t('operations.connect.annotation.from_point.to_point', { node1: nodeID, node2: _matchingNodeID });
    };

    operation.id = 'connect';
    operation.keys = [t('operations.connect.key')];
    operation.title = t.append('operations.connect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
