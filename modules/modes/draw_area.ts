import { t } from '../core/localizer';
import { behaviorDrawWay } from '../behavior/draw_way';
import type { coreContext, coreGraph } from '../core';
import type { WayId } from '../osm';
import type { Mode } from '../core/context';


export function modeDrawArea(context: coreContext, wayID: WayId, startGraph: coreGraph, button?: string) {
    const mode: Mode = function(){};
    mode.button = button;
    mode.id = 'draw-area';

    var behavior = behaviorDrawWay(context, wayID, mode, startGraph);
    behavior.on('rejectedSelfIntersection.modeDrawArea', function() {
            context.ui().flash
                .iconName('#iD-icon-no')
                .label(t.append('self_intersection.error.areas'))();
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
        return (behavior && behavior.activeID!()) || [];
    };

    return mode;
}
