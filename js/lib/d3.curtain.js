// Tooltips and svg mask used to highlight certain features
d3.curtain = function() {

    var event = d3.dispatch(),
        surface,
        tooltip,
        darkness;

    function curtain(selection) {

        surface = selection.append('svg')
            .attr('id', 'curtain')
            .style({
                'z-index': 1000,
                'pointer-events': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0
            });

        darkness = surface.append('path')
            .attr({
                x: 0,
                y: 0,
                'class': 'curtain-darkness'
            });

        d3.select(window).on('resize.curtain', resize);

        tooltip = selection.append('div')
            .attr('class', 'tooltip')
            .style('z-index', 1002);

        tooltip.append('div').attr('class', 'tooltip-arrow');
        tooltip.append('div').attr('class', 'tooltip-inner');

        resize();

        function resize() {
            surface.attr({
                width: window.innerWidth,
                height: window.innerHeight
            });
            curtain.cut(darkness.datum());
        }
    }

    curtain.reveal = function(box, text, tooltipclass, duration) {
        if (typeof box === 'string') box = d3.select(box).node();
        if (box.getBoundingClientRect) box = box.getBoundingClientRect();

        curtain.cut(box, duration);

        if (text) {
            // pseudo markdown bold text hack
            var parts = text.split('**');
            var html = parts[0] ? '<span>' + parts[0] + '</span>' : '';
            if (parts[1]) html += '<span class="bold">' + parts[1] + '</span>';

            var dimensions = tooltip.classed('in', true)
                .select('.tooltip-inner')
                    .html(html)
                    .dimensions();

            var pos;

            var w = window.innerWidth,
                h = window.innerHeight;

            if (box.top + box.height < Math.min(100, box.width + box.left)) {
                side = 'bottom';
                pos = [box.left + box.width / 2 - dimensions[0]/ 2, box.top + box.height];

            } else if (box.left + box.width + 300 < window.innerWidth) {
                side = 'right';
                pos = [box.left + box.width, box.top + box.height / 2 - dimensions[1] / 2];

            } else if (box.left > 300) {
                side = 'left';
                pos = [box.left - 200, box.top + box.height / 2 - dimensions[1] / 2];
            } else {
                side = 'bottom';
                pos = [box.left, box.top + box.height];
            }

            pos = [
                Math.min(Math.max(10, pos[0]), w - dimensions[0] - 10),
                Math.min(Math.max(10, pos[1]), h - dimensions[1] - 10)
            ];


            if (duration !== 0 || !tooltip.classed(side)) tooltip.call(iD.ui.Toggle(true));

            tooltip
                .style('top', pos[1] + 'px')
                .style('left', pos[0] + 'px')
                .attr('class', 'curtain-tooltip tooltip in ' + side + ' ' + tooltipclass)
                .select('.tooltip-inner')
                    .html(html);

        } else {
            tooltip.call(iD.ui.Toggle(false));
        }
    };

    curtain.cut = function(datum, duration) {
        darkness.datum(datum);

        (duration === 0 ? darkness : darkness.transition().duration(duration || 600))
            .attr('d', function(d) {
                var string = "M 0,0 L 0," + window.innerHeight + " L " +
                    window.innerWidth + "," + window.innerHeight + "L" +
                    window.innerWidth + ",0 Z";

                if (!d) return string;
                return string + 'M' +
                    d.left + ',' + d.top + 'L' +
                    d.left + ',' + (d.top + d.height) + 'L' +
                    (d.left + d.width) + ',' + (d.top + d.height) + 'L' +
                    (d.left + d.width) + ',' + (d.top) + 'Z';

            });
    };

    curtain.remove = function() {
        surface.remove();
        tooltip.remove();
    };

    return d3.rebind(curtain, event, 'on');
};
