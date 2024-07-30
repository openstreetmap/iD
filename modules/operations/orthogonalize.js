import { t } from '../core/localizer';
import { actionOrthogonalize } from '../actions/orthogonalize';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';


export function operationOrthogonalize(context, selectedIDs) {
    var _extent;
    var _type;
    var _actions = selectedIDs.map(chooseAction).filter(Boolean);
    var _amount = _actions.length === 1 ? 'single' : 'multiple';
    var _coords = utilGetAllNodes(selectedIDs, context.graph())
        .map(function(n) { return n.loc; });


    function chooseAction(entityID) {

        var entity = context.entity(entityID);
        var geometry = entity.geometry(context.graph());

        if (!_extent) {
            _extent =  entity.extent(context.graph());
        } else {
            _extent = _extent.extend(entity.extent(context.graph()));
        }

        // square a line/area
        if (entity.type === 'way' && new Set(entity.nodes).size > 2 ) {
            if (_type && _type !== 'feature') return null;
            _type = 'feature';
            return actionOrthogonalize(entityID, context.projection);

        // square a single vertex
        } else if (geometry === 'vertex') {
            if (_type && _type !== 'corner') return null;
            _type = 'corner';
            var graph = context.graph();
            var parents = graph.parentWays(entity);
            if (parents.length === 1) {
                var way = parents[0];
                if (way.nodes.indexOf(entityID) !== -1) {
                    return actionOrthogonalize(way.id, context.projection, entityID);
                }
            }
        }

        return null;
    }


    var operation = function() {
        if (!_actions.length) return;

        var combinedAction = function(graph, t) {
            _actions.forEach(function(action) {
                if (!action.disabled(graph)) {
                    graph = action(graph, t);
                }
            });
            return graph;
        };
        combinedAction.transitionable = true;

        context.perform(combinedAction, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    };


    operation.available = function() {
        return _actions.length && selectedIDs.length === _actions.length;
    };


    // don't cache this because the visible extent could change
    operation.disabled = function() {
        if (!_actions.length) return '';

        var actionDisableds = _actions.map(function(action) {
            return action.disabled(context.graph());
        }).filter(Boolean);

        if (actionDisableds.length === _actions.length) {
            // none of the features can be squared

            if (new Set(actionDisableds).size > 1) {
                return 'multiple_blockers';
            }
            return actionDisableds[0];
        } else if (_extent &&
                   _extent.percentContainedIn(context.map().extent()) < 0.8) {
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
            t.append('operations.orthogonalize.' + disable + '.' + _amount) :
            t.append('operations.orthogonalize.description.' + _type + '.' + _amount);
    };


    operation.annotation = function() {
        return t('operations.orthogonalize.annotation.' + _type, { n: _actions.length });
    };


    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t.append('operations.orthogonalize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
