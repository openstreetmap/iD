import { t } from '../core/localizer';
import { behaviorDrawWay } from '../behavior/draw_way';


export function modeDrawLine(context, wayID, startGraph, button, affix, continuing) {
    var mode = {
        button: button,
        id: 'draw-line'
    };

    var behavior = behaviorDrawWay(context, wayID, mode, startGraph)
        .on('rejectedSelfIntersection.modeDrawLine', function() {
            context.ui().flash
                .text(t('self_intersection.error.lines'))();
        });

    mode.wayID = wayID;

    mode.isContinuing = continuing;

    mode.enter = function() {
        behavior
            .nodeIndex(affix === 'prefix' ? 0 : undefined);

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
