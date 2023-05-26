import { t } from '../core/localizer';
import { behaviorDrawWay } from '../behavior/draw_way';


export function modeDrawArea(context, wayID, startGraph, button, nodeIndex, continuing) {
    var mode = {
        button: button,
        id: 'draw-area'
    };

    var behavior = behaviorDrawWay(context, wayID, mode, startGraph)
        .on('rejectedSelfIntersection.modeDrawArea', function() {
            context.ui().flash
                .iconName('#iD-icon-no')
                .label(t.append('self_intersection.error.areas'))();
        });

    // The node index will be dynamic based on an offset from the end.
    var offsetFromEndNode;
    if (typeof nodeIndex === 'number') {
        offsetFromEndNode = context.entity(wayID).nodes.length - nodeIndex - 1;
    }

    mode.wayID = wayID;

    mode.isContinuing = continuing;

    mode.enter = function() {
        behavior.offsetFromEndNode(offsetFromEndNode);
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
