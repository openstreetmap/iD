iD.ui.RadialMenu = function(operations) {
    var menu;

    var radialMenu = function(selection, center) {
        if (!operations.length)
            return;

        function click(operation) {
            d3.event.stopPropagation();
            operation();
        }

        menu = selection.append('g')
            .attr('class', 'radial-menu')
            .attr('transform', "translate(" + center + ")")
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 0.8);

        var r = 50,
            a = Math.PI / 4,
            a0 = -Math.PI / 4,
            a1 = a0 + (operations.length - 1) * a;

        menu.append('path')
            .attr('class', 'radial-menu-background')
            .attr('d', 'M' + r * Math.sin(a0) + ',' +
                             r * Math.cos(a0) +
                      ' A' + r + ',' + r + ' 0 0,0 ' +
                             r * Math.sin(a1) + ',' +
                             r * Math.cos(a1))
            .attr('stroke-width', 50)
            .attr('stroke-linecap', 'round');

        var button = menu.selectAll()
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
            .classed('disabled', function (d) { return !d.enabled(); })
            .on('click', click)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button.append('image')
            .attr('width', 16)
            .attr('height', 16)
            .attr('transform', 'translate(-8, -8)')
            .attr('xlink:href', 'icons/helipad.png');

        var tooltip = menu.append('foreignObject')
            .style('display', 'none')
            .attr('width', 200)
            .attr('height', 400);

        tooltip.append('xhtml:div')
            .attr('class', 'radial-menu-tooltip');

        function mouseover(d, i) {
            var angle = a0 + i * a,
                dx = angle < 0 ? -200 : 0,
                dy = 0;

            tooltip
                .attr('x', (r + 30) * Math.sin(angle) + dx)
                .attr('y', (r + 30) * Math.cos(angle) + dy)
                .style('display', 'block')
                .select('div')
                .text(d.description);
        }

        function mouseout() {
            tooltip.style('display', 'none');
        }
    };

    radialMenu.close = function(selection) {
        if (menu) {
            menu.transition()
                .attr('opacity', 0)
                .remove();
        }
    };

    return radialMenu;
};
