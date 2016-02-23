iD.svg.Osm = function() {
    return function (selection) {
        var layers = selection.selectAll('.layer-osm')
            .data(['areas', 'lines', 'hit', 'halo', 'label']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-osm layer-' + d; });
    };
};
