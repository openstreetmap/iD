import _uniq from 'lodash-es/uniq';

import { t } from '../util/locale';
import { actionStraighten } from '../actions/index';
import { behaviorOperation } from '../behavior/index';
import { utilArrayDifference } from '../util/index';


export function operationStraighten(selectedIDs, context) {
    var action = actionStraighten(selectedIDs, context.projection);


    function operation() {
        context.perform(action, operation.annotation());
    }


    operation.available = function() {
        var nodes = [];
        var startNodes = [];
        var endNodes = [];
        var selectedNodes = [];

        // collect nodes along selected ways
        for (var i = 0; i < selectedIDs.length; i++) {
            if (!context.hasEntity(selectedIDs[i])) return false;

            var entity = context.entity(selectedIDs[i]);
            if (entity.type === 'node') {
                selectedNodes.push(entity.id);
                continue;
            } else if (entity.type !== 'way' || entity.isClosed()) {
                return false;  // exit early, can't straighten these
            }

            nodes = nodes.concat(entity.nodes);
            startNodes.push(entity.nodes[0]);
            endNodes.push(entity.nodes[entity.nodes.length-1]);
        }

        // Remove duplicate end/startNodes (duplicate nodes cannot be at the line end)
        startNodes = startNodes.filter(function(n) {
            return startNodes.indexOf(n) === startNodes.lastIndexOf(n);
        });
        endNodes = endNodes.filter(function(n) {
            return endNodes.indexOf(n) === endNodes.lastIndexOf(n);
        });

        // Return false if line is only 2 nodes long
        if (_uniq(nodes).length <= 2) return false;

        // Return false unless exactly 0 or 2 specific start/end nodes are selected
        if (!(selectedNodes.length === 0 || selectedNodes.length === 2)) return false;

        // Ensure all ways are connected (i.e. only 2 unique endpoints/startpoints)
        if (utilArrayDifference(startNodes, endNodes).length +
            utilArrayDifference(endNodes, startNodes).length !== 2) return false;

        // Ensure both start/end selected nodes lie on the selected path
        if (selectedNodes.length === 2 && (
            nodes.indexOf(selectedNodes[0]) === -1 || nodes.indexOf(selectedNodes[1]) === -1
        )) return false;

        return true;
    };


    operation.disabled = function() {
        var reason;
        for (var i = 0; i < selectedIDs.length; i++) {
            if (context.hasHiddenConnections(selectedIDs[i])) {
                reason = 'connected_to_hidden';
            }
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.straighten.' + disable) :
            t('operations.straighten.description');
    };


    operation.annotation = function() {
        return t('operations.straighten.annotation');
    };


    operation.id = 'straighten';
    operation.keys = [t('operations.straighten.key')];
    operation.title = t('operations.straighten.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
