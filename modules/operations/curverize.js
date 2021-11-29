import {
    t
} from '../util/locale';
import {
    actionCurverize
} from '../actions/curverize';
import {
    behaviorOperation
} from '../behavior/operation';
import {
    utilGetAllNodes
} from '../util';


export function operationCurverize(selectedIDs, context) {

    var action = actionCurverize(selectedIDs, context.projection);
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function (n) {
        return n.loc;
    });

    var operation = function () {
        context.perform(action, operation.annotation());

        window.setTimeout(function () {
            context.validator().validate();
        }, 300); // after any transition
    };


    operation.available = function () {

        if (selectedIDs.length < 1) {
            return false;
        }

        var entities = selectedIDs.map(function (selectedID) {
            return context.entity(selectedID);
        });

        if (selectedIDs.length === 2 && entities[0].type === 'way' && entities[1].type === 'node') {
            if (entities[0].contains(entities[1]) && entities[0].nodes.length >= 4) {
                return true;
            }
        } else if (selectedIDs.length === 1 && entities[0].type === 'node') {
            var nodeParentWays = context.graph().parentWays(entities[0]);
            if (nodeParentWays.length === 1 && context.graph().entity(nodeParentWays[0]) && context.graph().entity(nodeParentWays[0]).type === 'way' && context.graph().entity(nodeParentWays[0]).nodes.length >= 4) {
                return true;
            }
        }
        return false;

    };


    // don't cache this because the visible extent could change
    operation.disabled = function () {
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
                var missing = coords.filter(function (loc) {
                    return !osm.isDataLoaded(loc);
                });
                if (missing.length) {
                    missing.forEach(function (loc) {
                        context.loadTileAtLoc(loc);
                    });
                    return true;
                }
            }
            return false;
        }
    };


    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable ?
            t('operations.curverize.' + disable) :
            t('operations.curverize.description.points');
    };


    operation.annotation = function () {
        return t('operations.curverize.annotation.points');
    };


    operation.id = 'curverize';
    operation.keys = [t('operations.curverize.key')];
    operation.title = t('operations.curverize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
