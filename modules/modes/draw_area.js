import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';

export function modeDrawArea(context, wayID, startGraph, baselineGraph, button, addMode) {
    var mode = {
        button: button,
        id: 'draw-area'
    };

    var behavior;

    mode.wayID = wayID;

    mode.enter = function() {
        var way = context.entity(wayID);

        behavior = behaviorDrawWay(context, wayID, undefined, mode, startGraph, baselineGraph)
            .tail(t('modes.draw_area.tail'));

        var addNode = behavior.addNode;

        behavior.addNode = function(node, d) {
            var length = way.nodes.length;
            var penultimate = length > 2 ? way.nodes[length - 2] : null;

            if (node.id === way.first() || node.id === penultimate) {
                behavior.finish();
            } else {
                addNode(node, d);
            }
        };

        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    mode.didFinishAdding = function() {
        if (mode.repeatAddedFeature) {
            addMode.repeatAddedFeature = mode.repeatAddedFeature;
            addMode.repeatCount += 1;
            context.enter(addMode);
        }
        else {
            context.enter(modeSelect(context, [wayID]).newFeature(true));
        }
    };


    mode.selectedIDs = function() {
        return [wayID];
    };


    mode.activeID = function() {
        return (behavior && behavior.activeID()) || [];
    };


    mode.finish = function() {
        behavior.finish();
    };


    return mode;
}
