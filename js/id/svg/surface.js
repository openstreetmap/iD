iD.svg.Surface = function() {
    return function(selection) {
        selection.append('defs')
            .append('clipPath')
                .attr('id', 'clip')
            .append('rect')
                .attr('id', 'clip-rect')
                .attr({ x: 0, y: 0 });

        var clip = selection.append('g')
            .attr('clip-path', 'url(#clip)');

        var layers = clip.selectAll('.layer')
            .data(['fill', 'casing', 'stroke', 'text', 'hit']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-' + d; });
    };
};
