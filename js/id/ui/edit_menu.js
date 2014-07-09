iD.ui.EditMenu = function(context, operations) {
    var menu,
        position = [0, 0],
        tooltip;

    var directions = {
        'nw': [-1, -1],
        //'n':  [ 0, -1],
        'ne': [ 1, -1],
        //'w':  [ 0, -1],
        //'e':  [ 0,  1],
        'sw': [-1,  1],
        //'s':  [ 0,  1],
        'se': [ 1,  1]
    };

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
            offset = 8,  // to move around mouse cursor..
            items = operations.length,
            cols,
            rows;

        // pack menu items into columns and rows..
        if (items <= 5) {
            cols = items;
        } else if ([7, 8, 11, 12].indexOf(items) !== -1) {
            cols = 4;
        } else if ([6, 9].indexOf(items) !== -1) {
            cols = 3;
        } else {
            cols = 5;
        }
        rows = Math.ceil(items / cols);

        // determine menu size..
        var width = (cols * spacing),
            height = (rows * spacing),
            start = [0,0];

        // visible points to avoid..
        var points = _.map(d3.select('.layer-hit').selectAll('circle.shadow')[0], function(el) {
            return [el.getCTM().e, el.getCTM().f];
        });

        // pick the menu direction that obscures the fewest points..
        var best = Infinity,
            dim = context.map().dimensions();

        _.each(_.values(directions), function(dir) {
            var min = [0,0],
                max = [0,0],
                pad = 3;

            switch(dir[0]) {
                case -1:  min[0] = position[0] - width; break;
                //case  0:  min[0] = position[0] - (width / 2); break;
                case  1:  min[0] = position[0] + offset; break;
            }
            switch(dir[1]) {
                case -1:  min[1] = position[1] - height; break;
                //case  0:  min[1] = position[1] - (height / 2); break;
                case  1:  min[1] = position[1] + offset; break;
            }
            max = [(min[0] + width), (min[1] + height)];

// console.info('test dir=' + dir + ' dim=' + dim + ' min=' + min + ' max=' + max + ' best=' + best);
            // only consider directions that fit the menu within map surface..
            if ((min[0] > 0) && (min[1] > 60) && (max[0] < dim[0]) && (max[1] < dim[1])) {
                var hits = _.filter(points, function(point) {
                    return (
                        (point[0] >= min[0] - pad) &&
                        (point[0] <= max[0] + pad) &&
                        (point[1] >= min[1] - pad) &&
                        (point[1] <= max[1] + pad)
                    );
                });

                if (hits.length <= best) {
                    best = hits.length;
                    start = min;
                }
            }
        });


// console.info('position=' + position + ' width=' + width + ' height=' + height + ' start=' + start);

        menu = selection.append('g')
            .attr('class', 'edit-menu')
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 1);

        menu.append('rect')
            .attr('class', 'edit-menu-background')
            .attr('x', start[0])
            .attr('y', start[1])
            .attr('width', width)
            .attr('height', height)
            .attr('rx', spacing / 2)
            .attr('ry', spacing / 2);

        var button = menu.selectAll()
            .data(operations)
            .enter().append('g')
            .attr('transform', function(d, i) {
                var col = (i % cols) + 1,
                    row = Math.floor(i / cols) + 1,
                    x = (start[0] + (spacing * col) - (spacing / 2)),
                    y = (start[1] + (spacing * row) - (spacing / 2));
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

        function mouseover(d) {
            // pin tooltip to bottom of editmenu..
            var rect = context.surfaceRect(),
                top = rect.top + start[1] + height + 'px',
                left = rect.left + start[0] + 'px';

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

    editMenu.position = function(_) {
        if (!arguments.length) return position;
        position = _;
        return editMenu;
    };

    return editMenu;
};
