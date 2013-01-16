d3.tooltip = function() {
    var text, on = false, container, tooltip_size, container_size,
        transformProp = iD.util.prefixCSSProperty('Transform');

    var tooltip = function(selection) {
        function setup() {
            var rect = selection.node().getBoundingClientRect();
            container = d3.select(document.body)
                .append('div').attr('class', 'mouse-tooltip')
                .style({
                    position: 'absolute'
                });

            selection
                .on('mousemove.tooltip', mousemove);

            container_size = container.size();
        }

        function mousemove() {
            if (!on) return;
            container.style(transformProp, 'translate(' +
                ~~d3.event.x + 'px,' +
                ~~d3.event.y + 'px)');
        }

        if (!container) setup();
    };

    tooltip.text = function(_) {
        if (_ === false) {
            on = false;
            container.style('display', 'none');
            return tooltip;
        } else if (container.style('display') == 'none') {
            container.style('display', 'block');
        }
        on = true;
        text = _;
        container.text(text);
        size = container.size();
        return tooltip;
    };

    return tooltip;
};
