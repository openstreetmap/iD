import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
import { t } from '../core/localizer';
import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionMoveNode } from '../actions/move_node';
import { actionNoop } from '../actions/noop';
import { behaviorDraw } from './draw';
import { geoChooseEdge, geoHasSelfIntersections } from '../geo';
import { osmNode } from '../osm/node';
import { utilRebind } from '../util/rebind';
import { utilKeybinding } from '../util';

export function behaviorDrawWay(context, wayID, index, startGraph) {

    var dispatch = d3_dispatch(
        // completed the drawing session
        'finish',
        // aborted the drawing session; graph was reset
        'revert',

        // this particular segment is complete; drawing should continue
        'doneSegment',

        // the drawing of a self-intersecting way was attempted but not performed
        'rejectedSelfIntersection'
    );

    var _origWay = context.entity(wayID);

    var _annotation = t((_origWay.isDegenerate() ?
        'operations.start.annotation.' :
        'operations.continue.annotation.') + _origWay.geometry(context.graph())
    );

    var behavior = behaviorDraw(context);
    behavior.hover().initialNodeID(index ? _origWay.nodes[index] :
        (_origWay.isClosed() ? _origWay.nodes[_origWay.nodes.length - 2] : _origWay.nodes[_origWay.nodes.length - 1]));

    // The osmNode to be placed.
    // This is temporary and just follows the mouse cursor until an "add" event occurs.
    var _drawNode;

    function createDrawNode(loc) {
        // don't make the draw node until we actually need it
        _drawNode = osmNode({ loc: loc });

        context.pauseChangeDispatch();
        context.replace(function actionAddDrawNode(graph) {
            // add the draw node to the graph and insert it into the way
            var way = graph.entity(wayID);
            return graph
                .replace(_drawNode)
                .replace(way.addNode(_drawNode.id, index));
        }, _annotation);
        context.resumeChangeDispatch();

        setActiveElements();
    }

    function removeDrawNode() {

        context.pauseChangeDispatch();
        context.replace(
            function actionDeleteDrawNode(graph) {
               var way = graph.entity(wayID);
               return graph
                   .replace(way.removeNode(_drawNode.id))
                   .remove(_drawNode);
           },
            _annotation
        );
        _drawNode = undefined;
        context.resumeChangeDispatch();
    }

    var _didResolveTempEdit = false;

    // Push an annotated state for undo to return back to.
    // We must make sure to replace or remove it later.
    context.pauseChangeDispatch();
    context.perform(actionNoop(), _annotation);
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
        return d.geometry(context.graph()) === 'vertex' || presetManager.allowsVertex(d, context.graph());
    }


    // related code
    // - `mode/drag_node.js`     `doMove()`
    // - `behavior/draw.js`      `click()`
    // - `behavior/draw_way.js`  `move()`
    function move(datum) {

        var loc = context.map().mouseCoordinates();

        if (!_drawNode) createDrawNode(loc);

        context.surface().classed('nope-disabled', d3_event.altKey);

        var targetLoc = datum && datum.properties && datum.properties.entity &&
            allowsVertex(datum.properties.entity) && datum.properties.entity.loc;
        var targetNodes = datum && datum.properties && datum.properties.nodes;

        if (targetLoc) {   // snap to node/vertex - a point target with `.loc`
            loc = targetLoc;

        } else if (targetNodes) {   // snap to way - a line target with `.nodes`
            var choice = geoChooseEdge(targetNodes, context.map().mouse(), context.projection, _drawNode.id);
            if (choice) {
                loc = choice.loc;
            }
        }

        context.replace(actionMoveNode(_drawNode.id, loc), _annotation);
        _drawNode = context.entity(_drawNode.id);
        checkGeometry(true /* includeDrawNode */);
    }


    // Check whether this edit causes the geometry to break.
    // If so, class the surface with a nope cursor.
    // `includeDrawNode` - Only check the relevant line segments if finishing drawing
    function checkGeometry(includeDrawNode) {
        var nopeDisabled = context.surface().classed('nope-disabled');
        var isInvalid = isInvalidGeometry(includeDrawNode);

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


    function isInvalidGeometry(includeDrawNode) {

        var testNode = _drawNode;

        // we only need to test the single way we're drawing
        var parentWay = context.graph().entity(wayID);
        var nodes = context.graph().childNodes(parentWay).slice();  // shallow copy

        if (includeDrawNode) {
            if (parentWay.isClosed()) {
                // don't test the last segment for closed ways - #4655
                // (still test the first segement)
                nodes.pop();
            }
        } else { // discount the draw node

            if (parentWay.isClosed()) {
                if (nodes.length < 3) return false;
                if (_drawNode) nodes.splice(-2, 1);
                testNode = nodes[nodes.length - 2];
            } else {
                // there's nothing we need to test if we ignore the draw node on open ways
                return false;
            }
        }

        return testNode && geoHasSelfIntersections(nodes, testNode.id);
    }


    function undone() {

        // undoing removed the temp edit
        _didResolveTempEdit = true;

        context.pauseChangeDispatch();

        var shouldContinue = false;

        if (context.graph() !== startGraph) { // not yet at the beginning
            context.history()
                .on('undone.draw', null);
            // remove whatever segment was drawn previously
            context.undo();

            if (context.graph() !== startGraph) { // not yet at the beginning
                // continue drawing
                shouldContinue = true;
            }
        }

        // clear the redo stack by adding and removing an edit
        context.perform(actionNoop());
        context.pop(1);

        context.resumeChangeDispatch();

        if (shouldContinue) {
            dispatch.call('doneSegment', this);
        } else {
            dispatch.call('finish', this);
        }
    }


    function setActiveElements() {
        if (!_drawNode) return;

        context.surface().selectAll('.' + _drawNode.id)
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
            .on('cancel', drawWay.revert)
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

        if (!_didResolveTempEdit) {
            // Drawing was interrupted unexpectedly.
            // This can happen if the user changes modes,
            // clicks geolocate button, a hashchange event occurs, etc.

            context.pauseChangeDispatch();
            resetToStartGraph();
            context.resumeChangeDispatch();
        }

        context.map()
            .dblclickZoomEnable(true)
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


    function attemptAdd(d, loc, doAdd) {
        var didJustAddDrawNode = false;
        if (_drawNode) {
            // move the node to the final loc in case move wasn't called
            // consistently (e.g. on touch devices)
            context.replace(actionMoveNode(_drawNode.id, loc), _annotation);
            _drawNode = context.entity(_drawNode.id);
        } else {
            createDrawNode(loc);
            didJustAddDrawNode = true;
        }

        checkGeometry(true /* includeDrawNode */);
        if ((d && d.properties && d.properties.nope) || context.surface().classed('nope')) {
            if (didJustAddDrawNode) {
                // prevent the temporary draw node from appearing on touch devices
                removeDrawNode();
            }
            dispatch.call('rejectedSelfIntersection', this);
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        var finalNode = doAdd();
        // we just replaced the temporary edit with the real one
        _didResolveTempEdit = true;
        context.resumeChangeDispatch();

        dispatch.call('doneSegment', this, context.entity(finalNode.id));
    }


    // Accept the current position of the drawing node
    drawWay.add = function(loc, d) {
        attemptAdd(d, loc, function() {
            // don't need to do anything extra
            return _drawNode;
        });
    };


    // Connect the way to an existing way
    drawWay.addWay = function(loc, edge, d) {
        attemptAdd(d, loc, function() {
            context.replace(
                actionAddMidpoint({ loc: loc, edge: edge }, _drawNode),
                _annotation
            );
            return _drawNode;
        });
    };


    // Connect the way to an existing node
    drawWay.addNode = function(node, d) {
        attemptAdd(d, node.loc, function() {
            context.replace(
                function actionReplaceDrawNode(graph) {
                    // remove the temporary draw node and insert the existing node
                    // at the same index

                    graph = graph
                        .replace(graph.entity(wayID).removeNode(_drawNode.id))
                        .remove(_drawNode);
                    return graph
                        .replace(graph.entity(wayID).addNode(node.id, index));
                },
                _annotation
            );
            return node;
        });
    };


    // Finish the draw operation, removing the temporary edit.
    // If the way has enough nodes to be valid, it's selected.
    // Otherwise, delete everything and return to browse mode.
    drawWay.finish = function() {
        checkGeometry(false /* includeDrawNode */);
        if (context.surface().classed('nope')) {
            dispatch.call('rejectedSelfIntersection', this);
            return false;   // can't click here
        }

        context.pauseChangeDispatch();
        // remove the temporary edit
        context.pop(1);
        _didResolveTempEdit = true;
        context.resumeChangeDispatch();

        var way = context.hasEntity(wayID);
        if (!way || way.isDegenerate()) {
            drawWay.revert();
            return true;
        }

        dispatch.call('finish', this);

        return true;
    };


    // Cancel drawing and reset everything from this draw session
    drawWay.revert = function() {
        context.pauseChangeDispatch();
        resetToStartGraph();
        context.resumeChangeDispatch();

        context.surface()
            .classed('nope', false)
            .classed('nope-disabled', false)
            .classed('nope-suppressed', false);

        dispatch.call('revert', this);
    };


    drawWay.activeID = function() {
        if (!arguments.length) return _drawNode && _drawNode.id;
        // no assign
        return drawWay;
    };


    drawWay.tail = function(text) {
        behavior.tail(text);
        return drawWay;
    };


    return utilRebind(drawWay, dispatch, 'on');
}
