import { t } from '../util/locale';

import {
    actionAddMidpoint,
    actionMoveNode,
    actionNoop
} from '../actions';

import { behaviorDraw } from './draw';
import { geoChooseEdge, geoHasSelfIntersections } from '../geo';
import { modeBrowse, modeSelect } from '../modes';
import { osmNode } from '../osm';


export function behaviorDrawWay(context, wayId, index, mode, startGraph) {
    var origWay = context.entity(wayId);
    var annotation = t((origWay.isDegenerate() ?
        'operations.start.annotation.' :
        'operations.continue.annotation.') + context.geometry(wayId)
    );
    var behavior = behaviorDraw(context);
    var _tempEdits = 0;

    var end = osmNode({ loc: context.map().mouseCoordinates() });

    // Push an annotated state for undo to return back to.
    // We must make sure to remove this edit later.
    context.perform(actionNoop(), annotation);
    _tempEdits++;

    // Add the drawing node to the graph.
    // We must make sure to remove this edit later.
    context.perform(_actionAddDrawNode());
    _tempEdits++;


    // related code
    // - `mode/drag_node.js`     `doMode()`
    // - `behavior/draw.js`      `click()`
    // - `behavior/draw_way.js`  `move()`
    function move(datum) {
        var nodeGroups = datum && datum.properties && datum.properties.nodes;
        var loc = context.map().mouseCoordinates();

        if (datum.loc) {   // snap to node/vertex - a real entity or a nope target with a `loc`
            loc = datum.loc;

        } else if (nodeGroups) {   // snap to way - a line touch target or nope target with nodes
            var best = Infinity;
            for (var i = 0; i < nodeGroups.length; i++) {
                var childNodes = nodeGroups[i].map(function(id) { return context.entity(id); });
                var choice = geoChooseEdge(childNodes, context.mouse(), context.projection, end.id);
                if (choice && choice.distance < best) {
                    best = choice.distance;
                    loc = choice.loc;
                }
            }
        }

        context.replace(actionMoveNode(end.id, loc));
        end = context.entity(end.id);

        // check if this movement causes the geometry to break
        var doBlock = invalidGeometry(end, context.graph());
        context.surface()
            .classed('nope', doBlock);
    }


    function invalidGeometry(entity, graph) {
        var parents = graph.parentWays(entity);

        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];
            var nodes = parent.nodes.map(function(nodeID) { return graph.entity(nodeID); });
            if (parent.isClosed()) {
                if (geoHasSelfIntersections(nodes, entity.id)) {
                    return true;
                }
            }
        }

        return false;
    }


    function undone() {
        // Undo popped the history back to the initial annotated no-op edit.
        // Remove initial no-op edit and whatever edit happened immediately before it.
        context.pop(2);
        _tempEdits = 0;

        if (context.hasEntity(wayId)) {
            context.enter(mode);
        } else {
            context.enter(modeBrowse(context));
        }
    }


    function setActiveElements() {
        context.surface().selectAll('.' + end.id)
            .classed('active', true);
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

        context.map()
            .dblclickEnable(false)
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
            context.pop(_tempEdits);
            while (context.graph() !== startGraph) {
                context.pop();
            }
        }

        context.map()
            .on('drawn.draw', null);

        surface.call(behavior.off)
            .selectAll('.active')
            .classed('active', false);

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
    drawWay.add = function(loc, datum) {
        if ((datum && datum.id && /-nope$/.test(datum.id)) ||
            context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pop(_tempEdits);
        _tempEdits = 0;

        context.perform(
            _actionAddDrawNode(),
            annotation
        );

        context.enter(mode);
    };


    // Connect the way to an existing way.
    drawWay.addWay = function(loc, edge) {
        if (context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pop(_tempEdits);
        _tempEdits = 0;

        context.perform(
            _actionAddDrawNode(),
            actionAddMidpoint({ loc: loc, edge: edge }, end),
            annotation
        );

        context.enter(mode);
    };


    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {
        if (context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pop(_tempEdits);
        _tempEdits = 0;

        context.perform(
            _actionReplaceDrawNode(node),
            annotation
        );

        context.enter(mode);
    };


    // Finish the draw operation, removing the temporary edits.
    // If the way has enough nodes to be valid, it's selected.
    // Otherwise, delete everything and return to browse mode.
    drawWay.finish = function() {
        if (context.surface().classed('nope')) {
            return;   // can't click here
        }

        context.pop(_tempEdits);
        _tempEdits = 0;

        var way = context.hasEntity(wayId);
        if (!way || way.isDegenerate()) {
            drawWay.cancel();
            return;
        }

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        context.enter(modeSelect(context, [wayId]).newFeature(true));
    };


    // Cancel the draw operation, delete everything, and return to browse mode.
    drawWay.cancel = function() {
        context.pop(_tempEdits);
        _tempEdits = 0;

        while (context.graph() !== startGraph) {
            context.pop();
        }

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        context.surface()
            .classed('nope', false);

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
