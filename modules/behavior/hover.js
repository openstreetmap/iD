import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { osmEntity, osmNote } from '../osm';
import { utilRebind } from '../util/rebind';


/*
   The hover behavior adds the `.hover` class on mouseover to all elements to which
   the identical datum is bound, and removes it on mouseout.

   The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
   representation may consist of several elements scattered throughout the DOM hierarchy.
   Only one of these elements can have the :hover pseudo-class, but all of them will
   have the .hover class.
 */
export function behaviorHover(context) {
    var dispatch = d3_dispatch('hover');
    var _selection = d3_select(null);
    var _newId = null;
    var _buttonDown;
    var _altDisables;
    var _target;


    function keydown() {
        if (_altDisables && d3_event.keyCode === d3_keybinding.modifierCodes.alt) {
            _selection.selectAll('.hover')
                .classed('hover-suppressed', true)
                .classed('hover', false);

            _selection
                .classed('hover-disabled', true);

            dispatch.call('hover', this, null);
        }
    }


    function keyup() {
        if (_altDisables && d3_event.keyCode === d3_keybinding.modifierCodes.alt) {
            _selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false)
                .classed('hover', true);

            _selection
                .classed('hover-disabled', false);

            dispatch.call('hover', this, _target ? _target.id : null);
        }
    }


    var hover = function(selection) {
        _selection = selection;
        _newId = null;

        _selection
            .on('mouseover.hover', mouseover)
            .on('mouseout.hover', mouseout)
            .on('mousedown.hover', mousedown);

        d3_select(window)
            .on('keydown.hover', keydown)
            .on('keyup.hover', keyup);


        function mouseover() {
            if (_buttonDown) return;
            var target = d3_event.target;
            enter(target ? target.__data__ : null);
        }


        function mouseout() {
            if (_buttonDown) return;
            var target = d3_event.relatedTarget;
            enter(target ? target.__data__ : null);
        }


        function mousedown() {
            _buttonDown = true;
            d3_select(window)
                .on('mouseup.hover', mouseup, true);
        }


        function mouseup() {
            _buttonDown = false;
            d3_select(window)
                .on('mouseup.hover', null, true);
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

            // Update hover state and dispatch event
            if (entity && entity.id !== _newId) {
                // If drawing a way, don't hover on a node that was just placed. #3974
                var mode = context.mode() && context.mode().id;
                if ((mode === 'draw-line' || mode === 'draw-area') && !_newId && entity.type === 'node') {
                    _newId = entity.id;
                    return;
                }

                var suppressed = _altDisables && d3_event && d3_event.altKey;
                _selection.selectAll(selector)
                    .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                dispatch.call('hover', this, !suppressed && entity);

            } else {
                dispatch.call('hover', this, null);
            }
        }
    };


    hover.off = function(selection) {
        selection.selectAll('.hover')
            .classed('hover', false);
        selection.selectAll('.hover-suppressed')
            .classed('hover-suppressed', false);
        selection
            .classed('hover-disabled', false);

        selection
            .on('mouseover.hover', null)
            .on('mouseout.hover', null)
            .on('mousedown.hover', null);

        d3_select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null);
    };


    hover.altDisables = function(_) {
        if (!arguments.length) return _altDisables;
        _altDisables = _;
        return hover;
    };


    return utilRebind(hover, dispatch, 'on');
}
