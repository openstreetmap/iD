export function svgOsm(projection, context, dispatch) {
    var enabled = true;


    function drawOsm(selection) {
        selection.selectAll('.layer-osm')
            .data(['covered', 'areas', 'lines', 'points', 'labels'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-osm layer-' + d; });

        selection.selectAll('.layer-areas').selectAll('.layer-areas-group')
            .data(['areas', 'targets'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-areas-group layer-areas-' + d; });

        selection.selectAll('.layer-lines').selectAll('.layer-lines-group')
            .data(['lines', 'targets'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-lines-group layer-lines-' + d; });

        selection.selectAll('.layer-points').selectAll('.layer-points-group')
            .data(['points', 'midpoints', 'vertices', 'turns', 'targets'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-points-group layer-points-' + d; });

        selection.selectAll('.layer-labels').selectAll('.layer-labels-group')
            .data(['halo', 'label', 'debug'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-labels-group layer-labels-' + d; });
    }


    function showLayer() {
        var layer = context.surface().selectAll('.data-layer-osm');
        layer.interrupt();

        layer
            .classed('disabled', false)
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end interrupt', function () {
                dispatch.call('change');
            });
    }


    function hideLayer() {
        var layer = context.surface().selectAll('.data-layer-osm');
        layer.interrupt();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end interrupt', function () {
                layer.classed('disabled', true);
                dispatch.call('change');
            });
    }


    drawOsm.enabled = function(_) {
        if (!arguments.length) return enabled;
        enabled = _;

        if (enabled) {
            showLayer();
        } else {
            hideLayer();
        }

        dispatch.call('change');
        return this;
    };


    return drawOsm;
}
