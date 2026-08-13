import { dispatch as d3_dispatch } from 'd3-dispatch';

import { behaviorDraw } from './draw';
import { modeBrowse } from '../modes/browse';
import { utilRebind } from '../util/rebind';
import type { Behaviour, coreContext } from '../core/context';

interface BehaviourAddWay extends Behaviour {
    cancel(): void;
}

export function behaviorAddWay(context: coreContext) {
    var dispatch = d3_dispatch('start', 'startFromWay', 'startFromNode');
    var draw = behaviorDraw(context);

    const behavior: BehaviourAddWay = function(surface) {
        draw.on('click', function(...args) { dispatch.apply('start', this, args); })
            .on('clickWay', function(...args) { dispatch.apply('startFromWay', this, args); })
            .on('clickNode', function(...args) { dispatch.apply('startFromNode', this, args); })
            .on('cancel', behavior.cancel)
            .on('finish', behavior.cancel);

        context.map()
            .dblclickZoomEnable(false);

        surface.call(draw);
    };


    behavior.off = function(surface) {
        surface.call(draw.off);
    };


    behavior.cancel = function() {
        window.setTimeout(function() {
            context.map().dblclickZoomEnable(true);
        }, 1000);

        context.enter(modeBrowse(context));
    };


    behavior.on = undefined!; // defined later
    return utilRebind(behavior, dispatch, 'on');
}
