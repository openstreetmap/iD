iD.ui.RadialMenu = function(entity, mode) {
    var arcs;

    var radialMenu = function(selection, center) {
        var history = mode.map.history(),
            graph = history.graph(),
            operations = d3.values(iD.operations)
                .map(function (o) { return o(entity.id, mode); })
                .filter(function (o) { return o.available(graph); });

        function click(operation) {
            d3.event.stopPropagation();
            operation(history);
        }

        var arc = d3.svg.arc()
            .outerRadius(70)
            .innerRadius(30)
            .startAngle(function (d, i) { return 2 * Math.PI / operations.length * i; })
            .endAngle(function (d, i) { return 2 * Math.PI / operations.length * (i + 1); });

        arcs = selection.selectAll()
            .data(operations)
            .enter().append('g')
            .attr('class', 'radial-menu')
            .attr('transform', "translate(" + center + ")")
            .attr('opacity', 0);

        arcs.transition()
            .attr('opacity', 0.8);

        arcs.append('path')
            .attr('class', function (d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .attr('d', arc)
            .classed('disabled', function (d) { return !d.enabled(graph); })
            .on('click', click);

        arcs.append('text')
            .attr("transform", function(d, i) { return "translate(" + arc.centroid(d, i) + ")"; })
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.title; });
    };

    radialMenu.close = function(selection) {
        if (arcs) {
            arcs.transition()
                .attr('opacity', 0)
                .remove();
        }
    };

    return radialMenu;
};
