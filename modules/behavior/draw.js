import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    mouse as d3_mouse,
    select as d3_select
} from 'd3-selection';

import { behaviorEdit } from './edit';
import { behaviorHover } from './hover';
import { behaviorTail } from './tail';
import { geoChooseEdge, geoVecLength } from '../geo';
import { utilKeybinding, utilRebind } from '../util';

var _usedTails = {};
var _disableSpace = false;
var _lastSpace = null;


export function behaviorDraw(context) {
    var dispatch = d3_dispatch(
        'move', 'click', 'clickWay', 'clickNode', 'undo', 'cancel', 'finish'
    );

    var keybinding = utilKeybinding('draw');

    var _hover = behaviorHover(context).altDisables(true).ignoreVertex(true)
        .on('hover', context.ui().sidebar.hover);
    var tail = behaviorTail();
    var edit = behaviorEdit(context);

    var closeTolerance = 4;
    var tolerance = 12;
    var _mouseLeave = false;
    var _lastMouse = null;

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';


    // related code
    // - `mode/drag_node.js` `datum()`
    function datum() {
        var mode = context.mode();
        var isNote = mode && (mode.id.indexOf('note') !== -1);
        if (d3_event.altKey || isNote) return {};

        var element;
        if (d3_event.type === 'keydown') {
            element = _lastMouse && _lastMouse.target;
        } else {
            element = d3_event.target;
        }

        // When drawing, snap only to touch targets..
        // (this excludes area fills and active drawing elements)
        var d = element.__data__;
        return (d && d.properties && d.properties.target) ? d : {};
    }


    function pointerdown() {

        function point() {
            return d3_mouse(context.container().node());
        }

        var element = d3_select(this);
        var t1 = +new Date();
        var p1 = point();

        element.on(_pointerPrefix + 'move.draw', null);

        d3_select(window).on(_pointerPrefix + 'up.draw', function() {
            var t2 = +new Date();
            var p2 = point();
            var dist = geoVecLength(p1, p2);

            element.on(_pointerPrefix + 'move.draw', pointermove);
            d3_select(window).on(_pointerPrefix + 'up.draw', null);

            if (dist < closeTolerance || (dist < tolerance && (t2 - t1) < 500)) {
                // Prevent a quick second click
                d3_select(window).on('click.draw-block', function() {
                    d3_event.stopPropagation();
                }, true);

                context.map().dblclickZoomEnable(false);

                window.setTimeout(function() {
                    context.map().dblclickZoomEnable(true);
                    d3_select(window).on('click.draw-block', null);
                }, 500);

                click(d3_mouse(context.surface().node()));
            }
        }, true);
    }


    function pointermove() {
        _lastMouse = d3_event;
        dispatch.call('move', this, datum());
    }


    function mouseenter() {
        _mouseLeave = false;
    }


    function mouseleave() {
        _mouseLeave = true;
    }

    function allowsVertex(d) {
        return d.geometry(context.graph()) === 'vertex' || context.presets().allowsVertex(d, context.graph());
    }

    // related code
    // - `mode/drag_node.js`     `doMove()`
    // - `behavior/draw.js`      `click()`
    // - `behavior/draw_way.js`  `move()`
    function click(loc) {
        var d = datum();
        var target = d && d.properties && d.properties.entity;

        var mode = context.mode();

        if (target && target.type === 'node' && allowsVertex(target)) {   // Snap to a node
            dispatch.call('clickNode', this, target, d);
            return;

        } else if (target && target.type === 'way' && (mode.id !== 'add-point' || mode.preset.matchGeometry('vertex'))) {   // Snap to a way
            var choice = geoChooseEdge(
                context.childNodes(target), loc, context.projection, context.activeID()
            );
            if (choice) {
                var edge = [target.nodes[choice.index - 1], target.nodes[choice.index]];
                dispatch.call('clickWay', this, choice.loc, edge, d);
                return;
            }
        } else if (mode.id !== 'add-point' || mode.preset.matchGeometry('point')) {
            var locLatLng = context.projection.invert(loc);
            dispatch.call('click', this, locLatLng, d);
        }

    }

    // treat a spacebar press like a click
    function space() {
        d3_event.preventDefault();
        d3_event.stopPropagation();

        var currSpace = context.mouse();
        if (_disableSpace && _lastSpace) {
            var dist = geoVecLength(_lastSpace, currSpace);
            if (dist > tolerance) {
                _disableSpace = false;
            }
        }

        if (_disableSpace || _mouseLeave || !_lastMouse) return;

        // user must move mouse or release space bar to allow another click
        _lastSpace = currSpace;
        _disableSpace = true;

        d3_select(window).on('keyup.space-block', function() {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            _disableSpace = false;
            d3_select(window).on('keyup.space-block', null);
        });

        // get the current mouse position
        var loc = context.map().mouse() ||
            // or the map center if the mouse has never entered the map
            context.projection(context.map().center());
        click(loc);
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


    function behavior(selection) {
        context.install(_hover);
        context.install(edit);

        if (!context.inIntro() && !_usedTails[tail.text()]) {
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
            .on(_pointerPrefix + 'down.draw', pointerdown)
            .on(_pointerPrefix + 'move.draw', pointermove);

        d3_select(document)
            .call(keybinding);

        return behavior;
    }


    behavior.off = function(selection) {
        context.ui().sidebar.hover.cancel();
        context.uninstall(_hover);
        context.uninstall(edit);

        if (!context.inIntro() && !_usedTails[tail.text()]) {
            context.uninstall(tail);
            _usedTails[tail.text()] = true;
        }

        selection
            .on('mouseenter.draw', null)
            .on('mouseleave.draw', null)
            .on(_pointerPrefix + 'down.draw', null)
            .on(_pointerPrefix + 'move.draw', null);

        d3_select(window)
            .on(_pointerPrefix + 'up.draw', null);
            // note: keyup.space-block, click.draw-block should remain

        d3_select(document)
            .call(keybinding.unbind);
    };


    behavior.tail = function(_) {
        tail.text(_);
        return behavior;
    };

    behavior.hover = function() {
        return _hover;
    };


    return utilRebind(behavior, dispatch, 'on');
}
