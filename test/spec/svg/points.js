describe('iD.svgPoints', function () {
    var context, surface,
        projection = d3.geoProjection(function(x, y) { return [x, -y]; })
            .translate([0, 0])
            .scale(180 / Math.PI)
            .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.Context();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map());
        surface = context.surface();
    });


    it('adds tag classes', function () {
        var point = iD.Node({tags: {amenity: 'cafe'}, loc: [0, 0]}),
            graph = iD.Graph([point]);

        surface.call(iD.svgPoints(projection, context), graph, [point]);

        expect(surface.select('.point')).to.be.classed('tag-amenity');
        expect(surface.select('.point')).to.be.classed('tag-amenity-cafe');
    });
});
