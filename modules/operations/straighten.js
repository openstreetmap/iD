import { t } from '../util/locale';
import { actionStraighten } from '../actions/index';
import { behaviorOperation } from '../behavior/index';
import { utilArrayDifference, utilGetAllNodes } from '../util/index';


export function operationStraighten(selectedIDs, context) {
    var action = actionStraighten(selectedIDs, context.projection);
    var wayIDs = selectedIDs.filter(function(id) { return id.charAt(0) === 'w'; });
    var nodes = utilGetAllNodes(wayIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });


    function operation() {
        context.perform(action, operation.annotation());
    }


    operation.available = function() {
        var nodeIDs = nodes.map(function(node) { return node.id; });
        var startNodeIDs = [];
        var endNodeIDs = [];
        var selectedNodeIDs = [];

        for (var i = 0; i < selectedIDs.length; i++) {
            var entity = context.entity(selectedIDs[i]);
            if (entity.type === 'node') {
                selectedNodeIDs.push(entity.id);
                continue;
            } else if (entity.type !== 'way' || entity.isClosed()) {
                return false;  // exit early, can't straighten these
            }

            startNodeIDs.push(entity.first());
            endNodeIDs.push(entity.last());
        }

        // Remove duplicate end/startNodeIDs (duplicate nodes cannot be at the line end)
        startNodeIDs = startNodeIDs.filter(function(n) {
            return startNodeIDs.indexOf(n) === startNodeIDs.lastIndexOf(n);
        });
        endNodeIDs = endNodeIDs.filter(function(n) {
            return endNodeIDs.indexOf(n) === endNodeIDs.lastIndexOf(n);
        });

        // Return false if line is only 2 nodes long
        if (nodeIDs.length <= 2) return false;

        // Return false unless exactly 0 or 2 specific start/end nodes are selected
        if (!(selectedNodeIDs.length === 0 || selectedNodeIDs.length === 2)) return false;

        // Ensure all ways are connected (i.e. only 2 unique endpoints/startpoints)
        if (utilArrayDifference(startNodeIDs, endNodeIDs).length +
            utilArrayDifference(endNodeIDs, startNodeIDs).length !== 2) return false;

        // Ensure both start/end selected nodes lie on the selected path
        if (selectedNodeIDs.length === 2 && (
            nodeIDs.indexOf(selectedNodeIDs[0]) === -1 || nodeIDs.indexOf(selectedNodeIDs[1]) === -1
        )) return false;

        return true;
    };


    operation.disabled = function() {
        var osm = context.connection();
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (osm && !coords.every(osm.isDataLoaded)) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }
        return false;
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
