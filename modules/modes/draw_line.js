import { t } from '../core/localizer';
import { behaviorDrawWay } from '../behavior/draw_way';


export function modeDrawLine(context, wayID, startGraph, button, position, continuing) {
    var mode = {
        button: button,
        id: 'draw-line'
    };

    var behavior = behaviorDrawWay(context, wayID, mode, startGraph)
        .on('rejectedSelfIntersection.modeDrawLine', function() {
            context.ui().flash
                .iconName('#iD-icon-no')
                .label(t.append('self_intersection.error.lines'))();
        });

    // If the position is a node index rather than an affix string, the node index will be dynamic based on an offset from the end.
    var offsetFromEndNode;
    if (typeof position === 'number') {
        offsetFromEndNode = context.entity(wayID).nodes.length - position - 1;
    }

    mode.wayID = wayID;

    mode.isContinuing = continuing;

    mode.enter = function() {
        behavior.offsetFromEndNode(offsetFromEndNode);
        if (position === 'prefix') {
            behavior.nodeIndex(0);
        }

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
