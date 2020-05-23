import { t } from '../core/localizer';
import { behaviorDrawWay } from '../behavior/draw_way';


export function modeDrawArea(context, wayID, startGraph, button) {
    var mode = {
        button: button,
        id: 'draw-area'
    };

    var behavior = behaviorDrawWay(context, wayID, mode, startGraph)
        .on('rejectedSelfIntersection.modeDrawArea', function() {
            context.ui().flash
                .text(t('self_intersection.error.areas'))();
        });

    mode.wayID = wayID;

    mode.enter = function() {
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
