import { t } from '../util/locale';
import { actionDisconnect } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationDisconnect(selectedIDs, context) {
    var _disabled;

    var vertices = [];
    var ways = [];
    var others = [];
    var _extent;

    selectedIDs.forEach(function(id) {
        if (context.geometry(id) === 'vertex') {
            vertices.push(id);
        } else if (context.entity(id).type === 'way'){
            ways.push(id);
        } else {
            others.push(id);
        }
    });

    var actions = [];
    var disconnectingWay = vertices.length === 0 && ways.length === 1 && ways[0];

    if (disconnectingWay) {
        _extent = context.entity(disconnectingWay).extent(context.graph());

        context.entity(disconnectingWay).nodes.forEach(function(vertexID) {
            var action = actionDisconnect(vertexID).limitWays(ways);
            if (action.disabled(context.graph()) !== 'not_connected') {
                actions.push(action);
            }
        });
    } else {
        vertices.forEach(function(vertexID) {
            var action = actionDisconnect(vertexID);

            if (ways.length > 0) {
                var waysIDsForVertex = ways.filter(function(wayID) {
                    return context.graph().entity(wayID).nodes.includes(vertexID);
                });
                action.limitWays(waysIDsForVertex);
            }
            actions.push(action);
        });
    }


    var operation = function() {
        context.perform(function(graph) {
            actions.forEach(function(action) {
                graph = action(graph);
            });
            return graph;
        }, operation.annotation());
    };


    operation.available = function() {
        if (actions.length === 0) return false;
        if (others.length !== 0) return false;

        if (vertices.length !== 0 && ways.length !== 0 && !ways.every(function(way) {
            return vertices.some(function(vertex) {
                return context.graph().entity(way).nodes.includes(vertex);
            });
        })) return false;

        return true;
    };


    operation.disabled = function() {
        if (_disabled !== undefined) return _disabled;

        for (var actionIndex in actions) {
            var action = actions[actionIndex];
            var actionReason = action.disabled(context.graph());
            if (actionReason) {
                _disabled = actionReason;
                break;
            }
        }

        if (_disabled) {
            return _disabled;
        } else if (_extent && _extent.area() && _extent.percentContainedIn(context.extent()) < 0.8) {
            return _disabled = 'too_large.single';
// fixme- maybe needs?
        // } else if (someMissing()) {
        //     return _disabled = 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return _disabled = 'connected_to_hidden';
        }

        return _disabled = false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        if (disable) {
            return t('operations.disconnect.' + disable);
        }
        if (disconnectingWay) {
            return t('operations.disconnect.' + context.geometry(disconnectingWay) + '.description');
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
