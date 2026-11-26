import { t } from '../core/localizer';
import { actionReflect } from '../actions/reflect';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes, utilTotalExtent } from '../util/util';


export function operationReflectShort(context, selectedIDs) {
    return operationReflect(context, selectedIDs, 'short');
}


export function operationReflectLong(context, selectedIDs) {
    return operationReflect(context, selectedIDs, 'long');
}


export function operationReflect(context, selectedIDs, axis) {
    axis = axis || 'long';
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var extent = utilTotalExtent(selectedIDs, context.graph());


    var operation = function() {
        var action = actionReflect(selectedIDs, context.projection)
            .useLongAxis(Boolean(axis === 'long'));

        context.perform(action, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    };


    operation.available = function() {
        return nodes.length >= 3;
    };


    // don't cache this because the visible extent could change
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
            t.append('operations.reflect.' + disable + '.' + multi) :
            t.append('operations.reflect.description.' + axis + '.' + multi);
    };


    operation.annotation = function() {
        return t('operations.reflect.annotation.' + axis + '.feature', { n: selectedIDs.length });
    };


    operation.id = 'reflect-' + axis;
    operation.keys = [t('operations.reflect.key.' + axis)];
    operation.title = t.append('operations.reflect.title.' + axis);
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
