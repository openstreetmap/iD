import { t } from '../core/localizer';
import { behaviorOperation } from '../behavior/operation';
import { uiCmd } from '../ui/cmd';
import { utilGetAllNodes, utilTotalExtent } from '../util/index';
import { actionDistribute } from '../actions';
import type { CreateOperation, Operation } from '../core/history';
import { svgPath } from '../svg';


export const operationDistribute: CreateOperation = (context, selectedIDs) => {
    const nodes = utilGetAllNodes(selectedIDs, context.graph());
    const coords = nodes.map(n => n.loc);
    const extent = utilTotalExtent(selectedIDs, context.graph());
    const action = actionDistribute(nodes.map(n => n.id), context.projection);

    const operation: Operation = () => {
        context.perform(action, operation.annotation());

        window.setTimeout(() => {
            context.validator().validate();
        }, 300);  // after any transition
    };

    operation.available = () => {
        return nodes.length > 2 && selectedIDs.every(id => id[0] === 'n');
    };

    operation.disabled = () => {
        var reason = action.disabled?.(context.graph());
        if (reason) {
            return reason;
        } else if (extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        } else if (someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }

        return false;


        function someMissing() {
            if (context.inIntro()) return false;
            const osm = context.connection();
            if (osm) {
                const missing = coords.filter((loc) => !osm.isDataLoaded(loc));
                if (missing.length) {
                    for (const loc of missing) context.loadTileAtLoc(loc);
                    return true;
                }
            }
            return false;
        }
    };

    operation.getAuxiliaryGeometry = () => {
        const graph = context.graph();
        const previewGraph = action(graph);
        const getPath = svgPath(context.projection, previewGraph, false);
        return selectedIDs.map(entityId => {
            const entity = previewGraph.hasEntity(entityId)!;
            return {
                id: entity.id,
                path: getPath(entity)!,
                klass: 'preview'
            };
        });
    };

    operation.tooltip = function() {
        var disableReason = operation.disabled();
        return disableReason ?
            t.append('operations.distribute.disabled.' + disableReason) :
            t.append('operations.distribute.description');
    };


    operation.annotation = function() {
        return t('operations.distribute.annotation', { n: nodes.length });
    };


    operation.id = 'distribute';
    operation.title = t.append('operations.distribute.title');
    operation.behavior = behaviorOperation(context).which(operation);

    // same key as straighten, but with the shift key. This can't be customised per locale,
    // because it's supposed to feel like an extension of the straighten operation.
    operation.keys = [uiCmd('⇧' + t('operations.straighten.key'))];

    return operation;
};
