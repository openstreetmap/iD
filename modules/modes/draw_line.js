import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';
import { utilDisplayLabel } from '../util';

export function modeDrawLine(context, wayID, startGraph, baselineGraph, button, affix, addMode) {
    var mode = {
        button: button,
        id: 'draw-line',
        title: (addMode && addMode.title) || utilDisplayLabel(context.entity(wayID), context)
    };

    mode.addMode = addMode;

    mode.wayID = wayID;

    mode.isContinuing = !!affix;

    var behavior;

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

    mode.repeatCount = function(val) {
        if (addMode) return addMode.repeatCount(val);
    };

    mode.repeatAddedFeature = function(val) {
        if (addMode) return addMode.repeatAddedFeature(val);
    };

    mode.didFinishAdding = function() {
        if (mode.repeatAddedFeature()) {
            addMode.repeatCount(addMode.repeatCount() + 1);
            context.enter(mode.addMode);
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


    mode.finish = function(skipCompletion) {
        if (skipCompletion) {
            mode.didFinishAdding = function() {};
        }
        behavior.finish();
    };


    return mode;
}
