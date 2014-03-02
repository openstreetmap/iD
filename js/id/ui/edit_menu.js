iD.ui.EditMenu = function(context, operations) {
    var menu,
        position = [0, 0],
        direction = [1, 1],
        tooltip;

    var editMenu = function(selection) {
        if (!operations.length)
            return;

        selection.node().parentNode.focus();

        function click(operation) {
            d3.event.stopPropagation();
            if (operation.disabled())
                return;
            operation();
            editMenu.close();
        }

        var spacing = 40,
            xoffset = 10,
            yoffset = 10,
            items = operations.length,
            cols,
            rows;

        if (items <= 5) {
            cols = items;
        } else if ([7, 8, 11, 12].indexOf(items) != -1) {
            cols = 4;
        } else if ([6, 9].indexOf(items) != -1) {
            cols = 3;
        } else {
            cols = 5;
        }
        rows = Math.ceil(items / cols);

console.info('position=[' + position + '] direction=[' + direction + ']');

        menu = selection.append('g')
            .attr('class', 'edit-menu')
            .attr('transform', 'translate(' + position + ')')
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 1);

        menu.append('rect')
            .attr('class', 'edit-menu-background')
            .attr('x', xoffset)
            .attr('y', yoffset)
            .attr('width', cols * spacing)
            .attr('height', rows * spacing)
            .attr('rx', spacing / 2)
            .attr('ry', spacing / 2)

        var button = menu.selectAll()
            .data(operations)
            .enter().append('g')
            .attr('transform', function(d, i) {
                var col = (i % cols) + 1,
                    row = Math.trunc(i / cols) + 1,
                    x = ((spacing * col) - (spacing / 2) + xoffset),
                    y = ((spacing * row) - (spacing / 2) + yoffset);
                return 'translate(' + x + ',' + y + ')';
            });

        button.append('circle')
            .attr('class', function(d) { return 'edit-menu-item edit-menu-item-' + d.id; })
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
            .attr('class', 'tooltip-inner edit-menu-tooltip');

        function mousedown() {
            d3.event.stopPropagation(); // https://github.com/openstreetmap/iD/issues/1869
        }

        function mouseover(d, i) {
            var rect = context.surfaceRect(),
                top = rect.top + position[1] + (rows * spacing) + yoffset + 'px',
                left = rect.left + position[0] + xoffset + 'px';

            tooltip
                .style('top', null)
                .style('left', null)
                .style('bottom', null)
                .style('right', null)
                .style('display', 'block')
                .html(iD.ui.tooltipHtml(d.tooltip(), d.keys[0]));

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

    editMenu.close = function() {
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

    editMenu.position = function(_) {
        if (!arguments.length) return position;
        position = _;
        return editMenu;
    };

    editMenu.direction = function(_) {
        if (!arguments.length) return direction;
        direction = _;
        return editMenu;
    };

    return editMenu;
};
