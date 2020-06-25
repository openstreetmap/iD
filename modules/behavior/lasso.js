import { event as d3_event, select as d3_select } from 'd3-selection';

import { geoExtent, geoPointInPolygon } from '../geo';
import { modeSelect } from '../modes/select';
import { uiLasso } from '../ui/lasso';
import { utilArrayIntersection } from '../util/array';
import { utilGetAllNodes } from '../util/util';


export function behaviorLasso(context) {

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    var behavior = function(selection) {
        var lasso;


        function pointerdown() {
            var button = 0;  // left
            if (d3_event.button === button && d3_event.shiftKey === true) {
                lasso = null;

                d3_select(window)
                    .on(_pointerPrefix + 'move.lasso', pointermove)
                    .on(_pointerPrefix + 'up.lasso', pointerup);

                d3_event.stopPropagation();
            }
        }


        function pointermove() {
            if (!lasso) {
                lasso = uiLasso(context);
                context.surface().call(lasso);
            }

            lasso.p(context.map().mouse());
        }


        function normalize(a, b) {
            return [
                [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                [Math.max(a[0], b[0]), Math.max(a[1], b[1])]
            ];
        }


        function lassoed() {
            if (!lasso) return [];

            var graph = context.graph();
            var limitToNodes;

            if (context.map().editableDataEnabled(true /* skipZoomCheck */) && context.map().isInWideSelection()) {
                // only select from the visible nodes
                limitToNodes = new Set(utilGetAllNodes(context.selectedIDs(), graph));
            } else if (!context.map().editableDataEnabled()) {
                return [];
            }

            var bounds = lasso.extent().map(context.projection.invert);
            var extent = geoExtent(normalize(bounds[0], bounds[1]));

            var intersects = context.history().intersects(extent).filter(function(entity) {
                return entity.type === 'node' &&
                    (!limitToNodes || limitToNodes.has(entity)) &&
                    geoPointInPolygon(context.projection(entity.loc), lasso.coordinates) &&
                    !context.features().isHidden(entity, graph, entity.geometry(graph));
            });

            // sort the lassoed nodes as best we can
            intersects.sort(function(node1, node2) {
                var parents1 = graph.parentWays(node1);
                var parents2 = graph.parentWays(node2);
                if (parents1.length && parents2.length) {
                    // both nodes are vertices

                    var sharedParents = utilArrayIntersection(parents1, parents2);
                    if (sharedParents.length) {
                        var sharedParentNodes = sharedParents[0].nodes;
                        // vertices are members of the same way; sort them in their listed order
                        return sharedParentNodes.indexOf(node1.id) -
                            sharedParentNodes.indexOf(node2.id);
                    } else {
                        // vertices do not share a way; group them by their respective parent ways
                        return parseFloat(parents1[0].id.slice(1)) -
                            parseFloat(parents2[0].id.slice(1));
                    }

                } else if (parents1.length || parents2.length) {
                    // only one node is a vertex; sort standalone points before vertices
                    return parents1.length - parents2.length;
                }
                // both nodes are standalone points; sort left to right
                return node1.loc[0] - node2.loc[0];
            });

            return intersects.map(function(entity) { return entity.id; });
        }


        function pointerup() {
            d3_select(window)
                .on(_pointerPrefix + 'move.lasso', null)
                .on(_pointerPrefix + 'up.lasso', null);

            if (!lasso) return;

            var ids = lassoed();
            lasso.close();

            if (ids.length) {
                context.enter(modeSelect(context, ids));
            }
        }

        selection
            .on(_pointerPrefix + 'down.lasso', pointerdown);
    };


    behavior.off = function(selection) {
        selection.on(_pointerPrefix + 'down.lasso', null);
    };


    return behavior;
}
