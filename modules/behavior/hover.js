import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { osmEntity, osmNote, QAItem } from '../osm';
import { utilKeybinding, utilRebind } from '../util';

/*
   The hover behavior adds the `.hover` class on pointerover to all elements to which
   the identical datum is bound, and removes it on pointerout.

   The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
   representation may consist of several elements scattered throughout the DOM hierarchy.
   Only one of these elements can have the :hover pseudo-class, but all of them will
   have the .hover class.
 */
export function behaviorHover(context) {
    var dispatch = d3_dispatch('hover');
    var _selection = d3_select(null);
    var _newNodeId = null;
    var _initialNodeID = null;
    var _buttonDown;
    var _altDisables;
    var _ignoreVertex;
    var _target;

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';


    function keydown() {
        if (_altDisables && d3_event.keyCode === utilKeybinding.modifierCodes.alt) {
            _selection.selectAll('.hover')
                .classed('hover-suppressed', true)
                .classed('hover', false);

            _selection
                .classed('hover-disabled', true);

            dispatch.call('hover', this, null);
        }
    }


    function keyup() {
        if (_altDisables && d3_event.keyCode === utilKeybinding.modifierCodes.alt) {
            _selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false)
                .classed('hover', true);

            _selection
                .classed('hover-disabled', false);

            dispatch.call('hover', this, _target ? _target.id : null);
        }
    }


    function behavior(selection) {
        _selection = selection;

        if (_initialNodeID) {
            _newNodeId = _initialNodeID;
            _initialNodeID = null;
        } else {
            _newNodeId = null;
        }

        _selection
            .on(_pointerPrefix + 'over.hover', pointerover)
            .on(_pointerPrefix + 'out.hover', pointerout)
            .on(_pointerPrefix + 'down.hover', pointerdown);

        d3_select(window)
            .on('keydown.hover', keydown)
            .on('keyup.hover', keyup);


        function pointerover() {
            if (_buttonDown) return;
            var target = d3_event.target;
            enter(target ? target.__data__ : null);
        }


        function pointerout() {
            if (_buttonDown) return;
            var target = d3_event.relatedTarget;
            enter(target ? target.__data__ : null);
        }


        function pointerdown() {
            _buttonDown = true;
            d3_select(window)
                .on(_pointerPrefix + 'up.hover', pointerup, true);
        }


        function pointerup() {
            _buttonDown = false;
            d3_select(window)
                .on(_pointerPrefix + 'up.hover', null, true);
        }

        function allowsVertex(d) {
            return d.geometry(context.graph()) === 'vertex' || context.presets().allowsVertex(d, context.graph());
        }

        function modeAllowsHover(target) {
            var mode = context.mode();
            if (mode.id === 'add-point') {
                return mode.preset.matchGeometry('vertex') ||
                    (target.type !== 'way' && target.geometry(context.graph()) !== 'vertex');
            }
            return true;
        }

        function enter(datum) {
            if (datum === _target) return;
            _target = datum;

            _selection.selectAll('.hover')
                .classed('hover', false);
            _selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false);

            // What are we hovering over?
            var entity, selector;
            if (datum && datum.__featurehash__) {
                entity = datum;
                selector = '.data' + datum.__featurehash__;

            } else if (datum instanceof QAItem) {
                entity = datum;
                selector = '.' + datum.service + '.itemId-' + datum.id;

            } else if (datum instanceof osmNote) {
                entity = datum;
                selector = '.note-' + datum.id;

            } else if (datum instanceof osmEntity) {
                entity = datum;
                selector = '.' + entity.id;
                if (entity.type === 'relation') {
                    entity.members.forEach(function(member) { selector += ', .' + member.id; });
                }
            } else if (datum && datum.properties && (datum.properties.entity instanceof osmEntity)) {
                entity = datum.properties.entity;
                selector = '.' + entity.id;
                if (entity.type === 'relation') {
                    entity.members.forEach(function(member) { selector += ', .' + member.id; });
                }
            }

            var mode = context.mode();

            // Update hover state and dispatch event
            if (entity && entity.id !== _newNodeId) {
                // If drawing a way, don't hover on a node that was just placed. #3974

                if ((mode.id === 'draw-line' || mode.id === 'draw-area') && !_newNodeId && entity.type === 'node') {
                    _newNodeId = entity.id;
                    return;
                }

                var suppressed = (_altDisables && d3_event && d3_event.altKey) ||
                    (entity.type === 'node' && _ignoreVertex && !allowsVertex(entity)) ||
                    !modeAllowsHover(entity);
                _selection.selectAll(selector)
                    .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                dispatch.call('hover', this, !suppressed && entity);

            } else {
                dispatch.call('hover', this, null);
            }
        }
    }


    behavior.off = function(selection) {
        selection.selectAll('.hover')
            .classed('hover', false);
        selection.selectAll('.hover-suppressed')
            .classed('hover-suppressed', false);
        selection
            .classed('hover-disabled', false);

        selection
            .on(_pointerPrefix + 'over.hover', null)
            .on(_pointerPrefix + 'out.hover', null)
            .on(_pointerPrefix + 'down.hover', null);

        d3_select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null);
    };


    behavior.altDisables = function(val) {
        if (!arguments.length) return _altDisables;
        _altDisables = val;
        return behavior;
    };

    behavior.ignoreVertex = function(val) {
        if (!arguments.length) return _ignoreVertex;
        _ignoreVertex = val;
        return behavior;
    };

    behavior.initialNodeID = function(nodeId) {
        _initialNodeID = nodeId;
        return behavior;
    };

    return utilRebind(behavior, dispatch, 'on');
}
