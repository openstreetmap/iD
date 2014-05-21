iD.svg.Surface = function() {
    return function (selection) {
        var layers = selection.selectAll('.layer')
            .data(['fill', 'shadow', 'casing', 'stroke', 'oneway', 'hit', 'halo', 'label']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-' + d; });
    };
};
