import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';

export function modeDrawLine(context, wayID, startGraph, baselineGraph, button, affix, addMode) {
    var mode = {
        button: button,
        id: 'draw-line'
    };

    var behavior;

    mode.wayID = wayID;

    mode.isContinuing = !!affix;

    mode.enter = function() {
        var way = context.entity(wayID);
        var index = (affix === 'prefix') ? 0 : undefined;
        var headID = (affix === 'prefix') ? way.first() : way.last();

        behavior = behaviorDrawWay(context, wayID, index, mode, startGraph, baselineGraph)
            .tail(t('modes.draw_line.tail'));

        var addNode = behavior.addNode;
        behavior.addNode = function(node, d) {
            if (node.id === headID) {
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
            context.enter(modeSelect(context, [wayID]).newFeature(!mode.isContinuing));
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
