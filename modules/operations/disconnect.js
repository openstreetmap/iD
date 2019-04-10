import { t } from '../util/locale';
import { actionDisconnect } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationDisconnect(selectedIDs, context) {
    var _disabled;

    var vertices = [];
    var ways = [];
    var others = [];

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


    var operation = function() {
        context.perform(function(graph) {
            actions.forEach(function(action) {
                graph = action(graph);
            });
            return graph;
        }, operation.annotation());
    };


    operation.available = function() {
        return vertices.length > 0 &&
            others.length === 0 &&
            (ways.length === 0 || ways.every(function(way) {
                return vertices.some(function(vertex) {
                    return context.graph().entity(way).nodes.includes(vertex);
                });
            }));
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
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return _disabled = 'connected_to_hidden';
        }

        return _disabled = false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.disconnect.' + disable) :
            t('operations.disconnect.description');
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
