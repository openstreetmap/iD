import { t } from '../core/localizer';
import { actionDisconnect } from '../actions/disconnect';
import { behaviorOperation } from '../behavior/operation';
import { utilArrayUniq } from '../util/array';
import { utilGetAllNodes, utilTotalExtent } from '../util/util';


export function operationDisconnect(context, selectedIDs) {
    const _vertexIDs = [];
    const _wayIDs = [];
    const _otherIDs = [];
    let _actions = [];

    selectedIDs.forEach(function(id) {
        const entity = context.entity(id);
        if (entity.type === 'way'){
            _wayIDs.push(id);
        } else if (entity.geometry(context.graph()) === 'vertex') {
            _vertexIDs.push(id);
        } else {
            _otherIDs.push(id);
        }
    });

    let _coords, _descriptionID = '', _annotationID = 'features';
    let _disconnectingVertexIds = [];
    let _disconnectingWayIds = [];


    if (_vertexIDs.length > 0) {
        // At the selected vertices, disconnect the selected ways, if any, else
        // disconnect all connected ways

        _disconnectingVertexIds = _vertexIDs;

        _vertexIDs.forEach(function(vertexID) {
            const action = actionDisconnect(vertexID);

            if (_wayIDs.length > 0) {
                const waysIDsForVertex = _wayIDs.filter(function(wayID) {
                    const way = context.entity(wayID);
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

        const ways = _wayIDs.map(function(id) {
            return context.entity(id);
        });
        const nodes = utilGetAllNodes(_wayIDs, context.graph());
        _coords = nodes.map(function(n) { return n.loc; });

        // actions for connected nodes shared by at least two selected ways
        const sharedActions = [];
        const sharedNodes = [];
        // actions for connected nodes
        const unsharedActions = [];
        const unsharedNodes = [];

        nodes.forEach(function(node) {
            const action = actionDisconnect(node.id).limitWays(_wayIDs);
            if (action.disabled(context.graph()) !== 'not_connected') {

                let count = 0;
                for (const i in ways) {
                    const way = ways[i];
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

    const _extent = utilTotalExtent(_disconnectingVertexIds, context.graph());


    const operation = function() {
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
                const way = context.entity(wayID);
                return way.nodes.indexOf(vertexID) !== -1;
            });
        })) return false;

        return true;
    };


    operation.disabled = function() {
        let reason;
        for (const actionIndex in _actions) {
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
            const osm = context.connection();
            if (osm) {
                const missing = _coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
                if (missing.length) {
                    missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                    return true;
                }
            }
            return false;
        }
    };


    operation.tooltip = function() {
        const disable = operation.disabled();
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
