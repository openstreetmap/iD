import { t } from '../util/locale';
import { actionDisconnect } from '../actions/disconnect';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util/index';


export function operationDisconnect(selectedIDs, context) {
    var vertexIDs = [];
    var wayIDs = [];
    var otherIDs = [];
    var actions = [];

    selectedIDs.forEach(function(id) {
        if (context.geometry(id) === 'vertex') {
            vertexIDs.push(id);
        } else if (context.entity(id).type === 'way'){
            wayIDs.push(id);
        } else {
            otherIDs.push(id);
        }
    });

    var disconnectingWayID = (vertexIDs.length === 0 && wayIDs.length === 1 && wayIDs[0]);
    var extent, nodes, coords;

    if (disconnectingWayID) {   // disconnecting a way
        var way = context.entity(disconnectingWayID);
        extent = way.extent(context.graph());
        nodes = utilGetAllNodes([disconnectingWayID], context.graph());
        coords = nodes.map(function(n) { return n.loc; });

        way.nodes.forEach(function(vertexID) {
            var action = actionDisconnect(vertexID).limitWays(wayIDs);
            if (action.disabled(context.graph()) !== 'not_connected') {
                actions.push(action);
            }
        });

    } else {    // disconnecting a vertex
        vertexIDs.forEach(function(vertexID) {
            var action = actionDisconnect(vertexID);

            if (wayIDs.length > 0) {
                var waysIDsForVertex = wayIDs.filter(function(wayID) {
                    var way = context.entity(wayID);
                    return way.nodes.indexOf(vertexID) !== -1;
                });
                action.limitWays(waysIDsForVertex);
            }
            actions.push(action);
        });
    }


    var operation = function() {
        context.perform(function(graph) {
            return actions.reduce(function(graph, action) { return action(graph); }, graph);
        }, operation.annotation());

        context.validator().validate();
    };


    operation.available = function(situation) {
        if (actions.length === 0) return false;
        if (otherIDs.length !== 0) return false;

        if (vertexIDs.length !== 0 && wayIDs.length !== 0 && !wayIDs.every(function(wayID) {
            return vertexIDs.some(function(vertexID) {
                var way = context.entity(wayID);
                return way.nodes.indexOf(vertexID) !== -1;
            });
        })) return false;

        if (situation === 'toolbar' &&
            actions.every(function(action) {
                return action.disabled(context.graph()) === 'not_connected';
            })) return false;

        return true;
    };


    operation.disabled = function() {
        var reason;
        for (var actionIndex in actions) {
            reason = actions[actionIndex].disabled(context.graph());
            if (reason) return reason;
        }

        if (disconnectingWayID && extent.percentContainedIn(context.extent()) < 0.8) {
            return 'too_large.single';
        } else if (disconnectingWayID && someMissing()) {
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
        if (disable) {
            return t('operations.disconnect.' + disable);
        }
        if (disconnectingWayID) {
            return t('operations.disconnect.' + context.geometry(disconnectingWayID) + '.description');
        }
        return t('operations.disconnect.description');
    };


    operation.annotation = function() {
        return t('operations.disconnect.annotation');
    };


    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
