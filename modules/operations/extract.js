import { actionExtract } from '../actions/extract';
import { actionMoveNode } from '../actions/move_node';
import { behaviorOperation } from '../behavior/operation';
import { modeMove } from '../modes/move';
import { t } from '../util/locale';


export function operationExtract(selectedIDs, context) {
    var entityID = selectedIDs.length && selectedIDs[0];
    var action = actionExtract(entityID, context.projection);

    var geometry = entityID && context.geometry(entityID);
    var extent = geometry === 'area' && context.entity(entityID).extent(context.graph());


    var operation = function () {
        context.perform(action);  // do the extract
        context.validator().validate();

        var extractedNodeID = action.getExtractedNodeID();

        var mouse = context.map().mouseCoordinates();
        if (mouse.some(isNaN)) {
            enterMoveMode();

        } else {
            // move detached node to the mouse location (transitioned)
            context.perform(actionMoveNode(extractedNodeID, mouse));

            // after transition completes, put at final mouse location and enter move mode.
            window.setTimeout(function() {
                mouse = context.map().mouseCoordinates();
                context.replace(actionMoveNode(extractedNodeID, mouse));
                enterMoveMode();
            }, 150);
        }

        function enterMoveMode() {
            var baseGraph = context.graph();
            context.enter(modeMove(context, [extractedNodeID], baseGraph));
        }
    };


    operation.available = function () {
        if (selectedIDs.length !== 1) return false;

        var graph = context.graph();
        var entity = graph.hasEntity(entityID);
        if (!entity) return false;

        if (!entity.hasInterestingTags()) return false;

        if (geometry === 'area') {
            var preset = context.presets().match(entity, graph);
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
        } else if (extent && extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            return 'too_large';
        }

        return false;
    };


    operation.tooltip = function () {
        var disableReason = operation.disabled();
        if (disableReason) {
            return t('operations.extract.' + disableReason + '.' + geometry + '.single',
                { relation: context.presets().item('type/restriction').name() });
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
