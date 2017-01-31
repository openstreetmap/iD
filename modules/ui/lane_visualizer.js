import * as d3 from 'd3';
import _ from 'lodash';
import { geoAngle, geoChooseEdge, geoPointOnLine } from '../geo/index';

export function uiLaneVisualizer(context) {
    var menu,
        wrapper,
        wayId,
        center = [0, 0],
        tooltip,
        metadata;

    var laneVisualizer = function (selection) {
        var leftHand = false;

        if (!wayId) return;
        metadata = context.entity(wayId).lanes().metadata;
        if (!metadata) return;

        var seq = context.entity(wayId).lanes().accessSeq;
        
        const iconWidth = 40;
        const count = metadata.count;

        var projection = context.projection;
        var graph = context.graph();
        var way = graph.entity(wayId);

        var nodes = _.uniq(graph.childNodes(way));
        var choice = geoChooseEdge(nodes, context.mouse(), context.projection);
        var prev = nodes[choice.index - 1];
        var next = nodes[choice.index];
        var angle = (geoAngle(prev, next, projection) * 180 / Math.PI);
        
        context.history()
            .on('change.lanes', render);

        selection.node().parentNode.focus();

        function click() {
            d3.event.stopPropagation();
            laneVisualizer.close();
        }

        wrapper = selection
            .append('g')
            .attr('class', 'lane-visualizer')
            // .attr('transform', 'translate('+ center + ')')
            .attr('transform', 'translate(' + center + ') rotate(' + (angle+ 90) + ')')
            .attr('opacity', 0);

        wrapper
            .transition()
            .attr('opacity', 1);

        var menu = wrapper
            .append('g')
            .attr('transform', 'translate(' + count*iconWidth/(-2) + ', 0)');

        menu
            .append('rect')
            .attr('class', 'lane-visualizer-background')
            .attr('width', count* iconWidth)
            .attr('height', iconWidth);

        var button = menu.selectAll()
            .data(seq)
            .enter()
            .append('g')
            .attr('class', 'radial-menu-item radial-menu-item-move')
            .attr('transform', function (d, i) {
                var reverse = 0;
                if (d.dir === 'backward') {
                    reverse = 180;
                }
                return 'translate(' + [iconWidth / 2  + i * iconWidth, (iconWidth / 2)] + ') rotate(' + reverse + ')';
            });

        button
            .append('circle')
            .style('fill', function(d) {
                switch (d.dir) {
                    case 'forward':
                        return '#dfffdf';
                    case 'backward':
                        return '#ffd8d8';
                    default:
                        return '';
                }
            })
            .attr('r', 15);

        button
            .append('use')
            .attr('transform', 'translate(-15,-12)')
            .attr('width', '20')
            .attr('height', '20')
            .attr('xlink:href', function (d) {
                return '#lane-' + createSVGLink(d);
            });

        
        function render() {
            if (context.hasEntity(wayId)) {
                laneVisualizer.close();
                laneVisualizer(selection);
            }
        }

    };
    function createSVGLink(d) {
        var directions;
        console.log(d.dir);
        directions = metadata.turnLanes[d.dir][d.index];

        // TODO: fix this vv
        if (!directions) return '';
        var dir = directions.sort(function (a, b) {
            return a.charCodeAt(0) - b.charCodeAt(0);
        });
        dir = dir.join('-');
        if (dir.indexOf('unknown') > -1 || dir.length === 0) return 'unknown';
        
        return dir;
    }
    laneVisualizer.center = function (_) {
        if (!arguments.length) return center;
        center = _;
        return laneVisualizer;
    };


    laneVisualizer.wayID = function (_) {
        if (!arguments.length) return _;
        wayId = _;
        return laneVisualizer;
    };

    laneVisualizer.close = function () {
        if (wrapper) {

            wrapper
                .style('pointer-events', 'none')
                .transition()
                .attr('opacity', 0)
                .remove();

            context.history()
                .on('change.lanes', null);
        }


        if (tooltip) {
            tooltip.remove();
        }
    };
    return laneVisualizer;
}
