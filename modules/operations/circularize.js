import { t } from '../util/locale';
import { actionCircularize } from '../actions';
import { behaviorOperation } from '../behavior';
import { utilGetAllNodes } from '../util';


export function operationCircularize(selectedIDs, context) {
    var entityID = selectedIDs[0];
    var entity = context.entity(entityID);
    var extent = entity.extent(context.graph());
    var geometry = context.geometry(entityID);
    var action = actionCircularize(entityID, context.projection);
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var _disabled;

    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            new Set(entity.nodes).size > 1;
    };


    operation.disabled = function() {
        if (_disabled !== undefined) return _disabled;

        _disabled = action.disabled(context.graph());
        if (_disabled) {
            return _disabled;
        } else if (extent.percentContainedIn(context.extent()) < 0.8) {
            return _disabled = 'too_large';
        } else if (someMissing()) {
            return _disabled = 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return _disabled = 'connected_to_hidden';
        }

        return _disabled = false;


        function someMissing() {
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
            t('operations.circularize.' + disable) :
            t('operations.circularize.description.' + geometry);
    };


    operation.annotation = function() {
        return t('operations.circularize.annotation.' + geometry);
    };


    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
