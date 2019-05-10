import { t } from '../util/locale';
import { actionStraightenNodes } from '../actions/straighten_nodes';
import { actionStraightenWay } from '../actions/straighten_way';
import { behaviorOperation } from '../behavior/operation';
import { utilArrayDifference, utilGetAllNodes } from '../util/index';


export function operationStraighten(selectedIDs, context) {
    var wayIDs = selectedIDs.filter(function(id) { return id.charAt(0) === 'w'; });
    var nodeIDs = selectedIDs.filter(function(id) { return id.charAt(0) === 'n'; });

    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var action = chooseAction();
    var geometry;


    function chooseAction() {
        // straighten selected nodes
        if (wayIDs.length === 0 && nodeIDs.length > 2) {
            geometry = 'points';
            return actionStraightenNodes(nodeIDs, context.projection);

        // straighten selected ways (possibly between range of 2 selected nodes)
        } else if (wayIDs.length > 0 && (nodeIDs.length === 0 || nodeIDs.length === 2)) {
            var startNodeIDs = [];
            var endNodeIDs = [];

            for (var i = 0; i < selectedIDs.length; i++) {
                var entity = context.entity(selectedIDs[i]);
                if (entity.type === 'node') {
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

            // Ensure all ways are connected (i.e. only 2 unique endpoints/startpoints)
            if (utilArrayDifference(startNodeIDs, endNodeIDs).length +
                utilArrayDifference(endNodeIDs, startNodeIDs).length !== 2) return false;

            // Ensure path contains at least 3 unique nodes
            var wayNodeIDs = utilGetAllNodes(wayIDs, context.graph())
                .map(function(node) { return node.id; });
            if (wayNodeIDs.length <= 2) return false;

            // If range of 2 selected nodes is supplied, ensure nodes lie on the selected path
            if (nodeIDs.length === 2 && (
                wayNodeIDs.indexOf(nodeIDs[0]) === -1 || wayNodeIDs.indexOf(nodeIDs[1]) === -1
            )) return false;

            geometry = 'line';
            return actionStraightenWay(selectedIDs, context.projection);
        }

        return false;
    }


    function operation() {
        if (!action) return;

        context.perform(action, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    }


    operation.available = function() {
        return Boolean(action);
    };


    operation.disabled = function() {
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }

        return false;


        function someMissing() {
            if (context.inIntro()) return false;
            var osm = context.connection();
            if (osm) {
                var missing = coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
                if (missing.length) {
                    missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                    return true;
                }
            }
            return false;
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.straighten.' + disable) :
            t('operations.straighten.description.' + geometry);
    };


    operation.annotation = function() {
        return t('operations.straighten.annotation.' + geometry);
    };


    operation.id = 'straighten';
    operation.keys = [t('operations.straighten.key')];
    operation.title = t('operations.straighten.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
