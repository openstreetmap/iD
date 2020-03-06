import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionMoveNode } from '../actions/move_node';
import { actionNoop } from '../actions/noop';
import { behaviorDraw } from './draw';
import { geoChooseEdge, geoHasSelfIntersections } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect } from '../modes/select';
import { osmNode } from '../osm/node';
import { utilKeybinding } from '../util';

export function behaviorDrawWay(context, wayID, index, mode, startGraph, baselineGraph) {

    var origWay = context.entity(wayID);

    var annotation = t((origWay.isDegenerate() ?
        'operations.start.annotation.' :
        'operations.continue.annotation.') + context.geometry(wayID)
    );

    var behavior = behaviorDraw(context);
    behavior.hover().initialNodeID(index ? origWay.nodes[index] :
        (origWay.isClosed() ? origWay.nodes[origWay.nodes.length - 2] : origWay.nodes[origWay.nodes.length - 1]));

    var _tempEdits = 0;

    var end = osmNode({ loc: context.map().mouseCoordinates() });

    // Push an annotated state for undo to return back to.
    // We must make sure to remove this edit later.
    context.pauseChangeDispatch();
    context.perform(actionNoop(), annotation);
    _tempEdits++;

    // Add the drawing node to the graph.
    // We must make sure to remove this edit later.
    context.perform(_actionAddDrawNode());
    _tempEdits++;
    context.resumeChangeDispatch();


    function keydown() {
        if (d3_event.keyCode === utilKeybinding.modifierCodes.alt) {
            if (context.surface().classed('nope')) {
                context.surface()
                    .classed('nope-suppressed', true);
            }
            context.surface()
                .classed('nope', false)
                .classed('nope-disabled', true);
        }
    }


    function keyup() {
        if (d3_event.keyCode === utilKeybinding.modifierCodes.alt) {
            if (context.surface().classed('nope-suppressed')) {
                context.surface()
                    .classed('nope', true);
            }
            context.surface()
                .classed('nope-suppressed', false)
                .classed('nope-disabled', false);
        }
    }


    function allowsVertex(d) {
        return d.geometry(context.graph()) === 'vertex' || context.presets().allowsVertex(d, context.graph());
    }


    // related code
    // - `mode/drag_node.js`     `doMove()`
    // - `behavior/draw.js`      `click()`
    // - `behavior/draw_way.js`  `move()`
    function move(datum) {
        context.surface().classed('nope-disabled', d3_event.altKey);

        var targetLoc = datum && datum.properties && datum.properties.entity && allowsVertex(datum.properties.entity) && datum.properties.entity.loc;
        var targetNodes = datum && datum.properties && datum.properties.nodes;
        var loc = context.map().mouseCoordinates();

        if (targetLoc) {   // snap to node/vertex - a point target with `.loc`
            loc = targetLoc;

        } else if (targetNodes) {   // snap to way - a line target with `.nodes`
            var choice = geoChooseEdge(targetNodes, context.mouse(), context.projection, end.id);
            if (choice) {
                loc = choice.loc;
            }
        }

        context.replace(actionMoveNode(end.id, loc));
        end = context.entity(end.id);
        checkGeometry(false);
    }


    // Check whether this edit causes the geometry to break.
    // If so, class the surface with a nope cursor.
    // `finishDraw` - Only checks the relevant line segments if finishing drawing
    function checkGeometry(finishDraw) {
        var nopeDisabled = context.surface().classed('nope-disabled');
        var isInvalid = isInvalidGeometry(end, context.graph(), finishDraw);

        if (nopeDisabled) {
            context.surface()
                .classed('nope', false)
                .classed('nope-suppressed', isInvalid);
        } else {
            context.surface()
                .classed('nope', isInvalid)
                .classed('nope-suppressed', false);
        }
    }


    function isInvalidGeometry(entity, graph, finishDraw) {
        var parents = graph.parentWays(entity);

        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];
            var nodes = graph.childNodes(parent).slice();  // shallow copy

            if (origWay.isClosed()) { // Check if Area
                if (finishDraw) {
                    if (nodes.length < 3) return false;
                    nodes.splice(-2, 1);
                    entity = nodes[nodes.length-2];
                } else {
                    nodes.pop();
                }
            } else { // Line
                if (finishDraw) {
                    nodes.pop();
                }
            }

            if (geoHasSelfIntersections(nodes, entity.id)) {
                return true;
            }
        }

        return false;
    }


    function undone() {
        context.pauseChangeDispatch();
        // Undo popped the history back to the initial annotated no-op edit.
        _tempEdits = 0;     // We will deal with the temp edits here
        context.pop(1);     // Remove initial no-op edit

        if (context.graph() === baselineGraph) {    // We've undone back to the beginning
            // baselineGraph may be behind startGraph if this way was added rather than continued
            resetToStartGraph();
            context.resumeChangeDispatch();
            context.enter(modeSelect(context, [wayID]));
        } else {
            // Remove whatever segment was drawn previously and continue drawing
            context.pop(1);
            context.resumeChangeDispatch();
            context.enter(mode);
        }
    }


    function setActiveElements() {
        context.surface().selectAll('.' + end.id)
            .classed('active', true);
    }


    function resetToStartGraph() {
        while (context.graph() !== startGraph) {
            context.pop();
        }
    }


    var drawWay = function(surface) {
        behavior
            .on('move', move)
            .on('click', drawWay.add)
            .on('clickWay', drawWay.addWay)
            .on('clickNode', drawWay.addNode)
            .on('undo', context.undo)
            .on('cancel', drawWay.cancel)
            .on('finish', drawWay.finish);

        d3_select(window)
            .on('keydown.drawWay', keydown)
            .on('keyup.drawWay', keyup);

        context.map()
            .dblclickZoomEnable(false)
            .on('drawn.draw', setActiveElements);

        setActiveElements();

        surface.call(behavior);

        context.history()
            .on('undone.draw', undone);
    };


    drawWay.off = function(surface) {
        // Drawing was interrupted unexpectedly.
        // This can happen if the user changes modes,
        // clicks geolocate button, a hashchange event occurs, etc.
        if (_tempEdits) {
            context.pauseChangeDispatch();
            context.pop(_tempEdits);
            resetToStartGraph();
            context.resumeChangeDispatch();
        }

        context.map()
            .on('drawn.draw', null);

        surface.call(behavior.off)
            .selectAll('.active')
            .classed('active', false);

        surface
            .classed('nope', false)
            .classed('nope-suppressed', false)
            .classed('nope-disabled', false);

        d3_select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null);

        context.history()
            .on('undone.draw', null);
    };


    function _actionAddDrawNode() {
        return function(graph) {
            return graph
                .replace(end)
                .replace(origWay.addNode(end.id, index));
        };
    }


    function _actionReplaceDrawNode(newNode) {
        return function(graph) {
            return graph
                .replace(origWay.addNode(newNode.id, index))
                .remove(end);
        };
    }


    // Accept the current position of the drawing node and continue drawing.
    drawWay.add = function(loc, d) {
        if ((d && d.properties && d.properties.nope) || context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        context.pop(_tempEdits);
        _tempEdits = 0;

        context.perform(
            _actionAddDrawNode(),
            annotation
        );

        context.resumeChangeDispatch();
        checkGeometry(false);   // finishDraw = false
        context.enter(mode);
    };


    // Connect the way to an existing way.
    drawWay.addWay = function(loc, edge, d) {
        if ((d && d.properties && d.properties.nope) || context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        context.pop(_tempEdits);
        _tempEdits = 0;

        context.perform(
            _actionAddDrawNode(),
            actionAddMidpoint({ loc: loc, edge: edge }, end),
            annotation
        );

        context.resumeChangeDispatch();
        checkGeometry(false);   // finishDraw = false
        context.enter(mode);
    };


    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node, d) {
        if ((d && d.properties && d.properties.nope) || context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        context.pop(_tempEdits);
        _tempEdits = 0;

        context.perform(
            _actionReplaceDrawNode(node),
            annotation
        );

        context.resumeChangeDispatch();
        checkGeometry(false);   // finishDraw = false
        context.enter(mode);
    };


    // Finish the draw operation, removing the temporary edits.
    // If the way has enough nodes to be valid, it's selected.
    // Otherwise, delete everything and return to browse mode.
    drawWay.finish = function() {
        checkGeometry(true);   // finishDraw = true
        if (context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        context.pop(_tempEdits);
        _tempEdits = 0;

        var way = context.hasEntity(wayID);
        if (!way || way.isDegenerate()) {
            drawWay.cancel();
            return;
        }

        context.resumeChangeDispatch();

        window.setTimeout(function() {
            context.map().dblclickZoomEnable(true);
        }, 1000);

        var isNewFeature = !mode.isContinuing;
        context.enter(modeSelect(context, [wayID]).newFeature(isNewFeature));
    };


    // Cancel the draw operation, delete everything, and return to browse mode.
    drawWay.cancel = function() {
        context.pauseChangeDispatch();
        context.pop(_tempEdits);
        _tempEdits = 0;

        resetToStartGraph();
        context.resumeChangeDispatch();

        window.setTimeout(function() {
            context.map().dblclickZoomEnable(true);
        }, 1000);

        context.surface()
            .classed('nope', false)
            .classed('nope-disabled', false)
            .classed('nope-suppressed', false);

        context.enter(modeBrowse(context));
    };


    drawWay.activeID = function() {
        if (!arguments.length) return end.id;
        // no assign
        return drawWay;
    };


    drawWay.tail = function(text) {
        behavior.tail(text);
        return drawWay;
    };


    return drawWay;
}
