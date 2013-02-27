d3.tail = function() {
    var text = false,
        container,
        xmargin = 25,
        tooltip_size = [0, 0],
        selection_size = [0, 0],
        transformProp = iD.util.prefixCSSProperty('Transform');

    var tail = function(selection) {

        d3.select(window).on('resize.tail-size', function() {
            selection_size = selection.size();
        });

        function setup() {

            container = d3.select(document.body)
                .append('div')
                    .style('display', 'none')
                    .attr('class', 'tail tooltip-inner');

            selection
                .on('mousemove.tail', mousemove)
                .on('mouseover.tail', mouseover)
                .on('mouseout.tail', mouseout);

            container
                .on('mousemove.tail', mousemove);

            selection_size = selection.size();

        }

        function show() {
            container.style('display', 'block');
            tooltip_size = container.size();
        }

        function mousemove() {
            if (text === false) return;
            if (container.style('display') === 'none') show();
            var xoffset = ((d3.event.clientX + tooltip_size[0] + xmargin) > selection_size[0]) ?
                -tooltip_size[0] - xmargin : xmargin;
            container.classed('left', xoffset > 0);
            container.style(transformProp, 'translate(' +
                (~~d3.event.clientX + xoffset) + 'px,' +
                ~~d3.event.clientY + 'px)');
        }

        function mouseout() {
            if (d3.event.relatedTarget !== container.node() &&
                text !== false) container.style('display', 'none');
        }

        function mouseover() {
            if (d3.event.relatedTarget !== container.node() &&
                text !== false) show();
        }

        if (!container) setup();

    };

    tail.text = function(_) {
        if (!arguments.length) return text;
        if (_ === false) {
            text = _;
            container.style('display', 'none');
            return tail;
        }
        text = _;
        container.text(text);
        tooltip_size = container.size();
        return tail;
    };

    return tail;
};
