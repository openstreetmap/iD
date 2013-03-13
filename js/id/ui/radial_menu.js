iD.ui.RadialMenu = function(operations) {
    var menu,
        center = [0, 0],
        tooltip;

    var radialMenu = function(selection) {
        if (!operations.length)
            return;

        selection.node().parentNode.focus();

        function click(operation) {
            d3.event.stopPropagation();
            operation();
        }

        menu = selection.append('g')
            .attr('class', 'radial-menu')
            .attr('transform', "translate(" + center + ")")
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 1);

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
            .attr('class', function(d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .attr('r', 15)
            .classed('disabled', function(d) { return !d.enabled(); })
            .on('click', click)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button.append('use')
            .attr('transform', 'translate(-10, -10)')
            .attr('clip-path', 'url(#clip-square-20)')
            .attr('xlink:href', function(d) { return '#icon-operation-' + d.id; });

        tooltip = d3.select(document.body)
            .append('div')
            .attr('class', 'tooltip-inner radial-menu-tooltip');

        function mouseover(d, i) {
            var angle = a0 + i * a,
                dx = angle < 0 ? -200 : 0,
                dy = 0;

            tooltip
                .style('left', (r + 25) * Math.sin(angle) + dx + center[0] + 'px')
                .style('top', (r + 25) * Math.cos(angle) + dy + center[1]+ 'px')
                .style('display', 'block')
                .html(iD.ui.tooltipHtml(d.description, d.keys[0]));
        }

        function mouseout() {
            tooltip.style('display', 'none');
        }
    };

    radialMenu.close = function() {
        if (menu) {
            menu.transition()
                .attr('opacity', 0)
                .remove();
        }

        if (tooltip) {
            tooltip.remove();
        }
    };

    radialMenu.center = function(_) {
        if (!arguments.length) return center;
        center = _;
        return radialMenu;
    };

    return radialMenu;
};
