import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    mouse as d3_mouse,
    select as d3_select,
    touches as d3_touches
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { behaviorEdit } from './edit';
import { behaviorHover } from './hover';
import { behaviorTail } from './tail';

import {
    geoChooseEdge,
    geoEuclideanDistance
} from '../geo';

import { utilRebind } from '../util/rebind';


var usedTails = {};
var disableSpace = false;
var lastSpace = null;


export function behaviorDraw(context) {
    var dispatch = d3_dispatch('move', 'click', 'clickWay',
            'clickNode', 'undo', 'cancel', 'finish'),
        keybinding = d3_keybinding('draw'),
        hover = behaviorHover(context)
            .altDisables(true)
            .on('hover', context.ui().sidebar.hover),
        tail = behaviorTail(),
        edit = behaviorEdit(context),
        closeTolerance = 4,
        tolerance = 12,
        mouseLeave = false,
        lastMouse = null;


    function datum() {
        if (d3_event.altKey) return {};

        if (d3_event.type === 'keydown') {
            return (lastMouse && lastMouse.target.__data__) || {};
        } else {
            return d3_event.target.__data__ || {};
        }
    }


    function mousedown() {

        function point() {
            var p = context.container().node();
            return touchId !== null ? d3_touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3_mouse(p);
        }

        var element = d3_select(this),
            touchId = d3_event.touches ? d3_event.changedTouches[0].identifier : null,
            t1 = +new Date(),
            p1 = point();

        element.on('mousemove.draw', null);

        d3_select(window).on('mouseup.draw', function() {
            var t2 = +new Date(),
                p2 = point(),
                dist = geoEuclideanDistance(p1, p2);

            element.on('mousemove.draw', mousemove);
            d3_select(window).on('mouseup.draw', null);

            if (dist < closeTolerance || (dist < tolerance && (t2 - t1) < 500)) {
                // Prevent a quick second click
                d3_select(window).on('click.draw-block', function() {
                    d3_event.stopPropagation();
                }, true);

                context.map().dblclickEnable(false);

                window.setTimeout(function() {
                    context.map().dblclickEnable(true);
                    d3_select(window).on('click.draw-block', null);
                }, 500);

                click();
            }
        }, true);
    }


    function mousemove() {
        lastMouse = d3_event;
        dispatch.call('move', this, datum());
    }


    function mouseenter() {
        mouseLeave = false;
    }


    function mouseleave() {
        mouseLeave = true;
    }


    function click() {
        var d = datum();
        if (d.type === 'way') {
            var dims = context.map().dimensions(),
                mouse = context.mouse(),
                pad = 5,
                trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                    mouse[1] > pad && mouse[1] < dims[1] - pad;

            if (trySnap) {
                var choice = geoChooseEdge(context.childNodes(d), context.mouse(), context.projection),
                    edge = [d.nodes[choice.index - 1], d.nodes[choice.index]];
                dispatch.call('clickWay', this, choice.loc, edge);
            } else {
                dispatch.call('click', this, context.map().mouseCoordinates());
            }

        } else if (d.type === 'node') {
            dispatch.call('clickNode', this, d);

        } else {
            dispatch.call('click', this, context.map().mouseCoordinates());
        }
    }


    function space() {
        d3_event.preventDefault();
        d3_event.stopPropagation();

        var currSpace = context.mouse();
        if (disableSpace && lastSpace) {
            var dist = geoEuclideanDistance(lastSpace, currSpace);
            if (dist > tolerance) {
                disableSpace = false;
            }
        }

        if (disableSpace || mouseLeave || !lastMouse) return;

        // user must move mouse or release space bar to allow another click
        lastSpace = currSpace;
        disableSpace = true;

        d3_select(window).on('keyup.space-block', function() {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            disableSpace = false;
            d3_select(window).on('keyup.space-block', null);
        });

        click();
    }


    function backspace() {
        d3_event.preventDefault();
        dispatch.call('undo');
    }


    function del() {
        d3_event.preventDefault();
        dispatch.call('cancel');
    }


    function ret() {
        d3_event.preventDefault();
        dispatch.call('finish');
    }


    function draw(selection) {
        context.install(hover);
        context.install(edit);

        if (!context.inIntro() && !usedTails[tail.text()]) {
            context.install(tail);
        }

        keybinding
            .on('⌫', backspace)
            .on('⌦', del)
            .on('⎋', ret)
            .on('↩', ret)
            .on('space', space)
            .on('⌥space', space);

        selection
            .on('mouseenter.draw', mouseenter)
            .on('mouseleave.draw', mouseleave)
            .on('mousedown.draw', mousedown)
            .on('mousemove.draw', mousemove);

        d3_select(document)
            .call(keybinding);

        return draw;
    }


    draw.off = function(selection) {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        if (!context.inIntro() && !usedTails[tail.text()]) {
            context.uninstall(tail);
            usedTails[tail.text()] = true;
        }

        selection
            .on('mouseenter.draw', null)
            .on('mouseleave.draw', null)
            .on('mousedown.draw', null)
            .on('mousemove.draw', null);

        d3_select(window)
            .on('mouseup.draw', null);
            // note: keyup.space-block, click.draw-block should remain

        d3_select(document)
            .call(keybinding.off);
    };


    draw.tail = function(_) {
        tail.text(_);
        return draw;
    };


    return utilRebind(draw, dispatch, 'on');
}
