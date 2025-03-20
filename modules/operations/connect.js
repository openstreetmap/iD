// To-do-list

//-1. Transition from snap_node connect_node
//~2. Implement data and ------image------- with internal functionality of circularize

//-3. Check it at same coordinate another node exist
    //-1. If exists then only proceed 

//-4. Connect the nodes

//-5. Return appropiate operation
// 6. Add test cases 


// Bugs
//-1. Multiple re-renders
//-2. Action only on click other time just check if node is present
// 3. No keybinding

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
        console.count("triggered")
        // No coincident node, nothing to do
        if (!_matchingNodeID) return;

        var nodeIDs = [nodeID, _matchingNodeID];
        var action = actionConnect(nodeIDs);
        var disabledReason = action.disabled(context.graph());
        if (disabledReason) {
            console.log(`Cannot connect ${nodeID} and ${matchingNodeID}: ${disabledReason}`);
            return;
        }

        // Perform the merge and switch to select mode
        context.perform(action, operation.annotation());
        context.enter(modeSelect(context, [nodeID])); // Select the surviving node
    };

    // Define related entity IDs (empty for now, as we’re only dealing with nodes)
    operation.relatedEntityIds = function () {
        return [];
    };

    // Check if the operation is available
    operation.available = function () {
        return _isAvailable;
    };

    // Check if the operation is disabled
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

    // Tooltip based on enabled/disabled state
    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable
            ? t.append(`operations.connect.${disable}`)
            : t.append('operations.connect.description.' + "single");
    };

    operation.annotation = function () {
        return t('operations.connect.annotation', { node1: nodeID, node2: _matchingNodeID });
    };

    operation.id = 'connect';
    operation.keys = [t('operations.connect.key')];
    operation.title = t.append('operations.connect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
