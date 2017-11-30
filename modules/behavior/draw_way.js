import _clone from 'lodash-es/clone';

import { t } from '../util/locale';

import {
    actionAddEntity,
    actionAddMidpoint,
    actionMoveNode,
    actionNoop
} from '../actions';

import { behaviorDraw } from './draw';

import {
    geoChooseEdge,
    geoEdgeEqual
} from '../geo';

import {
    modeBrowse,
    modeSelect
} from '../modes';

import {
    osmNode,
    osmWay
} from '../osm';

import { utilEntitySelector } from '../util';


export function behaviorDrawWay(context, wayId, index, mode, startGraph) {

    var origWay = context.entity(wayId),
        isArea = context.geometry(wayId) === 'area',
        tempEdits = 0,
        annotation = t((origWay.isDegenerate() ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = behaviorDraw(context),
        startIndex,
        start,
        end,
        segment;


    // initialize the temporary drawing entities
    if (!isArea) {
        startIndex = typeof index === 'undefined' ? origWay.nodes.length - 1 : 0;
        start = osmNode({ id: 'nStart', loc: context.entity(origWay.nodes[startIndex]).loc });
        end = osmNode({ id: 'nEnd', loc: context.map().mouseCoordinates() });
        segment = osmWay({ id: 'wTemp',
            nodes: typeof index === 'undefined' ? [start.id, end.id] : [end.id, start.id],
            tags: _clone(origWay.tags)
        });
    } else {
        end = osmNode({ loc: context.map().mouseCoordinates() });
    }

    // Push an annotated state for undo to return back to.
    // We must make sure to remove this edit later.
    context.perform(actionNoop(), annotation);
    tempEdits++;

    // Add the temporary drawing entities to the graph.
    // We must make sure to remove this edit later.
    context.perform(AddDrawEntities());
    tempEdits++;


    function move(datum) {
        var loc;

        if (datum.type === 'node' && datum.id !== end.id) {
            loc = datum.loc;

        } else if (datum.type === 'way') {
            var dims = context.map().dimensions(),
                mouse = context.mouse(),
                pad = 5,
                trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                    mouse[1] > pad && mouse[1] < dims[1] - pad;

            if (trySnap) {
                loc = geoChooseEdge(context.childNodes(datum), context.mouse(), context.projection).loc;
            }
        }

        if (!loc) {
            loc = context.map().mouseCoordinates();
        }

        context.replace(actionMoveNode(end.id, loc));
        end = context.entity(end.id);
    }


    function undone() {
        // Undo popped the history back to the initial annotated no-op edit.
        // Remove initial no-op edit and whatever edit happened immediately before it.
        context.pop(2);
        tempEdits = 0;

        if (context.hasEntity(wayId)) {
            context.enter(mode);
        } else {
            context.enter(modeBrowse(context));
        }
    }


    function setActiveElements() {
        var active = isArea ? [wayId, end.id] : [segment.id, start.id, end.id];
        context.surface().selectAll(utilEntitySelector(active))
            .classed('active', true);
    }


    var drawWay = function(surface) {
        draw.on('move', move)
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

        surface.call(draw);

        context.history()
            .on('undone.draw', undone);
    };


    drawWay.off = function(surface) {
        // Drawing was interrupted unexpectedly.
        // This can happen if the user changes modes,
        // clicks geolocate button, a hashchange event occurs, etc.
        if (tempEdits) {
            context.pop(tempEdits);
            while (context.graph() !== startGraph) {
                context.pop();
            }
        }

        context.map()
            .on('drawn.draw', null);

        surface.call(draw.off)
            .selectAll('.active')
            .classed('active', false);

        context.history()
            .on('undone.draw', null);
    };


    function AddDrawEntities() {
        return function(graph) {
            if (isArea) {
                // For area drawing, there is no need for a temporary node.
                // `end` gets inserted into the way as the penultimate node.
                return graph
                    .replace(end)
                    .replace(origWay.addNode(end.id));
            } else {
                // For line drawing, add a temporary start, end, and segment to the graph.
                // This allows us to class the new segment as `active`, but still
                // connect it back to parts of the way that have already been drawn.
                return graph
                    .replace(start)
                    .replace(end)
                    .replace(segment);
            }
        };
    }


    function ReplaceDrawEntities(newNode) {
        return function(graph) {
            if (isArea) {
                // For area drawing, we didn't create a temporary node.
                // `newNode` gets inserted into the _original_ way as the penultimate node.
                return graph
                    .replace(origWay.addNode(newNode.id))
                    .remove(end);
            } else {
                // For line drawing, add the `newNode` to the way at specified index,
                // and remove the temporary start, end, and segment.
                return graph
                    .replace(origWay.addNode(newNode.id, index))
                    .remove(end)
                    .remove(segment)
                    .remove(start);
            }
        };
    }


    // Accept the current position of the temporary node and continue drawing.
    drawWay.add = function(loc) {
        // prevent duplicate nodes
        var last = context.hasEntity(origWay.nodes[origWay.nodes.length - (isArea ? 2 : 1)]);
        if (last && last.loc[0] === loc[0] && last.loc[1] === loc[1]) return;

        context.pop(tempEdits);

        if (isArea) {
            context.perform(
                AddDrawEntities(),
                annotation
            );
        } else {
            var newNode = osmNode({loc: loc});
            context.perform(
                actionAddEntity(newNode),
                ReplaceDrawEntities(newNode),
                annotation
            );
        }

        tempEdits = 0;
        context.enter(mode);
    };


    // Connect the way to an existing way.
    drawWay.addWay = function(loc, edge) {
        if (isArea) {
            context.pop(tempEdits);

            context.perform(
                AddDrawEntities(),
                actionAddMidpoint({ loc: loc, edge: edge}, end),
                annotation
            );
        } else {
            var previousEdge = startIndex ?
                [origWay.nodes[startIndex], origWay.nodes[startIndex - 1]] :
                [origWay.nodes[0], origWay.nodes[1]];

            // Avoid creating duplicate segments
            if (geoEdgeEqual(edge, previousEdge))
                return;

            context.pop(tempEdits);

            var newNode = osmNode({ loc: loc });
            context.perform(
                actionAddMidpoint({ loc: loc, edge: edge}, newNode),
                ReplaceDrawEntities(newNode),
                annotation
            );
        }

        tempEdits = 0;
        context.enter(mode);
    };


    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {
        // Avoid creating duplicate segments
        if (origWay.areAdjacent(node.id, origWay.nodes[origWay.nodes.length - 1])) return;

        // Clicks should not occur on the drawing node, however a space keypress can
        // sometimes grab that node's datum (before it gets classed as `active`?)  #4016
        if (node.id === end.id) {
            drawWay.add(node.loc);
            return;
        }

        context.pop(tempEdits);

        context.perform(
            ReplaceDrawEntities(node),
            annotation
        );

        tempEdits = 0;
        context.enter(mode);
    };


    // Finish the draw operation, removing the temporary edits.
    // If the way has enough nodes to be valid, it's selected.
    // Otherwise, delete everything and return to browse mode.
    drawWay.finish = function() {
        context.pop(tempEdits);
        tempEdits = 0;

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
        context.pop(tempEdits);
        tempEdits = 0;

        while (context.graph() !== startGraph) {
            context.pop();
        }

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        context.enter(modeBrowse(context));
    };


    drawWay.tail = function(text) {
        draw.tail(text);
        return drawWay;
    };


    return drawWay;
}
