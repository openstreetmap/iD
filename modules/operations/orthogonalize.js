import { t } from '../util/locale';
import { actionOrthogonalize } from '../actions/orthogonalize';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';


export function operationOrthogonalize(selectedIDs, context) {
    var _extent;
    var type;
    var actions = selectedIDs.map(chooseAction).filter(Boolean);
    var amount = actions.length === 1 ? 'single' : 'multiple';
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });


    function chooseAction(entityID) {

        var entity = context.entity(entityID);
        var geometry = context.geometry(entityID);

        if (!_extent) {
            _extent =  entity.extent(context.graph());
        } else {
            _extent = _extent.extend(entity.extent(context.graph()));
        }

        // square a line/area
        if (entity.type === 'way' && new Set(entity.nodes).size > 2 ) {
            if (type && type !== 'feature') return null;
            type = 'feature';
            return actionOrthogonalize(entityID, context.projection);

        // square a single vertex
        } else if (geometry === 'vertex') {
            if (type && type !== 'corner') return null;
            type = 'corner';
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
        if (!actions.length) return;

        var combinedAction = function(graph, t) {
            actions.forEach(function(action) {
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


    operation.available = function(situation) {
        if (!actions.length || selectedIDs.length !== actions.length) return false;

        if (situation === 'toolbar' &&
            actions.every(function(action) {
                return action.disabled(context.graph()) === 'end_vertex';
            })) return false;

        return true;
    };


    // don't cache this because the visible extent could change
    operation.disabled = function() {
        if (!actions.length) return '';

        var actionDisabled;

        var actionDisableds = {};

        if (actions.every(function(action) {
            var disabled = action.disabled(context.graph());
            if (disabled) actionDisableds[disabled] = true;
            return disabled;
        })) {
            actionDisabled = actions[0].disabled(context.graph());
        }

        if (actionDisabled) {
            if (Object.keys(actionDisableds).length > 1) {
                return 'multiple_blockers';
            }
            return actionDisabled;
        } else if (type !== 'corner' &&
                   _extent.percentContainedIn(context.extent()) < 0.8) {
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
            t('operations.orthogonalize.' + disable + '.' + amount) :
            t('operations.orthogonalize.description.' + type + '.' + amount);
    };


    operation.annotation = function() {
        return t('operations.orthogonalize.annotation.' + type + '.' + amount);
    };


    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
