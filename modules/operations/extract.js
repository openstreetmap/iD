import { actionExtract } from '../actions/extract';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { t } from '../core/localizer';
import { presetManager } from '../presets';
import { utilArrayUniq } from '../util/array';

export function operationExtract(context, selectedIDs) {

    var _amount = selectedIDs.length === 1 ? 'single' : 'multiple';
    var _geometries = utilArrayUniq(selectedIDs.map(function(entityID) {
        return context.graph().hasEntity(entityID) && context.graph().geometry(entityID);
    }).filter(Boolean));
    var _geometryID = _geometries.length === 1 ? _geometries[0] : 'feature';

    var _extent;
    var _actions = selectedIDs.map(function(entityID) {
        var graph = context.graph();
        var entity = graph.hasEntity(entityID);
        if (!entity || !entity.hasInterestingTags()) return null;

        if (entity.type === 'node' && graph.parentWays(entity).length === 0) return null;

        if (entity.type !== 'node') {
            var preset = presetManager.match(entity, graph);
            // only allow extraction from ways/relations if the preset supports points
            if (preset.geometry.indexOf('point') === -1) return null;
        }

        _extent = _extent ? _extent.extend(entity.extent(graph)) : entity.extent(graph);

        return actionExtract(entityID, context.projection);
    }).filter(Boolean);


    var operation = function () {
        var combinedAction = function(graph) {
            _actions.forEach(function(action) {
                graph = action(graph);
            });
            return graph;
        };
        context.perform(combinedAction, operation.annotation());  // do the extract

        var extractedNodeIDs = _actions.map(function(action) {
            return action.getExtractedNodeID();
        });
        context.enter(modeSelect(context, extractedNodeIDs));
    };


    operation.available = function () {
        return _actions.length && selectedIDs.length === _actions.length;
    };


    operation.disabled = function () {

        if (_extent && _extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        } else if (selectedIDs.some(function(entityID) {
            return context.graph().geometry(entityID) === 'vertex' && context.hasHiddenConnections(entityID);
        })) {
            return 'connected_to_hidden';
        }

        return false;
    };


    operation.tooltip = function () {
        var disableReason = operation.disabled();
        if (disableReason) {
            return t.append('operations.extract.' + disableReason + '.' + _amount);
        } else {
            return t.append('operations.extract.description.' + _geometryID + '.' + _amount);
        }
    };


    operation.annotation = function () {
        return t('operations.extract.annotation', { n: selectedIDs.length });
    };


    operation.id = 'extract';
    operation.keys = [t('operations.extract.key')];
    operation.title = t.append('operations.extract.title');
    operation.behavior = behaviorOperation(context).which(operation);


    return operation;
}
