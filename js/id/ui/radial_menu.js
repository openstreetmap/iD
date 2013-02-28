iD.ui.RadialMenu = function(operations) {
    var menu,
        center = [0, 0];

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

        var image = button.append('foreignObject')
            .style('pointer-events', 'none')
            .attr('width', 20)
            .attr('height', 20)
            .attr('x', -10)
            .attr('y', -10);

        image.append('xhtml:span')
            .attr('class', function(d) { return 'icon icon-operation icon-operation-' + d.id; });

        var tooltip = menu.append('foreignObject')
            .style('display', 'none')
            .attr('width', 200)
            .attr('height', 400);

        tooltip.append('xhtml:div')
            .attr('class', 'radial-menu-tooltip tooltip-inner');

        function mouseover(d, i) {
            var angle = a0 + i * a,
                dx = angle < 0 ? -200 : 0,
                dy = 0;

            tooltip
                .attr('x', (r + 25) * Math.sin(angle) + dx)
                .attr('y', (r + 25) * Math.cos(angle) + dy)
                .style('display', 'block')
                .select('div')
                .text(d.description + ' ')
                .append('span')
                    .style('position', 'static')
                    .attr('class', 'keyhint')
                    .text(d.key.replace('⌫', 'Esc'));
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

    radialMenu.center = function(_) {
        if (!arguments.length) return center;
        center = _;
        return radialMenu;
    };

    return radialMenu;
};
