import { t } from '../core/localizer';
import { actionCircularize } from '../actions/circularize';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';


export function operationCircularize(context, selectedIDs) {
    var _extent;
    var _actions = selectedIDs.map(getAction).filter(Boolean);
    var _amount = _actions.length === 1 ? 'single' : 'multiple';
    var _coords = utilGetAllNodes(selectedIDs, context.graph())
        .map(function(n) { return n.loc; });

    function getAction(entityID) {

        var entity = context.entity(entityID);

        if (entity.type !== 'way' || new Set(entity.nodes).size <= 1) return null;

        if (!_extent) {
            _extent =  entity.extent(context.graph());
        } else {
            _extent = _extent.extend(entity.extent(context.graph()));
        }

        return actionCircularize(entityID, context.projection);
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
            // none of the features can be circularized

            if (new Set(actionDisableds).size > 1) {
                return 'multiple_blockers';
            }
            return actionDisableds[0];
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
            t('operations.circularize.' + disable + '.' + _amount) :
            t('operations.circularize.description.' + _amount);
    };


    operation.annotation = function() {
        return t('operations.circularize.annotation.' + _amount);
    };


    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
