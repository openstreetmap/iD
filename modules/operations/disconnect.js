import { t } from '../core/localizer';
import { actionDisconnect } from '../actions/disconnect';
import { behaviorOperation } from '../behavior/operation';
import { geoExtent } from '../geo';
import { utilGetAllNodes } from '../util/index';


export function operationDisconnect(context, selectedIDs) {
    var vertexIDs = [];
    var wayIDs = [];
    var otherIDs = [];
    var actions = [];

    selectedIDs.forEach(function(id) {
        var entity = context.entity(id);
        if (entity.geometry(context.graph()) === 'vertex') {
            vertexIDs.push(id);
        } else if (entity.type === 'way'){
            wayIDs.push(id);
        } else {
            otherIDs.push(id);
        }
    });

    var extent, nodes, coords, descriptionID = '', annotationID = 'features';

    if (vertexIDs.length > 0) {
        // At the selected vertices, disconnect the selected ways, if any, else
        // disconnect all connected ways

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

        descriptionID += actions.length === 1 ? 'single_point.' : 'multiple_points.';
        if (wayIDs.length === 1) {
            descriptionID += 'single_way.' + context.graph().geometry(wayIDs[0]);
        } else {
            descriptionID += wayIDs.length === 0 ? 'no_ways' : 'multiple_ways';
        }

    } else if (wayIDs.length > 0) {
        // Disconnect the selected ways from each other, if they're connected,
        // else disconnect them from all connected ways

        var ways = wayIDs.map(function(id) {
            return context.entity(id);
        });
        extent = ways.reduce(function(extent, entity) {
            return extent.extend(entity.extent(context.graph()));
        }, geoExtent());
        nodes = utilGetAllNodes(wayIDs, context.graph());
        coords = nodes.map(function(n) { return n.loc; });

        // actions for connected nodes shared by at least two selected ways
        var sharedActions = [];
        // actions for connected nodes
        var unsharedActions = [];

        nodes.forEach(function(node) {
            var action = actionDisconnect(node.id).limitWays(wayIDs);
            if (action.disabled(context.graph()) !== 'not_connected') {

                var count = 0;
                for (var i in ways) {
                    var way = ways[i];
                    if (way.nodes.indexOf(node.id) !== -1) {
                        count += 1;
                    }
                    if (count > 1) break;
                }

                if (count > 1) {
                    sharedActions.push(action);
                } else {
                    unsharedActions.push(action);
                }
            }
        });

        descriptionID += 'no_points.';
        descriptionID += wayIDs.length === 1 ? 'single_way.' : 'multiple_ways.';

        if (sharedActions.length) {
            // if any nodes are shared, only disconnect the selected ways from each other
            actions = sharedActions;
            descriptionID += 'conjoined';
            annotationID = 'from_each_other';
        } else {
            // if no nodes are shared, disconnect the selected ways from all connected ways
            actions = unsharedActions;
            if (wayIDs.length === 1) {
                descriptionID += context.graph().geometry(wayIDs[0]);
            } else {
                descriptionID += 'separate';
            }
        }
    }


    var operation = function() {
        context.perform(function(graph) {
            return actions.reduce(function(graph, action) { return action(graph); }, graph);
        }, operation.annotation());

        context.validator().validate();
    };


    operation.available = function() {
        if (actions.length === 0) return false;
        if (otherIDs.length !== 0) return false;

        if (vertexIDs.length !== 0 && wayIDs.length !== 0 && !wayIDs.every(function(wayID) {
            return vertexIDs.some(function(vertexID) {
                var way = context.entity(wayID);
                return way.nodes.indexOf(vertexID) !== -1;
            });
        })) return false;

        return true;
    };


    operation.disabled = function() {
        var reason;
        for (var actionIndex in actions) {
            reason = actions[actionIndex].disabled(context.graph());
            if (reason) return reason;
        }

        if (extent && extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large.' + (wayIDs.length === 1 ? 'single' : 'multiple');
        } else if (coords && someMissing()) {
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
        return t('operations.disconnect.description.' + descriptionID);
    };


    operation.annotation = function() {
        return t('operations.disconnect.annotation.' + annotationID);
    };


    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
