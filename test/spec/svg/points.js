describe('iD.svgPoints', function () {
    var context, surface;
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.coreContext().init();
        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map().centerZoom([0, 0], 17));
        surface = context.surface();
    });


    it('adds tag classes', function () {
        var point = iD.osmNode({tags: {amenity: 'cafe'}, loc: [0, 0]});
        var graph = iD.coreGraph([point]);

        surface.call(iD.svgPoints(projection, context), graph, [point]);

        expect(surface.select('.point').classed('tag-amenity')).to.be.true;
        expect(surface.select('.point').classed('tag-amenity-cafe')).to.be.true;
    });
});
