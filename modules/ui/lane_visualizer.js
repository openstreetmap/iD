import * as d3 from 'd3';
import _ from 'lodash';
import { geoAngle, geoChooseEdge, geoPointOnLine } from '../geo/index';

function createSVGLink(directions) {
    var dir = directions.sort(function(a, b) {
        return a.charCodeAt(0) - b.charCodeAt(0);
    });
    dir = dir.join('-');
    if (dir.indexOf('unknown') > -1 || dir.length === 0) return 'unknown';
    return dir;
}
export function uiLaneVisualizer(context) {
    var menu,
        wrapper,
        wayId,
        center = [0, 0],
        tooltip,
        metadata;
    
    var laneVisualizer = function (selection) {
        if (!wayId) return;
         metadata = context.entity(wayId).lanes().metadata;
        if (!metadata) return;
    
        const iconWidth = 40;
        const count = metadata.count;

        function render() {
            if (context.hasEntity(wayId)) {
                laneVisualizer.close();
                laneVisualizer(selection);
            }
        }

        var projection = context.projection;
        var graph = context.graph();
        var way = graph.entity(wayId);

        var nodes = _.uniq(graph.childNodes(way));
        var choice = geoChooseEdge(nodes, context.mouse(), context.projection);
        var prev = nodes[choice.index - 1];
        var next = nodes[choice.index];
        var angle = (geoAngle(prev, next, projection) * 180 / Math.PI) + 180;

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
            .attr('transform', 'translate('+ center+ ') rotate('+ angle + ')')
            .attr('opacity', 0);

        wrapper
            .transition()
            .attr('opacity', 1);

        var menu = wrapper
            .append('g')
            .attr('transform', 'translate(0, ' +(-1*count*iconWidth)/2 + ')');

      

        var rect = menu
            .append('rect')
            .attr('class', 'lane-visualizer-background')
            .attr('width', iconWidth)
            .attr('height', count*iconWidth);

        var button = menu.selectAll()
                .data(_.fill(Array(metadata.count), 0).map(function (n, i) {
                    return i;
                }))
                .enter()
                .append('g')
                .attr('class', 'radial-menu-item radial-menu-item-move')
                .attr('transform', function(d, i) {
                    return 'translate(' + [ iconWidth/2, (iconWidth/2 + i*iconWidth) ]+ ') rotate(-90)';
                });

        button
            .append('circle')
            .attr('r', 15);

        button
            .append('use')
            .attr('transform', 'translate(-15,-12)')
            .attr('width', '20')
            .attr('height', '20')
            .attr('xlink:href', function (d, i) {
                return '#lane-' + createSVGLink(metadata.turnLanes.unspecified[i]);
            });
    
        //  menu
        //     .append('rect')
        //     .attr('width', 20)
        //     .attr('height', 30)
        //     .attr('stroke-width', 50)
        //     .attr('stroke-linecap', 'round');
        
    };

    laneVisualizer.center = function (_) {
        if (!arguments.length) return center;
        center = _;
        console.log(center);
        return laneVisualizer;
    };


    laneVisualizer.wayID = function (_) {
        if (!arguments.length) return _;
        wayId = _;
        return laneVisualizer;
    };

    laneVisualizer.close = function() {
        console.log('closing')
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
