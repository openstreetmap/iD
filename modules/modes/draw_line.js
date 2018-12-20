import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior';


export function modeDrawLine(context, wayID, startGraph, affix) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var behavior;


    mode.enter = function() {
        var way = context.entity(wayID);
        var index = (affix === 'prefix') ? 0 : undefined;
        var headID = (affix === 'prefix') ? way.first() : way.last();

        behavior = behaviorDrawWay(context, wayID, index, mode, startGraph)
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


    mode.selectedIDs = function() {
        return [wayID];
    };


    mode.activeID = function() {
        return (behavior && behavior.activeID()) || [];
    };

    return mode;
}
