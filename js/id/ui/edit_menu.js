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
            offset  = 10,
            items = operations.length,
            cols,
            rows,
            xstart,
            ystart,
            xwidth,
            yheight;

        // pack menu items into columns..
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

        xwidth = cols * spacing;
        yheight = rows * spacing;

        if(direction[0] < 0) {
            xstart = (-1 * (xwidth + offset));
        }
        else if (direction[0] === 0) {
            xstart = (-1 * (xwidth + offset)) / 2;
        }
        else {
            xstart = offset;
        }

        if(direction[1] < 0) {
            ystart = (-1 * (yheight + offset));
        }
        else if (direction[0] === 0) {
            ystart = (-1 * (yheight + offset)) / 2;
        }
        else {
            ystart = offset;
        }

console.info('position=[' + position + '] direction=[' + direction + '] xwidth=' + xwidth + ' yheight=' + yheight + ' xstart=' + xstart + ' ystart=' + ystart );

        menu = selection.append('g')
            .attr('class', 'edit-menu')
            .attr('transform', 'translate(' + position + ')')
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 1);

        menu.append('rect')
            .attr('class', 'edit-menu-background')
            .attr('x', xstart)
            .attr('y', ystart)
            .attr('width', xwidth)
            .attr('height', yheight)
            .attr('rx', spacing / 2)
            .attr('ry', spacing / 2)

        var button = menu.selectAll()
            .data(operations)
            .enter().append('g')
            .attr('transform', function(d, i) {
                var col = (i % cols) + 1,
                    row = Math.trunc(i / cols) + 1,
                    x = (xstart + (spacing * col) - (spacing / 2)),
                    y = (ystart + (spacing * row) - (spacing / 2));
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
            // pin tooltip to bottom of editmenu..
            var rect = context.surfaceRect(),
                top = rect.top + position[1] + ystart + yheight + 'px',
                left = rect.left + position[0] + xstart + 'px';

            tooltip
                .style('left', left)
                .style('top', top)
                .style('display', 'block')
                .html(iD.ui.tooltipHtml(d.tooltip(), d.keys[0]));
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

    // position where the menu should start, specified like [x,y]
    editMenu.position = function(_) {
        if (!arguments.length) return position;
        position = _;
        return editMenu;
    };

    // direction to grow the menu, specified like [x,y]
    //      -1
    //   -1  0  1
    //       1
    editMenu.direction = function(_) {
        if (!arguments.length) return direction;
        direction = _;
        return editMenu;
    };

    return editMenu;
};
