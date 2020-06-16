import { t } from '../core/localizer';
import { actionStraightenNodes } from '../actions/straighten_nodes';
import { actionStraightenWay } from '../actions/straighten_way';
import { behaviorOperation } from '../behavior/operation';
import { utilArrayDifference, utilGetAllNodes, utilTotalExtent } from '../util/index';


export function operationStraighten(context, selectedIDs) {
    var _wayIDs = selectedIDs.filter(function(id) { return id.charAt(0) === 'w'; });
    var _nodeIDs = selectedIDs.filter(function(id) { return id.charAt(0) === 'n'; });
    var _amount = ((_wayIDs.length ? _wayIDs : _nodeIDs).length === 1 ? 'single' : 'multiple');

    var _nodes = utilGetAllNodes(selectedIDs, context.graph());
    var _coords = _nodes.map(function(n) { return n.loc; });
    var _extent = utilTotalExtent(selectedIDs, context.graph());
    var _action = chooseAction();
    var _geometry;


    function chooseAction() {
        // straighten selected nodes
        if (_wayIDs.length === 0 && _nodeIDs.length > 2) {
            _geometry = 'points';
            return actionStraightenNodes(_nodeIDs, context.projection);

        // straighten selected ways (possibly between range of 2 selected nodes)
        } else if (_wayIDs.length > 0 && (_nodeIDs.length === 0 || _nodeIDs.length === 2)) {
            var startNodeIDs = [];
            var endNodeIDs = [];

            for (var i = 0; i < selectedIDs.length; i++) {
                var entity = context.entity(selectedIDs[i]);
                if (entity.type === 'node') {
                    continue;
                } else if (entity.type !== 'way' || entity.isClosed()) {
                    return null;  // exit early, can't straighten these
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
                utilArrayDifference(endNodeIDs, startNodeIDs).length !== 2) return null;

            // Ensure path contains at least 3 unique nodes
            var wayNodeIDs = utilGetAllNodes(_wayIDs, context.graph())
                .map(function(node) { return node.id; });
            if (wayNodeIDs.length <= 2) return null;

            // If range of 2 selected nodes is supplied, ensure nodes lie on the selected path
            if (_nodeIDs.length === 2 && (
                wayNodeIDs.indexOf(_nodeIDs[0]) === -1 || wayNodeIDs.indexOf(_nodeIDs[1]) === -1
            )) return null;

            if (_nodeIDs.length) {
                // If we're only straightenting between two points, we only need that extent visible
                _extent = utilTotalExtent(_nodeIDs, context.graph());
            }

            _geometry = _wayIDs.length === 1 ? 'line' : 'lines';
            return actionStraightenWay(selectedIDs, context.projection);
        }

        return null;
    }


    function operation() {
        if (!_action) return;

        context.perform(_action, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    }


    operation.available = function() {
        return Boolean(_action);
    };


    operation.disabled = function() {
        var reason = _action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (_extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
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
            t('operations.straighten.' + disable + '.' + _amount) :
            t('operations.straighten.description.' + _geometry);
    };


    operation.annotation = function() {
        return t('operations.straighten.annotation.' + _geometry);
    };


    operation.id = 'straighten';
    operation.keys = [t('operations.straighten.key')];
    operation.title = t('operations.straighten.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
