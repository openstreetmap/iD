// Tooltips and svg mask used to highlight certain features
d3.curtain = function() {

    var event = d3.dispatch(),
        surface,
        tooltip,
        mask;

    function curtain(selection) {

        surface = selection.append('svg')
            .style({
                'z-index': 1000,
                'pointer-events': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0
            })
            .attr({
                width: window.innerWidth,
                height: window.innerHeight
            });

        var darkness = surface.append('rect')
            .attr({
                x: 0,
                y: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                'class': 'curtain-darkness',
                'mask': 'url(#mask)'
            });

        tooltip = selection.append('div')
            .attr('class', 'tooltip')
            .style('z-index', 1002);

        tooltip.append('div').attr('class', 'tooltip-arrow');
        tooltip.append('div').attr('class', 'tooltip-inner');

        mask = surface.append('defs')
            .append('mask').attr('id', 'mask');

        var maskrect = mask.append('rect')
            .style('fill', 'white')
            .attr({
                x: 0,
                y: 0,
                width: window.innerWidth,
                height: window.innerHeight
            });

        d3.select(window).on('resize.curtain', function() {
            var size = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            surface.attr(size);
            maskrect.attr(size);
            darkness.attr(size);
        });

    }

    curtain.hide = function() {
        curtain.cut();
        tooltip.classed('in', false);
    };

    curtain.reveal = function(box, text, tooltipclass, duration) {
        if (typeof box === 'string') box = d3.select(box).node();
        if (box.getBoundingClientRect) box = box.getBoundingClientRect();

        curtain.cut(box, duration);

        var pos;

        var w = window.innerWidth,
            h = window.innerHeight,
            twidth = 200;

        if (box.top + box.height < Math.min(100, box.width + box.left)) {
            side = 'bottom';
            pos = [box.left + box.width / 2 - twidth / 2, box.top + box.height];
        } else if (box.left + box.width + 300 < window.innerWidth) {
            side = 'right';
            pos = [box.left + box.width, box.top + box.height / 2];
        } else if (box.left > 300) {
            side = 'left';
            pos = [box.left - 200, box.top + box.height / 2];
        } else {
            side = 'bottom';
            pos = [box.left, box.top + box.height];
        }

        pos = [
            Math.min(Math.max(10, pos[0]), w - twidth - 10),
            Math.min(Math.max(10, pos[1]), h - 100 - 10)
        ];

        // pseudo markdown bold text hack
        var parts = text.split('**');
        var html = '<span>' + parts[0] + '</span>';
        if (parts[1]) html += '<span class="bold">' + parts[1] + '</span>';

        tooltip
            .style('top', pos[1] + 'px')
            .style('left', pos[0] + 'px')
            .attr('class', 'curtain-tooltip tooltip in ' + side + ' ' + tooltipclass)
            .select('.tooltip-inner')
                .html(html);

        if (duration !== 0) tooltip.call(iD.ui.Toggle(true));
    };

    curtain.cut = function(data, duration) {

        data = data ? [data] : [];
        var cutouts = mask.selectAll('.cutout')
            .data(data);

        var entered = cutouts.enter()
            .append('rect')
            .attr({
                left: function(d) { return d.left + d.width / 2; },
                top: function(d) { return d.top + d.height/ 2; },
                width: function(d) { return 0; },
                height: function(d) { return 0; },
                fill: 'black',
                'class': 'cutout'
            })
            .style('fill-opacity', 0);

        var all = mask.selectAll('.cutout');

        (duration === 0 ? all : all.transition().duration(duration || 600))
            .style('fill-opacity', 1)
            .attr('x', function(d) { return d.left; })
            .attr('y', function(d) { return d.top; })
            .attr('width', function(d) { return d.width; })
            .attr('height', function(d) { return d.height; });

        cutouts.exit().transition()
            .duration(500)
            .style('fill-opacity', 0)
            .attr('x', function(d) { return d.left + d.width / 2; })
            .attr('y', function(d) { return d.top + d.height / 2; })
            .attr('width', 0)
            .attr('height', 0)
            .remove();
    };

    curtain.remove = function() {
        surface.remove();
        tooltip.remove();
    };

    return d3.rebind(curtain, event, 'on');
};
