import { t } from '../util/locale';
import { geoExtent } from '../geo';
import { actionFollowOld} from '../actions/follow_old';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';


export function operationFollowOld(selectedIDs, context) {

    var action = actionFollowOld(selectedIDs, context.projection);
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });

    var operation = function() {
        context.perform(action, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    };


    operation.available = function() {

        if (selectedIDs.length < 2 || selectedIDs.length > 4) {
            return false;
        }

        var entities = selectedIDs.map(function(selectedID) {
            return context.entity(selectedID);
        });

        if (
            entities[0].type === 'way' && entities[1].type === 'way' && 
            (
                (entities[2] && entities[2].type === 'node' && entities[3] && entities[3].type === 'node') 
             || (entities[2] && entities[2].type === 'node' && !entities[3]) 
             || (!entities[2] && !entities[3])
            )
        ) {
            return true;
        }
        return false;

    };


    // don't cache this because the visible extent could change
    operation.disabled = function() {
        var actionDisabled = action.disabled(context.graph());
        if (actionDisabled) {
            return actionDisabled;
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
            t('operations.follow_old.' + disable) :
            t('operations.follow_old.description.points');
    };


    operation.annotation = function() {
        return t('operations.follow_old.annotation.points');
    };


    operation.id = 'follow_old';
    operation.keys = [t('operations.follow_old.key')];
    operation.title = t('operations.follow_old.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}