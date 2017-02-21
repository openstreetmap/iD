import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../util/locale';
import {
    actionAddMidpoint,
    actionConnect,
    actionMoveNode,
    actionNoop
} from '../actions/index';

import {
    behaviorEdit,
    behaviorHover,
    behaviorDrag
} from '../behavior/index';

import {
    modeBrowse,
    modeSelect
} from './index';

import { geoChooseEdge } from '../geo/index';
import { osmNode } from '../osm/index';
import { utilEntitySelector } from '../util/index';


export function modeDragNode(context) {
    var mode = {
        id: 'drag-node',
        button: 'browse'
    };

    var nudgeInterval,
        activeIDs,
        wasMidpoint,
        isCancelled,
        lastLoc,
        selectedIDs = [],
        hover = behaviorHover(context).altDisables(true).on('hover', context.ui().sidebar.hover),
        edit = behaviorEdit(context);


    function vecSub(a, b) {
        return [a[0] - b[0], a[1] - b[1]];
    }

    function edge(point, size) {
        var pad = [30, 100, 30, 100],
            x = 0,
            y = 0;

        if (point[0] > size[0] - pad[0])
            x = -10;
        if (point[0] < pad[2])
            x = 10;
        if (point[1] > size[1] - pad[1])
            y = -10;
        if (point[1] < pad[3])
            y = 10;

        if (x || y) {
            return [x, y];
        } else {
            return null;
        }
    }


    function startNudge(entity, nudge) {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = window.setInterval(function() {
            context.pan(nudge);
            doMove(entity, nudge);
        }, 50);
    }


    function stopNudge() {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = null;
    }


    function moveAnnotation(entity) {
        return t('operations.move.annotation.' + entity.geometry(context.graph()));
    }


    function connectAnnotation(entity) {
        return t('operations.connect.annotation.' + entity.geometry(context.graph()));
    }


    function origin(entity) {
        return context.projection(entity.loc);
    }


    function start(entity) {
        wasMidpoint = entity.type === 'midpoint';

        // Things allowed to be dragged include:
        // - midpoints
        // - nodes that are selected
        // - vertices that are selected
        // - vertices classed 'sibling' which includes (see svg/vertices.js)
        //   - children of selected ways or multipolygons
        //   - vertices sharing a way with selected vertices
        var selector = 'g.node.point.selected.' + entity.id +
            ', g.vertex-persistent.selected.' + entity.id +
            ', g.vertex-persistent.sibling.' + entity.id;

        var isDraggable = wasMidpoint || !d3.select(selector).empty();

        isCancelled = d3.event.sourceEvent.shiftKey || !isDraggable ||
            context.features().hasHiddenConnections(entity, context.graph());

        if (isCancelled) {
            return behavior.cancel();
        }

        if (wasMidpoint) {
            var midpoint = entity;
            entity = osmNode();
            context.perform(actionAddMidpoint(midpoint, entity));

            var vertex = context.surface().selectAll('.' + entity.id);
            behavior.target(vertex.node(), entity);

        } else {
            context.perform(actionNoop());
        }

        // activeIDs generate no pointer events.  This prevents the node or vertex
        // being dragged from trying to connect to itself or its parent element.
        activeIDs = _.map(context.graph().parentWays(entity), 'id');
        activeIDs.push(entity.id);
        setActiveElements();

        context.enter(mode);
    }


    function datum() {
        var event = d3.event && d3.event.sourceEvent;
        if (!event || event.altKey) {
            return {};
        } else {
            return event.target.__data__ || {};
        }
    }


    function doMove(entity, nudge) {
        nudge = nudge || [0, 0];

        var currPoint = (d3.event && d3.event.point) || context.projection(lastLoc),
            currMouse = vecSub(currPoint, nudge),
            loc = context.projection.invert(currMouse),
            d = datum();

        if (d.type === 'node' && d.id !== entity.id) {
            loc = d.loc;
        } else if (d.type === 'way' && !d3.select(d3.event.sourceEvent.target).classed('fill')) {
            loc = geoChooseEdge(context.childNodes(d), context.mouse(), context.projection).loc;
        }

        context.replace(
            actionMoveNode(entity.id, loc),
            moveAnnotation(entity)
        );

        lastLoc = loc;
    }


    function move(entity) {
        if (isCancelled) return;
        d3.event.sourceEvent.stopPropagation();
        lastLoc = context.projection.invert(d3.event.point);

        doMove(entity);
        var nudge = edge(d3.event.point, context.map().dimensions());
        if (nudge) startNudge(entity, nudge);
        else stopNudge();
    }


    function end(entity) {
        if (isCancelled) return;

        var d = datum();

        if (d.type === 'way') {
            var choice = geoChooseEdge(context.childNodes(d), context.mouse(), context.projection);
            context.replace(
                actionAddMidpoint({ loc: choice.loc, edge: [d.nodes[choice.index - 1], d.nodes[choice.index]] }, entity),
                connectAnnotation(d)
            );

        } else if (d.type === 'node' && d.id !== entity.id) {
            context.replace(
                actionConnect([d.id, entity.id]),
                connectAnnotation(d)
            );

        } else if (wasMidpoint) {
            context.replace(
                actionNoop(),
                t('operations.add.annotation.vertex')
            );

        } else {
            context.replace(
                actionNoop(),
                moveAnnotation(entity)
            );
        }

        var reselection = selectedIDs.filter(function(id) {
            return context.graph().hasEntity(id);
        });

        if (reselection.length) {
            context.enter(modeSelect(context, reselection));
        } else {
            context.enter(modeBrowse(context));
        }
    }


    function cancel() {
        behavior.cancel();
        context.enter(modeBrowse(context));
    }


    function setActiveElements() {
        context.surface().selectAll(utilEntitySelector(activeIDs))
            .classed('active', true);
    }


    var behavior = behaviorDrag()
        .delegate('g.node, g.point, g.midpoint')
        .surface(d3.select('#map').node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);


    mode.enter = function() {
        context.install(hover);
        context.install(edit);

        context.history()
            .on('undone.drag-node', cancel);

        context.map()
            .on('drawn.drag-node', setActiveElements);

        setActiveElements();
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        context.history()
            .on('undone.drag-node', null);

        context.map()
            .on('drawn.drag-node', null);

        context.surface()
            .selectAll('.active')
            .classed('active', false);

        stopNudge();
    };


    mode.selectedIDs = function(_) {
        if (!arguments.length) return selectedIDs;
        selectedIDs = _;
        return mode;
    };


    mode.behavior = behavior;


    return mode;
}
