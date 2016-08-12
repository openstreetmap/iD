import * as d3 from 'd3';
import { t } from '../util/locale';
import { getDimensions } from '../util/dimensions';
import _ from 'lodash';
import { AddEntity, AddMidpoint, AddVertex, MoveNode } from '../actions/index';
import { Browse, Select } from '../modes/index';
import { Node, Way } from '../core/index';
import { chooseEdge, edgeEqual } from '../geo/index';
import { Draw } from './draw';
import { entitySelector, functor } from '../util/index';

export function DrawWay(context, wayId, index, mode, baseGraph) {
    var way = context.entity(wayId),
        isArea = context.geometry(wayId) === 'area',
        finished = false,
        annotation = t((way.isDegenerate() ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = Draw(context);

    var startIndex = typeof index === 'undefined' ? way.nodes.length - 1 : 0,
        start = Node({loc: context.graph().entity(way.nodes[startIndex]).loc}),
        end = Node({loc: context.map().mouseCoordinates()}),
        segment = Way({
            nodes: typeof index === 'undefined' ? [start.id, end.id] : [end.id, start.id],
            tags: _.clone(way.tags)
        });

    var f = context[way.isDegenerate() ? 'replace' : 'perform'];
    if (isArea) {
        f(AddEntity(end),
            AddVertex(wayId, end.id, index));
    } else {
        f(AddEntity(start),
            AddEntity(end),
            AddEntity(segment));
    }

    function move(datum) {
        var loc;

        if (datum.type === 'node' && datum.id !== end.id) {
            loc = datum.loc;

        } else if (datum.type === 'way' && datum.id !== segment.id) {
            var dims = getDimensions(context.map()),
                mouse = context.mouse(),
                pad = 5,
                trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                    mouse[1] > pad && mouse[1] < dims[1] - pad;

            if (trySnap) {
                loc = chooseEdge(context.childNodes(datum), context.mouse(), context.projection).loc;
            }
        }

        if (!loc) {
            loc = context.map().mouseCoordinates();
        }

        context.replace(MoveNode(end.id, loc));
    }

    function undone() {
        finished = true;
        context.enter(Browse(context));
    }

    function setActiveElements() {
        var active = isArea ? [wayId, end.id] : [segment.id, start.id, end.id];
        context.surface().selectAll(entitySelector(active))
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
        if (!finished)
            context.pop();

        context.map()
            .on('drawn.draw', null);

        surface.call(draw.off)
            .selectAll('.active')
            .classed('active', false);

        context.history()
            .on('undone.draw', null);
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            if (isArea) {
                return graph
                    .replace(way.addNode(newNode.id, index))
                    .remove(end);

            } else {
                return graph
                    .replace(graph.entity(wayId).addNode(newNode.id, index))
                    .remove(end)
                    .remove(segment)
                    .remove(start);
            }
        };
    }

    // Accept the current position of the temporary node and continue drawing.
    drawWay.add = function(loc) {

        // prevent duplicate nodes
        var last = context.hasEntity(way.nodes[way.nodes.length - (isArea ? 2 : 1)]);
        if (last && last.loc[0] === loc[0] && last.loc[1] === loc[1]) return;

        var newNode = Node({loc: loc});

        context.replace(
            AddEntity(newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Connect the way to an existing way.
    drawWay.addWay = function(loc, edge) {
        var previousEdge = startIndex ?
            [way.nodes[startIndex], way.nodes[startIndex - 1]] :
            [way.nodes[0], way.nodes[1]];

        // Avoid creating duplicate segments
        if (!isArea && edgeEqual(edge, previousEdge))
            return;

        var newNode = Node({ loc: loc });

        context.perform(
            AddMidpoint({ loc: loc, edge: edge}, newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {

        // Avoid creating duplicate segments
        if (way.areAdjacent(node.id, way.nodes[way.nodes.length - 1])) return;

        context.perform(
            ReplaceTemporaryNode(node),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Finish the draw operation, removing the temporary node. If the way has enough
    // nodes to be valid, it's selected. Otherwise, return to browse mode.
    drawWay.finish = function() {
        context.pop();
        finished = true;

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        if (context.hasEntity(wayId)) {
            context.enter(
                Select(context, [wayId])
                    .suppressMenu(true)
                    .newFeature(true));
        } else {
            context.enter(Browse(context));
        }
    };

    // Cancel the draw operation and return to browse, deleting everything drawn.
    drawWay.cancel = function() {
        context.perform(
            functor(baseGraph),
            t('operations.cancel_draw.annotation'));

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        finished = true;
        context.enter(Browse(context));
    };

    drawWay.tail = function(text) {
        draw.tail(text);
        return drawWay;
    };

    return drawWay;
}
