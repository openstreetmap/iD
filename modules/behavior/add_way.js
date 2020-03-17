import { dispatch as d3_dispatch } from 'd3-dispatch';

import { behaviorDraw } from './draw';
import { modeBrowse } from '../modes/browse';
import { utilRebind } from '../util/rebind';


export function behaviorAddWay(context) {
    var dispatch = d3_dispatch('start', 'startFromWay', 'startFromNode', 'cancel', 'finish');
    var draw = behaviorDraw(context);

    function behavior(surface) {
        draw.on('click', function() { dispatch.apply('start', this, arguments); })
            .on('clickWay', function() { dispatch.apply('startFromWay', this, arguments); })
            .on('clickNode', function() { dispatch.apply('startFromNode', this, arguments); })
            .on('cancel', function() { dispatch.apply('cancel', this, arguments); })
            .on('finish', function() { dispatch.apply('finish', this, arguments); });

        context.map()
            .dblclickZoomEnable(false);

        surface.call(draw);
    }

    behavior.off = function(surface) {
        context.map().dblclickZoomEnable(true);

        surface.call(draw.off);
    };

    behavior.tail = function(text) {
        draw.tail(text);
        return behavior;
    };

    return utilRebind(behavior, dispatch, 'on');
}
