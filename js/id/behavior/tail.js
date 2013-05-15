iD.behavior.Tail = function() {
    var text,
        container,
        xmargin = 25,
        tooltip_size = [0, 0],
        selection_size = [0, 0],
        transformProp = iD.util.prefixCSSProperty('Transform');

    function tail(selection) {
        if (!text) return;

        d3.select(window)
            .on('resize.tail', function() { selection_size = selection.size(); });

        function show() {
            container.style('display', 'block');
            tooltip_size = container.size();
        }

        function mousemove() {
            if (container.style('display') === 'none') show();
            var xoffset = ((d3.event.clientX + tooltip_size[0] + xmargin) > selection_size[0]) ?
                -tooltip_size[0] - xmargin : xmargin;
            container.classed('left', xoffset > 0);
            container.style(transformProp, 'translate(' +
                (~~d3.event.clientX + xoffset) + 'px,' +
                ~~d3.event.clientY + 'px)');
        }

        function mouseout() {
            if (d3.event.relatedTarget !== container.node()) {
                container.style('display', 'none');
            }
        }

        function mouseover() {
            if (d3.event.relatedTarget !== container.node()) {
                show();
            }
        }

        container = d3.select(document.body)
            .append('div')
            .style('display', 'none')
            .attr('class', 'tail tooltip-inner');

        container.append('div')
            .text(text);

        selection
            .on('mousemove.tail', mousemove)
            .on('mouseover.tail', mouseover)
            .on('mouseout.tail', mouseout);

        container
            .on('mousemove.tail', mousemove);

        tooltip_size = container.size();
        selection_size = selection.size();
    }

    tail.off = function(selection) {
        if (!text) return;

        container
            .on('mousemove.tail', null)
            .remove();

        selection
            .on('mousemove.tail', null)
            .on('mouseover.tail', null)
            .on('mouseout.tail', null);

        d3.select(window)
            .on('resize.tail', null);
    };

    tail.text = function(_) {
        if (!arguments.length) return text;
        text = _;
        return tail;
    };

    return tail;
};
