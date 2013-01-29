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

        arcs = selection.append('g')
            .attr('class', 'radial-menu')
            .attr('transform', "translate(" + center + ")")
            .attr('opacity', 0);

        arcs.transition()
            .attr('opacity', 0.8);

        var r = 50,
            a = Math.PI / 4,
            a0 = -Math.PI / 4,
            a1 = a0 + (operations.length - 1) * a;

        arcs.append('path')
            .attr('class', 'radial-menu-background')
            .attr('d', 'M' + r * Math.sin(a0) + ',' +
                             r * Math.cos(a0) +
                      ' A' + r + ',' + r + ' 0 0,0 ' +
                             r * Math.sin(a1) + ',' +
                             r * Math.cos(a1))
            .attr('stroke-width', 50)
            .attr('stroke-linecap', 'round');

        var button = arcs.selectAll()
            .data(operations)
            .enter().append('g')
            .attr('transform', function(d, i) {
                return 'translate(' + r * Math.sin(a0 + i * a) + ',' +
                                      r * Math.cos(a0 + i * a) + ')';
            });

        button.append('circle')
            .attr('class', function (d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .attr('r', 15)
            .attr('title', function (d) { return d.title; })
            .classed('disabled', function (d) { return !d.enabled(graph); })
            .on('click', click)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button.append('image')
            .attr('width', 16)
            .attr('height', 16)
            .attr('transform', 'translate(-8, -8)')
            .attr('xlink:href', 'icons/helipad.png');
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
