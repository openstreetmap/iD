import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
import { t } from '../core/localizer';
import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionMoveNode } from '../actions/move_node';
import { actionNoop } from '../actions/noop';
import { behaviorDraw } from './draw';
import { geoChooseEdge, geoHasSelfIntersections } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect } from '../modes/select';
import { osmNode } from '../osm/node';
import { utilRebind } from '../util/rebind';
import { utilKeybinding } from '../util';

export function behaviorDrawWay(context, wayID, mode, startGraph) {
    const keybinding = utilKeybinding('drawWay');

    var dispatch = d3_dispatch('rejectedSelfIntersection');

    var behavior = behaviorDraw(context);

    // Must be set by `drawWay.nodeIndex` before each install of this behavior.
    var _nodeIndex;

    var _origWay;
    var _wayGeometry;
    var _headNodeID;
    var _annotation;

    var _pointerHasMoved = false;

    // The osmNode to be placed.
    // This is temporary and just follows the mouse cursor until an "add" event occurs.
    var _drawNode;

    var _didResolveTempEdit = false;

    function createDrawNode(loc) {
        // don't make the draw node until we actually need it
        _drawNode = osmNode({ loc: loc });

        context.pauseChangeDispatch();
        context.replace(function actionAddDrawNode(graph) {
            // add the draw node to the graph and insert it into the way
            var way = graph.entity(wayID);
            return graph
                .replace(_drawNode)
                .replace(way.addNode(_drawNode.id, _nodeIndex));
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


    function keydown(d3_event) {
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


    function keyup(d3_event) {
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
    function move(d3_event, datum) {

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
                // (still test the first segment)
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

        var nextMode;

        if (context.graph() === startGraph) {
            // We've undone back to the initial state before we started drawing.
            // Just exit the draw mode without undoing whatever we did before
            // we entered the draw mode.
            nextMode = modeSelect(context, [wayID]);
        } else {
            // The `undo` only removed the temporary edit, so here we have to
            // manually undo to actually remove the last node we added. We can't
            // use the `undo` function since the initial "add" graph doesn't have
            // an annotation and so cannot be undone to.
            context.pop(1);

            // continue drawing
            nextMode = mode;
        }

        // clear the redo stack by adding and removing a blank edit
        context.perform(actionNoop());
        context.pop(1);

        context.resumeChangeDispatch();
        context.enter(nextMode);
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
        _drawNode = undefined;
        _didResolveTempEdit = false;
        _origWay = context.entity(wayID);

        if (typeof _nodeIndex === 'number') {
            _headNodeID = _origWay.nodes[_nodeIndex];
        } else if (_origWay.isClosed()) {
            _headNodeID = _origWay.nodes[_origWay.nodes.length - 2];
        } else {
            _headNodeID = _origWay.nodes[_origWay.nodes.length - 1];
        }

        _wayGeometry = _origWay.geometry(context.graph());
        _annotation = t((_origWay.nodes.length === (_origWay.isClosed() ? 2 : 1) ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + _wayGeometry
        );
        _pointerHasMoved = false;

        // Push an annotated state for undo to return back to.
        // We must make sure to replace or remove it later.
        context.pauseChangeDispatch();
        context.perform(actionNoop(), _annotation);
        context.resumeChangeDispatch();

        behavior.hover()
            .initialNodeID(_headNodeID);

        behavior
            .on('move', function() {
                _pointerHasMoved = true;
                move.apply(this, arguments);
            })
            .on('down', function() {
                move.apply(this, arguments);
            })
            .on('downcancel', function() {
                if (_drawNode) removeDrawNode();
            })
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

        if (!_didResolveTempEdit) {
            // Drawing was interrupted unexpectedly.
            // This can happen if the user changes modes,
            // clicks geolocate button, a hashchange event occurs, etc.

            context.pauseChangeDispatch();
            resetToStartGraph();
            context.resumeChangeDispatch();
        }

        _drawNode = undefined;
        _nodeIndex = undefined;

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
            .on('keydown.drawWay', null)
            .on('keyup.drawWay', null);

        context.history()
            .on('undone.draw', null);
    };


    function attemptAdd(d, loc, doAdd) {

        if (_drawNode) {
            // move the node to the final loc in case move wasn't called
            // consistently (e.g. on touch devices)
            context.replace(actionMoveNode(_drawNode.id, loc), _annotation);
            _drawNode = context.entity(_drawNode.id);
        } else {
            createDrawNode(loc);
        }

        checkGeometry(true /* includeDrawNode */);
        if ((d && d.properties && d.properties.nope) || context.surface().classed('nope')) {
            if (!_pointerHasMoved) {
                // prevent the temporary draw node from appearing on touch devices
                removeDrawNode();
            }
            dispatch.call('rejectedSelfIntersection', this);
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        doAdd();
        // we just replaced the temporary edit with the real one
        _didResolveTempEdit = true;
        context.resumeChangeDispatch();

        context.enter(mode);
    }


    // Accept the current position of the drawing node
    drawWay.add = function(loc, d) {
        attemptAdd(d, loc, function() {
            // don't need to do anything extra
        });
    };


    // Connect the way to an existing way
    drawWay.addWay = function(loc, edge, d) {
        attemptAdd(d, loc, function() {
            context.replace(
                actionAddMidpoint({ loc: loc, edge: edge }, _drawNode),
                _annotation
            );
        });
    };


    // Connect the way to an existing node
    drawWay.addNode = function(node, d) {

        // finish drawing if the mapper targets the prior node
        if (node.id === _headNodeID ||
            // or the first node when drawing an area
            (_origWay.isClosed() && node.id === _origWay.first())) {
            drawWay.finish();
            return;
        }

        attemptAdd(d, node.loc, function() {
            context.replace(
                function actionReplaceDrawNode(graph) {
                    // remove the temporary draw node and insert the existing node
                    // at the same index

                    graph = graph
                        .replace(graph.entity(wayID).removeNode(_drawNode.id))
                        .remove(_drawNode);
                    return graph
                        .replace(graph.entity(wayID).addNode(node.id, _nodeIndex));
                },
                _annotation
            );
        });
    };

    /**
     * @param {(typeof osmWay)[]} ways
     * @returns {"line" | "area" | "generic"}
     */
    function getFeatureType(ways) {
        if (ways.every(way => way.isClosed())) return 'area';
        if (ways.every(way => !way.isClosed())) return 'line';
        return 'generic';
    }

    /** see PR #8671 */
    function followMode() {
        if (_didResolveTempEdit) return;

        try {

            // get the last 2 added nodes.
            // check if they are both part of only oneway (the same one)
            // check if the ways that they're part of are the same way
            // find index of the last two nodes, to determine the direction to travel around the existing way
            // add the next node to the way we are drawing

            // if we're drawing an area, the first node = last node.
            const isDrawingArea = _origWay.nodes[0] === _origWay.nodes.slice(-1)[0];

            const [secondLastNodeId, lastNodeId] = _origWay.nodes.slice(isDrawingArea ? -3 : -2);

            // Unlike startGraph, the full history graph may contain unsaved vertices to follow.
            // https://github.com/openstreetmap/iD/issues/8749
            const historyGraph = context.history().graph();
            if (!lastNodeId || !secondLastNodeId || !historyGraph.hasEntity(lastNodeId) || !historyGraph.hasEntity(secondLastNodeId)) {
                context.ui().flash
                    .duration(4000)
                    .iconName('#iD-icon-no')
                    .label(t.append('operations.follow.error.needs_more_initial_nodes'))();
                return;
            }

            // If the way has looped over itself, follow some other way.
            const lastNodesParents = historyGraph.parentWays(historyGraph.entity(lastNodeId)).filter(w => w.id !== wayID);
            const secondLastNodesParents = historyGraph.parentWays(historyGraph.entity(secondLastNodeId)).filter(w => w.id !== wayID);

            const featureType = getFeatureType(lastNodesParents);

            if (lastNodesParents.length !== 1 || secondLastNodesParents.length === 0) {
                context.ui().flash
                    .duration(4000)
                    .iconName('#iD-icon-no')
                    .label(t.append(`operations.follow.error.intersection_of_multiple_ways.${featureType}`))();
                return;
            }

            // Check if the last node's parent is also the parent of the second last node.
            // The last node must only have one parent, but the second last node can have
            // multiple parents.
            if (!secondLastNodesParents.some(n => n.id === lastNodesParents[0].id)) {
                context.ui().flash
                    .duration(4000)
                    .iconName('#iD-icon-no')
                    .label(t.append(`operations.follow.error.intersection_of_different_ways.${featureType}`))();
                return;
            }

            const way = lastNodesParents[0];

            const indexOfLast = way.nodes.indexOf(lastNodeId);
            const indexOfSecondLast = way.nodes.indexOf(secondLastNodeId);

            // for a closed way, the first/last node is the same so it appears twice in the array,
            // but indexOf always finds the first occurrence. This is only an issue when following a way
            // in descending order
            const isDescendingPastZero = indexOfLast === way.nodes.length - 2 && indexOfSecondLast === 0;

            let nextNodeIndex = indexOfLast + (indexOfLast > indexOfSecondLast && !isDescendingPastZero ? 1 : -1);
            // if we're following a closed way and we pass the first/last node, the  next index will be -1
            if (nextNodeIndex === -1) nextNodeIndex = indexOfSecondLast === 1 ? way.nodes.length - 2 : 1;

            const nextNode = historyGraph.entity(way.nodes[nextNodeIndex]);

            drawWay.addNode(nextNode, {
                geometry: { type: 'Point', coordinates: nextNode.loc },
                id: nextNode.id,
                properties: { target: true, entity: nextNode },
            });
        } catch (ex) {
            context.ui().flash
                .duration(4000)
                .iconName('#iD-icon-no')
                .label(t.append('operations.follow.error.unknown'))();
        }
    }

    keybinding.on(t('operations.follow.key'), followMode);
    d3_select(document).call(keybinding);

    // Finish the draw operation, removing the temporary edit.
    // If the way has enough nodes to be valid, it's selected.
    // Otherwise, delete everything and return to browse mode.
    drawWay.finish = function() {
        checkGeometry(false /* includeDrawNode */);
        if (context.surface().classed('nope')) {
            dispatch.call('rejectedSelfIntersection', this);
            return;   // can't click here
        }

        context.pauseChangeDispatch();
        // remove the temporary edit
        context.pop(1);
        _didResolveTempEdit = true;
        context.resumeChangeDispatch();

        var way = context.hasEntity(wayID);
        if (!way || way.isDegenerate()) {
            drawWay.cancel();
            return;
        }

        window.setTimeout(function() {
            context.map().dblclickZoomEnable(true);
        }, 1000);

        var isNewFeature = !mode.isContinuing;
        context.enter(modeSelect(context, [wayID]).newFeature(isNewFeature));
    };


    // Cancel the draw operation, delete everything, and return to browse mode.
    drawWay.cancel = function() {
        context.pauseChangeDispatch();
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


    drawWay.nodeIndex = function(val) {
        if (!arguments.length) return _nodeIndex;
        _nodeIndex = val;
        return drawWay;
    };


    drawWay.activeID = function() {
        if (!arguments.length) return _drawNode && _drawNode.id;
        // no assign
        return drawWay;
    };


    return utilRebind(drawWay, dispatch, 'on');
}
