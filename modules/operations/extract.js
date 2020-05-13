import { actionExtract } from '../actions/extract';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { t } from '../core/localizer';
import { presetManager } from '../presets';

export function operationExtract(selectedIDs, context) {
    var entityID = selectedIDs.length && selectedIDs[0];
    var action = actionExtract(entityID);

    var geometry = entityID && context.graph().hasEntity(entityID) && context.graph().geometry(entityID);
    var extent = (geometry === 'area' || geometry === 'line') && context.entity(entityID).extent(context.graph());


    var operation = function () {
        context.perform(action, operation.annotation());  // do the extract
        context.enter(modeSelect(context, [action.getExtractedNodeID()]));
    };


    operation.available = function () {
        if (selectedIDs.length !== 1) return false;

        var graph = context.graph();
        var entity = graph.hasEntity(entityID);
        if (!entity) return false;

        if (!entity.hasInterestingTags()) return false;

        if (geometry === 'area' || geometry === 'line') {
            var preset = presetManager.match(entity, graph);
            // only allow extraction from ways/multipolygons if the preset supports points
            return preset.geometry.indexOf('point') !== -1;
        }

        return entity.type === 'node' && graph.parentWays(entity).length > 0;
    };


    operation.disabled = function () {
        var reason = action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (geometry === 'vertex' && selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        } else if (extent && extent.area() && extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        }

        return false;
    };


    operation.tooltip = function () {
        var disableReason = operation.disabled();
        if (disableReason) {
            return t('operations.extract.' + disableReason + '.' + geometry + '.single',
                { relation: presetManager.item('type/restriction').name() });
        } else {
            return t('operations.extract.description.' + geometry + '.single');
        }
    };


    operation.annotation = function () {
        return t('operations.extract.annotation.single');
    };


    operation.id = 'extract';
    operation.keys = [t('operations.extract.key')];
    operation.title = t('operations.extract.title');
    operation.behavior = behaviorOperation(context).which(operation);


    return operation;
}
