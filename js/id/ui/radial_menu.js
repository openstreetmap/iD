iD.ui.RadialMenu = function(context, operations) {
    var menu,
        center = [0, 0],
        tooltip;

    var radialMenu = function(selection) {
        if (!operations.length)
            return;

        selection.node().parentNode.focus();

        function click(operation) {
            d3.event.stopPropagation();
            if (operation.disabled())
                return;
            operation();
            radialMenu.close();
        }

        menu = selection.append('g')
            .attr('class', 'radial-menu')
            .attr('transform', 'translate(' + center + ')')
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 1);

//radial
        // var r = 50,
        //     a = Math.PI / 4,
        //     a0 = -Math.PI / 4,
        //     a1 = a0 + (operations.length - 1) * a;

//linear
        // var spacing = 40,
        //     offset = 40,
        //     items = operations.length,
        //     x0 = 0,
        //     x1 = x0 + (items - 1) * spacing;

//boxy
        var spacing = 40,
            xoffset = 10,
            yoffset = 10,
            items = operations.length,
            cols, rows;

        if (items <= 5) {
            cols = items;
        } else if ([7, 8, 11, 12].indexOf(items) != -1) {
            cols = 4;
        } else if ([6, 9].indexOf(items) != -1) {
            cols = 3;
        } else {
            cols = 5;
        }
// to test column packing
// cols = Math.min(items, 3);
        rows = Math.ceil(items / cols);

//radial
        // menu.append('path')
        //     .attr('class', 'radial-menu-background')
        //     .attr('d', 'M' + r * Math.sin(a0) + ',' +
        //                      r * Math.cos(a0) +
        //               ' A' + r + ',' + r + ' 0 ' + (operations.length > 5 ? '1' : '0') + ',0 ' +
        //                      (r * Math.sin(a1) + 1e-3) + ',' +
        //                      (r * Math.cos(a1) + 1e-3)) // Force positive-length path (#1305)
        //     .attr('stroke-width', 50)
        //     .attr('stroke-linecap', 'round');
//linear
        // menu.append('path')
        //     .attr('class', 'radial-menu-background')
        //     .attr('d', 'M' + x0 + ',' + offset + ' L' + x1 + ',' + offset)
        //     .attr('stroke-width', 50)
        //     .attr('stroke-linecap', 'round');
//boxy
        menu.append('rect')
            .attr('class', 'radial-menu-background')
            .attr('x', xoffset)
            .attr('y', yoffset)
            .attr('width', cols * spacing)
            .attr('height', rows * spacing)
            .attr('rx', spacing / 2)
            .attr('ry', spacing / 2)

        var button = menu.selectAll()
            .data(operations)
            .enter().append('g')
//radial
            // .attr('transform', function(d, i) {
            //     return 'translate(' + r * Math.sin(a0 + i * a) + ',' +
            //                           r * Math.cos(a0 + i * a) + ')';
            // });
//linear
            // .attr('transform', function(d, i) {
            //     return 'translate(' + (x0+(spacing * i)) + ',' + offset + ')';
            // });
//boxy
            .attr('transform', function(d, i) {
                var col = (i % cols) + 1,
                    row = Math.trunc(i / cols) + 1,
                    x = (spacing * col) - (spacing / 2) + xoffset,
                    y = (spacing * row) - (spacing / 2) + yoffset;
                // console.info('i=' + i + ', row=' + row + ', col=' + col + ', x=' + x + ', y=' + y);
                return 'translate(' + x + ',' + y + ')';
            });

        button.append('circle')
            .attr('class', function(d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .attr('r', 15)
            .classed('disabled', function(d) { return d.disabled(); })
            .on('click', click)
            .on('mousedown', mousedown)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button.append('use')
            .attr('transform', 'translate(-10, -10)')
            .attr('clip-path', 'url(#clip-square-20)')
            .attr('xlink:href', function(d) { return '#icon-operation-' + (d.disabled() ? 'disabled-' : '') + d.id; });

        tooltip = d3.select(document.body)
            .append('div')
            .attr('class', 'tooltip-inner radial-menu-tooltip');

        function mousedown() {
            d3.event.stopPropagation(); // https://github.com/openstreetmap/iD/issues/1869
        }

        function mouseover(d, i) {
            var rect = context.surfaceRect(),
//radial
                // angle = a0 + i * a,
                // top = rect.top + (r + 25) * Math.cos(angle) + center[1] + 'px',
                // left = rect.left + (r + 25) * Math.sin(angle) + center[0] + 'px',
                // bottom = rect.height - (r + 25) * Math.cos(angle) - center[1] + 'px',
                // right = rect.width - (r + 25) * Math.sin(angle) - center[0] + 'px';
//linear
                // top = rect.top + center[1] + (offset + 25) + 'px',
                // left = rect.left + center[0] + (i*spacing) - ((x1-x0)/2) + 'px'
//boxy
                top = rect.top + center[1] + (rows * spacing) + yoffset + 'px',
                left = rect.left + center[0] + xoffset + 'px';

            tooltip
                .style('top', null)
                .style('left', null)
                .style('bottom', null)
                .style('right', null)
                .style('display', 'block')
                .html(iD.ui.tooltipHtml(d.tooltip(), d.keys[0]));

//radial tooltip positioning
            // if (i === 0) {
            //     tooltip
            //         .style('right', right)
            //         .style('top', top);
            // } else if (i >= 4) {
            //     tooltip
            //         .style('left', left)
            //         .style('bottom', bottom);
            // } else {
                tooltip
                    .style('left', left)
                    .style('top', top);
            // }
        }

        function mouseout() {
            tooltip.style('display', 'none');
        }
    };

    radialMenu.close = function() {
        if (menu) {
            menu
                .style('pointer-events', 'none')
                .transition()
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
