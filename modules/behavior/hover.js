import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { osmIsEntity } from '../osm/index';
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
    var dispatch = d3.dispatch('hover'),
        _selection = d3.select(null),
        newId = null,
        buttonDown,
        altDisables,
        target;


    function keydown() {
        if (altDisables && d3.event.keyCode === d3keybinding.modifierCodes.alt) {
            _selection.selectAll('.hover')
                .classed('hover-suppressed', true)
                .classed('hover', false);

            _selection
                .classed('hover-disabled', true);

            dispatch.call('hover', this, null);
        }
    }


    function keyup() {
        if (altDisables && d3.event.keyCode === d3keybinding.modifierCodes.alt) {
            _selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false)
                .classed('hover', true);

            _selection
                .classed('hover-disabled', false);

            dispatch.call('hover', this, target ? target.id : null);
        }
    }


    var hover = function(selection) {
        _selection = selection;
        newId = null;

        _selection
            .on('mouseover.hover', mouseover)
            .on('mouseout.hover', mouseout)
            .on('mousedown.hover', mousedown);

        d3.select(window)
            .on('keydown.hover', keydown)
            .on('keyup.hover', keyup);


        function mouseover() {
            if (buttonDown) return;
            var target = d3.event.target;
            enter(target ? target.__data__ : null);
        }


        function mouseout() {
            if (buttonDown) return;
            var target = d3.event.relatedTarget;
            enter(target ? target.__data__ : null);
        }


        function mousedown() {
            buttonDown = true;
            d3.select(window)
                .on('mouseup.hover', mouseup, true);
        }


        function mouseup() {
            buttonDown = false;
            d3.select(window)
                .on('mouseup.hover', null, true);
        }


        function enter(d) {
            if (d === target) return;
            target = d;

            _selection.selectAll('.hover')
                .classed('hover', false);
            _selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false);

            if (osmIsEntity(target) && target.id !== newId) {

                // If drawing a way, don't hover on a node that was just placed. #3974
                var mode = context.mode() && context.mode().id;
                if ((mode === 'draw-line' || mode === 'draw-area') && !newId && target.type === 'node') {
                    newId = target.id;
                    return;
                }

                var selector = '.' + target.id;

                if (target.type === 'relation') {
                    target.members.forEach(function(member) {
                        selector += ', .' + member.id;
                    });
                }

                var suppressed = altDisables && d3.event && d3.event.altKey;

                _selection.selectAll(selector)
                    .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                dispatch.call('hover', this, !suppressed && target.id);

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

        d3.select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null);
    };


    hover.altDisables = function(_) {
        if (!arguments.length) return altDisables;
        altDisables = _;
        return hover;
    };


    return utilRebind(hover, dispatch, 'on');
}
