import { t } from '../util/locale';
import { actionOrthogonalize } from '../actions/orthogonalize';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';


export function operationOrthogonalize(selectedIDs, context) {
    var _entityID;
    var _entity;
    var _geometry;
    var action = chooseAction();
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });


    function chooseAction() {
        if (selectedIDs.length !== 1) return null;

        _entityID = selectedIDs[0];
        _entity = context.entity(_entityID);
        _geometry = context.geometry(_entityID);

        // square a line/area
        if (_entity.type === 'way' && new Set(_entity.nodes).size > 2 ) {
            return actionOrthogonalize(_entityID, context.projection);

        // square a single vertex
        } else if (_geometry === 'vertex') {
            var graph = context.graph();
            var parents = graph.parentWays(_entity);
            if (parents.length === 1) {
                var way = parents[0];
                if (way.nodes.indexOf(_entityID) !== -1) {
                    return actionOrthogonalize(way.id, context.projection, _entityID);
                }
            }
        }

        return null;
    }


    var operation = function() {
        if (!action) return;

        context.perform(action, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    };


    operation.available = function() {
        return Boolean(action);
    };


    // don't cache this because the visible extent could change
    operation.disabled = function() {
        if (!action) return '';

        var actionDisabled = action.disabled(context.graph());
        if (actionDisabled) {
            return actionDisabled;
        } else if (_geometry !== 'vertex' &&
                   _entity.extent(context.graph()).percentContainedIn(context.extent()) < 0.8) {
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
            t('operations.orthogonalize.' + disable) :
            t('operations.orthogonalize.description.' + _geometry);
    };


    operation.annotation = function() {
        return t('operations.orthogonalize.annotation.' + _geometry);
    };


    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
