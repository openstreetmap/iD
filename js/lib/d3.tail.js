d3.tail = function() {
    var text = false,
        container,
        xmargin = 20,
        tooltip_size = [0, 0],
        selection_size = [0, 0],
        transformProp = iD.util.prefixCSSProperty('Transform');

    var tail = function(selection) {

        d3.select(window).on('resize.tail-size', function() {
            selection_size = selection.size();
        });

        function setup() {

            container = d3.select(document.body)
                .append('div').attr('class', 'tail');

            selection
                .on('mousemove.tail', mousemove)
                .on('mouseover.tail', mouseover)
                .on('mouseout.tail', mouseout);

            container
                .on('mousemove.tail', mousemove);

            selection_size = selection.size();

        }

        function mousemove() {
            if (text === false) return;
            var xoffset = ((d3.event.x + tooltip_size[0] + xmargin) > selection_size[0]) ?
                -tooltip_size[0] - xmargin : xmargin;
            container.style(transformProp, 'translate(' +
                (~~d3.event.x + xoffset) + 'px,' +
                ~~d3.event.y + 'px)');
        }

        function mouseout() {
            if (d3.event.relatedTarget !== container.node() &&
                text !== false) container.style('display', 'none');
        }

        function mouseover() {
            if (d3.event.relatedTarget !== container.node() &&
                text !== false) container.style('display', 'block');
        }

        if (!container) setup();

    };

    tail.text = function(_) {
        if (!arguments.length) return text;
        if (_ === false) {
            text = _;
            container.style('display', 'none');
            return tail;
        } else if (container.style('display') == 'none') {
            container.style('display', 'block');
        }
        text = _;
        container.text(text);
        tooltip_size = container.size();
        return tail;
    };

    return tail;
};
