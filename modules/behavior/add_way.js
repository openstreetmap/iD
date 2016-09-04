import * as d3 from 'd3';
import { rebind } from '../util/rebind';
import { Browse } from '../modes/index';
import { Draw } from './draw';

export function AddWay(context) {
    var dispatch = d3.dispatch('start', 'startFromWay', 'startFromNode'),
        draw = Draw(context);

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

        context.enter(Browse(context));
    };

    addWay.tail = function(text) {
        draw.tail(text);
        return addWay;
    };

    return rebind(addWay, dispatch, 'on');
}
