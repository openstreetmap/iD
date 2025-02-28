import { t } from '../core/localizer';
import { behaviorOperation } from '../behavior/operation';
import { modeRotate } from '../modes/rotate';
import { utilGetAllNodes, utilTotalExtent } from '../util/util';


export function operationRotate(context, selectedIDs) {
    const multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    const nodes = utilGetAllNodes(selectedIDs, context.graph());
    const coords = nodes.map(function(n) { return n.loc; });
    const extent = utilTotalExtent(selectedIDs, context.graph());


    const operation = function() {
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
            const osm = context.connection();
            if (osm) {
                const missing = coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
                if (missing.length) {
                    missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                    return true;
                }
            }
            return false;
        }

        function incompleteRelation(id) {
            const entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }
    };


    operation.tooltip = function() {
        const disable = operation.disabled();
        return disable ?
            t.append('operations.rotate.' + disable + '.' + multi) :
            t.append('operations.rotate.description.' + multi);
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.rotate.annotation.' + context.graph().geometry(selectedIDs[0])) :
            t('operations.rotate.annotation.feature', { n: selectedIDs.length });
    };


    operation.id = 'rotate';
    operation.keys = [t('operations.rotate.key')];
    operation.title = t.append('operations.rotate.title');
    operation.behavior = behaviorOperation(context).which(operation);

    operation.mouseOnly = true;

    return operation;
}
