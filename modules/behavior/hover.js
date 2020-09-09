import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
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
    var _altDisables;
    var _ignoreVertex;
    var _targets = [];

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

            dispatch.call('hover', this, _targets);
        }
    }


    function behavior(selection) {
        _selection = selection;

        _targets = [];

        if (_initialNodeID) {
            _newNodeId = _initialNodeID;
            _initialNodeID = null;
        } else {
            _newNodeId = null;
        }

        _selection
            .on(_pointerPrefix + 'over.hover', pointerover)
            .on(_pointerPrefix + 'out.hover', pointerout)
            // treat pointerdown as pointerover for touch devices
            .on(_pointerPrefix + 'down.hover', pointerover);

        d3_select(window)
            .on(_pointerPrefix + 'up.hover pointercancel.hover', pointerout, true)
            .on('keydown.hover', keydown)
            .on('keyup.hover', keyup);


        function eventTarget() {
            var datum = d3_event.target && d3_event.target.__data__;
            if (typeof datum !== 'object') return null;
            if (!(datum instanceof osmEntity) && datum.properties && (datum.properties.entity instanceof osmEntity)) {
                return datum.properties.entity;
            }
            return datum;
        }

        function pointerover() {
            // ignore mouse hovers with buttons pressed unless dragging
            if (context.mode().id.indexOf('drag') === -1 &&
                (!d3_event.pointerType || d3_event.pointerType === 'mouse') &&
                d3_event.buttons) return;

            var target = eventTarget();
            if (target && _targets.indexOf(target) === -1) {
                _targets.push(target);
                updateHover(_targets);
            }
        }

        function pointerout() {

            var target = eventTarget();
            var index = _targets.indexOf(target);
            if (index !== -1) {
                _targets.splice(index);
                updateHover(_targets);
            }
        }

        function allowsVertex(d) {
            return d.geometry(context.graph()) === 'vertex' || presetManager.allowsVertex(d, context.graph());
        }

        function modeAllowsHover(target) {
            var mode = context.mode();
            if (mode.id === 'add-point') {
                return mode.preset.matchGeometry('vertex') ||
                    (target.type !== 'way' && target.geometry(context.graph()) !== 'vertex');
            }
            return true;
        }

        function updateHover(targets) {

            _selection.selectAll('.hover')
                .classed('hover', false);
            _selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false);

            var mode = context.mode();

            if (!_newNodeId && (mode.id === 'draw-line' || mode.id === 'draw-area')) {
                var node = targets.find(function(target) {
                    return target instanceof osmEntity && target.type === 'node';
                });
                _newNodeId = node && node.id;
            }

            targets = targets.filter(function(datum) {
                if (datum instanceof osmEntity) {
                    // If drawing a way, don't hover on a node that was just placed. #3974
                    return datum.id !== _newNodeId &&
                        (datum.type !== 'node' || !_ignoreVertex || allowsVertex(datum)) &&
                        modeAllowsHover(datum);
                }
                return true;
            });

            var selector = '';

            for (var i in targets) {
                var datum = targets[i];

                // What are we hovering over?
                if (datum.__featurehash__) {
                    // hovering custom data
                    selector += ', .data' + datum.__featurehash__;

                } else if (datum instanceof QAItem) {
                    selector += ', .' + datum.service + '.itemId-' + datum.id;

                } else if (datum instanceof osmNote) {
                    selector += ', .note-' + datum.id;

                } else if (datum instanceof osmEntity) {
                    selector += ', .' + datum.id;
                    if (datum.type === 'relation') {
                        for (var j in datum.members) {
                            selector += ', .' + datum.members[j].id;
                        }
                    }
                }
            }

            var suppressed = _altDisables && d3_event && d3_event.altKey;

            if (selector.trim().length) {
                // remove the first comma
                selector = selector.slice(1);
                _selection.selectAll(selector)
                    .classed(suppressed ? 'hover-suppressed' : 'hover', true);
            }

            dispatch.call('hover', this, !suppressed && targets);
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
            .on(_pointerPrefix + 'up.hover pointercancel.hover', null, true)
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
