import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
import { behaviorEdit } from './edit';
import { behaviorHover } from './hover';
import { geoChooseEdge, geoVecLength } from '../geo';
import { utilFastMouse, utilKeybinding, utilRebind } from '../util';

var _disableSpace = false;
var _lastSpace = null;


export function behaviorDraw(context) {
    var dispatch = d3_dispatch(
        'move', 'down', 'downcancel', 'click', 'clickWay', 'clickNode', 'undo', 'cancel', 'finish'
    );

    var keybinding = utilKeybinding('draw');

    var _hover = behaviorHover(context)
        .altDisables(true)
        .ignoreVertex(true)
        .on('hover', context.ui().sidebar.hover);
    var _edit = behaviorEdit(context);

    var _closeTolerance = 4;
    var _tolerance = 12;
    var _mouseLeave = false;
    var _lastMouse = null;
    var _lastPointerUpEvent;

    var _downPointer;

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

        if (_downPointer) return;

        var pointerLocGetter = utilFastMouse(this);
        _downPointer = {
            id: d3_event.pointerId || 'mouse',
            pointerLocGetter: pointerLocGetter,
            downTime: +new Date(),
            downLoc: pointerLocGetter(d3_event)
        };

        dispatch.call('down', this, datum());
    }

    function pointerup() {

        if (!_downPointer || _downPointer.id !== (d3_event.pointerId || 'mouse')) return;

        var downPointer = _downPointer;
        _downPointer = null;

        _lastPointerUpEvent = d3_event;

        if (downPointer.isCancelled) return;

        var t2 = +new Date();
        var p2 = downPointer.pointerLocGetter(d3_event);
        var dist = geoVecLength(downPointer.downLoc, p2);

        if (dist < _closeTolerance || (dist < _tolerance && (t2 - downPointer.downTime) < 500)) {
            // Prevent a quick second click
            d3_select(window).on('click.draw-block', function() {
                d3_event.stopPropagation();
            }, true);

            context.map().dblclickZoomEnable(false);

            window.setTimeout(function() {
                context.map().dblclickZoomEnable(true);
                d3_select(window).on('click.draw-block', null);
            }, 500);

            click(p2);
        }
    }

    function pointermove() {
        if (_downPointer &&
            _downPointer.id === (d3_event.pointerId || 'mouse') &&
            !_downPointer.isCancelled) {
            var p2 = _downPointer.pointerLocGetter(d3_event);
            var dist = geoVecLength(_downPointer.downLoc, p2);
            if (dist >= _closeTolerance) {
                _downPointer.isCancelled = true;
                dispatch.call('downcancel', this);
            }
        }

        if ((d3_event.pointerType && d3_event.pointerType !== 'mouse') ||
            d3_event.buttons ||
            _downPointer) return;

        // HACK: Mobile Safari likes to send one or more `mouse` type pointermove
        // events immediately after non-mouse pointerup events; detect and ignore them.
        if (_lastPointerUpEvent &&
            _lastPointerUpEvent.pointerType !== 'mouse' &&
            d3_event.timeStamp - _lastPointerUpEvent.timeStamp < 100) return;

        _lastMouse = d3_event;
        dispatch.call('move', this, datum());
    }

    function pointercancel() {
        if (_downPointer &&
            _downPointer.id === (d3_event.pointerId || 'mouse')) {

            if (!_downPointer.isCancelled) {
                dispatch.call('downcancel', this);
            }
            _downPointer = null;
        }
    }

    function mouseenter() {
        _mouseLeave = false;
    }

    function mouseleave() {
        _mouseLeave = true;
    }

    function allowsVertex(d) {
        return d.geometry(context.graph()) === 'vertex' || presetManager.allowsVertex(d, context.graph());
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
                context.graph().childNodes(target), loc, context.projection, context.activeID()
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

        var currSpace = context.map().mouse();
        if (_disableSpace && _lastSpace) {
            var dist = geoVecLength(_lastSpace, currSpace);
            if (dist > _tolerance) {
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
        context.install(_edit);

        _downPointer = null;

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

        d3_select(window)
            .on(_pointerPrefix + 'up.draw', pointerup, true)
            .on('pointercancel.draw', pointercancel, true);

        d3_select(document)
            .call(keybinding);

        return behavior;
    }


    behavior.off = function(selection) {
        context.ui().sidebar.hover.cancel();
        context.uninstall(_hover);
        context.uninstall(_edit);

        selection
            .on('mouseenter.draw', null)
            .on('mouseleave.draw', null)
            .on(_pointerPrefix + 'down.draw', null)
            .on(_pointerPrefix + 'move.draw', null);

        d3_select(window)
            .on(_pointerPrefix + 'up.draw', null)
            .on('pointercancel.draw', null);
            // note: keyup.space-block, click.draw-block should remain

        d3_select(document)
            .call(keybinding.unbind);
    };


    behavior.hover = function() {
        return _hover;
    };


    return utilRebind(behavior, dispatch, 'on');
}
