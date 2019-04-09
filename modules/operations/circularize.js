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

    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            new Set(entity.nodes).size > 1;
    };


    operation.disabled = function() {
        var osm = context.connection();
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (extent.percentContainedIn(context.extent()) < 0.8) {
            return 'too_large';
        } else if (osm && !coords.every(osm.isDataLoaded)) {
            return 'not_downloaded';
        } else if (context.hasHiddenConnections(entityID)) {
            return 'connected_to_hidden';
        }
        return false;
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
