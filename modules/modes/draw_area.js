import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';
import { utilDisplayLabel } from '../util';

export function modeDrawArea(context, wayID, startGraph, baselineGraph, button, addMode) {
    var mode = {
        button: button,
        id: 'draw-area',
        title: (addMode && addMode.title) || utilDisplayLabel(context.entity(wayID), context),
        geometry: 'area'
    };

    mode.addMode = addMode;

    mode.wayID = wayID;

    mode.preset = context.presets().match(context.entity(mode.wayID), context.graph());

    var behavior;

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

    mode.repeatAddedFeature = function(val) {
        if (addMode) return addMode.repeatAddedFeature(val);
    };

    mode.addedEntityIDs = function() {
        if (addMode) return addMode.addedEntityIDs();
    };

    mode.didFinishAdding = function() {
        if (mode.repeatAddedFeature()) {
            context.enter(addMode);
        }
        else {
            context.enter(modeSelect(context, mode.addedEntityIDs() || [wayID]).newFeature(true));
        }
    };


    mode.selectedIDs = function() {
        return [wayID];
    };


    mode.activeID = function() {
        return (behavior && behavior.activeID()) || [];
    };


    mode.finish = function() {
        return behavior.finish();
    };


    return mode;
}
