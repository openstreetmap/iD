iD.svg.Surface = function() {
    return function drawSurface(selection) {
        selection.append('defs');

        var layers = selection.selectAll('.layer')
            .data(['fill', 'shadow', 'casing', 'stroke', 'text', 'hit', 'halo', 'label']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-' + d; });
    };
};
