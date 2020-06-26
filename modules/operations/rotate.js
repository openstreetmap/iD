import { t } from '../core/localizer';
import { behaviorOperation } from '../behavior/operation';
import { modeRotate } from '../modes/rotate';
import { utilGetAllNodes, utilTotalExtent } from '../util/util';


export function operationRotate(context, selectedIDs) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var extent = utilTotalExtent(selectedIDs, context.graph());


    var operation = function() {
        context.enter(modeRotate(context, selectedIDs));
    };


    operation.available = function() {
        return nodes.length >= 2;
    };


    operation.disabled = function() {

        if (extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        } else if (someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        } else if (selectedIDs.some(incompleteRelation)) {
            return 'incomplete_relation';
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

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.rotate.' + disable + '.' + multi) :
            t('operations.rotate.description.' + multi);
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.rotate.annotation.' + context.graph().geometry(selectedIDs[0])) :
            t('operations.rotate.annotation.multiple');
    };


    operation.id = 'rotate';
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');
    operation.behavior = behaviorOperation(context).which(operation);

    operation.mouseOnly = true;

    return operation;
}
