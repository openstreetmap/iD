import { t } from '../core/localizer';
import { actionDisconnect } from '../actions/disconnect';
import { behaviorOperation } from '../behavior/operation';
import { utilArrayUniq } from '../util/array';
import { utilGetAllNodes, utilTotalExtent } from '../util/util';


export function operationDisconnect(context, selectedIDs) {
    var _vertexIDs = [];
    var _wayIDs = [];
    var _otherIDs = [];
    var _actions = [];

    selectedIDs.forEach(function(id) {
        var entity = context.entity(id);
        if (entity.type === 'way'){
            _wayIDs.push(id);
        } else if (entity.geometry(context.graph()) === 'vertex') {
            _vertexIDs.push(id);
        } else {
            _otherIDs.push(id);
        }
    });

    var _coords, _descriptionID = '', _annotationID = 'features';
    var _disconnectingVertexIds = [];
    var _disconnectingWayIds = [];


    if (_vertexIDs.length > 0) {
        // At the selected vertices, disconnect the selected ways, if any, else
        // disconnect all connected ways

        _disconnectingVertexIds = _vertexIDs;

        _vertexIDs.forEach(function(vertexID) {
            var action = actionDisconnect(vertexID);

            if (_wayIDs.length > 0) {
                var waysIDsForVertex = _wayIDs.filter(function(wayID) {
                    var way = context.entity(wayID);
                    return way.nodes.indexOf(vertexID) !== -1;
                });
                action.limitWays(waysIDsForVertex);
            }
            _actions.push(action);
            _disconnectingWayIds = _disconnectingWayIds
                .concat(context.graph().parentWays(context.graph().entity(vertexID)).map(d => d.id));
        });
        _disconnectingWayIds = utilArrayUniq(_disconnectingWayIds).filter(function(id) {
            return _wayIDs.indexOf(id) === -1;
        });

        _descriptionID += _actions.length === 1 ? 'single_point.' : 'multiple_points.';
        if (_wayIDs.length === 1) {
            _descriptionID += 'single_way.' + context.graph().geometry(_wayIDs[0]);
        } else {
            _descriptionID += _wayIDs.length === 0 ? 'no_ways' : 'multiple_ways';
        }

    } else if (_wayIDs.length > 0) {
        // Disconnect the selected ways from each other, if they're connected,
        // else disconnect them from all connected ways

        var ways = _wayIDs.map(function(id) {
            return context.entity(id);
        });
        var nodes = utilGetAllNodes(_wayIDs, context.graph());
        _coords = nodes.map(function(n) { return n.loc; });

        // actions for connected nodes shared by at least two selected ways
        var sharedActions = [];
        var sharedNodes = [];
        // actions for connected nodes
        var unsharedActions = [];
        var unsharedNodes = [];

        nodes.forEach(function(node) {
            var action = actionDisconnect(node.id).limitWays(_wayIDs);
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
                    sharedNodes.push(node);
                } else {
                    unsharedActions.push(action);
                    unsharedNodes.push(node);
                }
            }
        });

        _descriptionID += 'no_points.';
        _descriptionID += _wayIDs.length === 1 ? 'single_way.' : 'multiple_ways.';

        if (sharedActions.length) {
            // if any nodes are shared, only disconnect the selected ways from each other
            _actions = sharedActions;
            _disconnectingVertexIds = sharedNodes.map(node => node.id);
            _descriptionID += 'conjoined';
            _annotationID = 'from_each_other';
        } else {
            // if no nodes are shared, disconnect the selected ways from all connected ways
            _actions = unsharedActions;
            _disconnectingVertexIds = unsharedNodes.map(node => node.id);
            if (_wayIDs.length === 1) {
                _descriptionID += context.graph().geometry(_wayIDs[0]);
            } else {
                _descriptionID += 'separate';
            }
        }
    }

    var _extent = utilTotalExtent(_disconnectingVertexIds, context.graph());


    var operation = function() {
        context.perform(function(graph) {
            return _actions.reduce(function(graph, action) { return action(graph); }, graph);
        }, operation.annotation());

        context.validator().validate();
    };


    operation.relatedEntityIds = function() {
        if (_vertexIDs.length) {
            return _disconnectingWayIds;
        }
        return _disconnectingVertexIds;
    };


    operation.available = function() {
        if (_actions.length === 0) return false;
        if (_otherIDs.length !== 0) return false;

        if (_vertexIDs.length !== 0 && _wayIDs.length !== 0 && !_wayIDs.every(function(wayID) {
            return _vertexIDs.some(function(vertexID) {
                var way = context.entity(wayID);
                return way.nodes.indexOf(vertexID) !== -1;
            });
        })) return false;

        return true;
    };


    operation.disabled = function() {
        var reason;
        for (var actionIndex in _actions) {
            reason = _actions[actionIndex].disabled(context.graph());
            if (reason) return reason;
        }

        if (_extent && _extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large.' + ((_vertexIDs.length ? _vertexIDs : _wayIDs).length === 1 ? 'single' : 'multiple');
        } else if (_coords && someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }

        return false;


        function someMissing() {
            if (context.inIntro()) return false;
            var osm = context.connection();
            if (osm) {
                var missing = _coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
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
            t.append('operations.disconnect.' + disable) :
            t.append('operations.disconnect.description.' + _descriptionID);
    };


    operation.annotation = function() {
        return t('operations.disconnect.annotation.' + _annotationID);
    };


    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t.append('operations.disconnect.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
