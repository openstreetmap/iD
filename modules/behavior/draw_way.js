import _ from 'lodash';
import { t } from '../util/locale';

import {
    actionAddEntity,
    actionAddMidpoint,
    actionAddVertex,
    actionMoveNode
} from '../actions/index';

import {
    modeBrowse,
    modeSelect
} from '../modes/index';

import {
    osmNode,
    osmWay
} from '../osm/index';

import {
    geoChooseEdge,
    geoEdgeEqual
} from '../geo/index';

import {
    behaviorDraw
} from './draw';

import {
    utilEntitySelector,
    utilFunctor
} from '../util/index';


export function behaviorDrawWay(context, wayId, index, mode, baseGraph) {

    var way = context.entity(wayId),
        isArea = context.geometry(wayId) === 'area',
        finished = false,
        annotation = t((way.isDegenerate() ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = behaviorDraw(context);

    var startIndex = typeof index === 'undefined' ? way.nodes.length - 1 : 0,
        start = osmNode({loc: context.graph().entity(way.nodes[startIndex]).loc}),
        end = osmNode({loc: context.map().mouseCoordinates()}),
        segment = osmWay({
            nodes: typeof index === 'undefined' ? [start.id, end.id] : [end.id, start.id],
            tags: _.clone(way.tags)
        });

    var fn = context[way.isDegenerate() ? 'replace' : 'perform'];
    if (isArea) {
        fn(actionAddEntity(end),
            actionAddVertex(wayId, end.id, index)
        );
    } else {
        fn(actionAddEntity(start),
            actionAddEntity(end),
            actionAddEntity(segment)
        );
    }


    function move(datum) {
        var loc;

        if (datum.type === 'node' && datum.id !== end.id) {
            loc = datum.loc;

        } else if (datum.type === 'way' && datum.id !== segment.id) {
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
    }


    function undone() {
        finished = true;
        context.enter(modeBrowse(context));
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

        var newNode = osmNode({loc: loc});

        context.replace(
            actionAddEntity(newNode),
            ReplaceTemporaryNode(newNode),
            annotation
        );

        finished = true;
        context.enter(mode);
    };


    // Connect the way to an existing way.
    drawWay.addWay = function(loc, edge) {
        var previousEdge = startIndex ?
            [way.nodes[startIndex], way.nodes[startIndex - 1]] :
            [way.nodes[0], way.nodes[1]];

        // Avoid creating duplicate segments
        if (!isArea && geoEdgeEqual(edge, previousEdge))
            return;

        var newNode = osmNode({ loc: loc });

        context.perform(
            actionAddMidpoint({ loc: loc, edge: edge}, newNode),
            ReplaceTemporaryNode(newNode),
            annotation
        );

        finished = true;
        context.enter(mode);
    };


    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {
        // Avoid creating duplicate segments
        if (way.areAdjacent(node.id, way.nodes[way.nodes.length - 1])) return;

        context.perform(
            ReplaceTemporaryNode(node),
            annotation
        );

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
                modeSelect(context, [wayId]).suppressMenu(true).newFeature(true)
            );
        } else {
            context.enter(modeBrowse(context));
        }
    };


    // Cancel the draw operation and return to browse, deleting everything drawn.
    drawWay.cancel = function() {
        context.perform(
            utilFunctor(baseGraph),
            t('operations.cancel_draw.annotation'));

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        finished = true;
        context.enter(modeBrowse(context));
    };


    drawWay.tail = function(text) {
        draw.tail(text);
        return drawWay;
    };


    return drawWay;
}
