import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { uiFlash } from '../ui/flash';


export function modeDrawLine(context, wayID, startGraph, baselineGraph, button, affix, continuing) {
    var mode = {
        button: button,
        id: 'draw-line'
    };

    var behavior;

    mode.wayID = wayID;

    mode.isContinuing = continuing;

    mode.enter = function() {
        var way = context.entity(wayID);
        var index = (affix === 'prefix') ? 0 : undefined;
        var headID = (affix === 'prefix') ? way.first() : way.last();

        behavior = behaviorDrawWay(context, wayID, index, mode, startGraph, baselineGraph)
            .tail(t('modes.draw_line.tail'))
            .on('rejectedSelfIntersection.modeDrawLine', function() {
                uiFlash()
                    .text(t('self_intersection.error.lines'))();
            });

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
