import _uniq from 'lodash-es/uniq';
import _difference from 'lodash-es/difference';
import _includes from 'lodash-es/includes';

import { t } from '../util/locale';
import { actionStraighten } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationStraighten(selectedIDs, context) {
    var action = actionStraighten(selectedIDs, context.projection);


    function operation() {
        context.perform(action, operation.annotation());
    }


    operation.available = function() {
        console.log("Running operation.available..");
        var nodes = [],
            startNodes = [],
            endNodes = [],
            selectedNodes = [];

        for (var i = 0; i < selectedIDs.length; i++) {
            if (!context.hasEntity(selectedIDs[i])) return false;

            var entity = context.entity(selectedIDs[i]);

            if (entity.type === 'node') {
                selectedNodes.push(entity.id);
                continue;
            }

            if (entity.type !== 'way' ||
                entity.isClosed()) {
                return false;
            }

            nodes = nodes.concat(entity.nodes);
            startNodes.push(entity.nodes[0]);
            endNodes.push(entity.nodes[entity.nodes.length-1]);
        }

        // Remove duplicate end/startNodes (duplicate nodes cannot be at the line end)
        // i.e. ["n-1", "n-1", "n-2"] => ["n-2"]
        startNodes = startNodes.filter(n => startNodes.indexOf(n) == startNodes.lastIndexOf(n));
        endNodes = endNodes.filter(n => endNodes.indexOf(n) == endNodes.lastIndexOf(n));

        // Return false if line is only 2 nodes long
        // Return false unless exactly 0 or 2 specific nodes are selected
        if (_uniq(nodes).length <= 2 || !_includes([0,2], selectedNodes.length)) return false;

        // Ensure all ways are connected (i.e. only 2 unique endpoints/startpoints)
        if (_difference(startNodes, endNodes).length + _difference(endNodes, startNodes).length !== 2) return false;

        // Ensure both selected nodes lie on the selected path
        if (selectedNodes.length && (!_includes(nodes, selectedNodes[0]) ||
            !_includes(nodes, selectedNodes[1]))) return false;

        return true;
    };


    operation.disabled = function() {
        console.log("Running operation.disabled..");
        var reason;
        for (var i = 0; i < selectedIDs.length; i++) {
            if (context.hasHiddenConnections(selectedIDs[i])) {
                reason = 'connected_to_hidden';
            }
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        console.log("Running operation.tooltip");
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
