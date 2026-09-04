import { geoProjection as d3_geoProjection } from 'd3-geo';
import { select as d3_select } from 'd3-selection';


describe('iD.svgPoints', function () {
    var context, surface;
    var projection = d3_geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        d3_select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map().centerZoom([0, 0], 17));
        surface = context.surface();
    });


    it('adds tag classes', function () {
        var point = new iD.osmNode({tags: {amenity: 'cafe'}, loc: [0, 0]});
        var graph = new iD.coreGraph([point]);

        surface.call(iD.svgPoints(projection, context), graph, [point]);

        expect(surface.select('.point').classed('tag-amenity')).toBe(true);
        expect(surface.select('.point').classed('tag-amenity-cafe')).toBe(true);
    });
});
