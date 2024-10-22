import { t } from '../core/localizer';
import { actionSnap } from '../actions/snap';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';

/**
 * Snaps the first selected way onto the second way
 * @param context context object which provides access to iD's internal state
 * @param selectedIDs list with the IDs of the entities which are currently selected
 * @returns snap operation
 */
export function operationSnap(context, selectedIDs) {

    var action = actionSnap(selectedIDs);

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
            t('operations.snap.' + disable) :
            t('operations.snap.description.points');
    };


    operation.annotation = function() {
        return t('operations.snap.annotation.points');
    };


    operation.id = 'snap';
    operation.keys = [t('operations.snap.key')];
    operation.title = t('operations.snap.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
