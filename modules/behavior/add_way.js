import { dispatch as d3_dispatch } from 'd3-dispatch';

import { behaviorDraw } from './draw';
import { modeBrowse } from '../modes';
import { utilRebind } from '../util/rebind';


export function behaviorAddWay(context) {
    var dispatch = d3_dispatch('start', 'startFromWay', 'startFromNode'),
        draw = behaviorDraw(context);

    var addWay = function(surface) {
        draw.on('click', function() { dispatch.apply('start', this, arguments); })
            .on('clickWay', function() { dispatch.apply('startFromWay', this, arguments); })
            .on('clickNode', function() { dispatch.apply('startFromNode', this, arguments); })
            .on('cancel', addWay.cancel)
            .on('finish', addWay.cancel);

        context.map()
            .dblclickEnable(false);

        surface.call(draw);
    };


    addWay.off = function(surface) {
        surface.call(draw.off);
    };


    addWay.cancel = function() {
        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        context.enter(modeBrowse(context));
    };


    addWay.tail = function(text) {
        draw.tail(text);
        return addWay;
    };


    return utilRebind(addWay, dispatch, 'on');
}
