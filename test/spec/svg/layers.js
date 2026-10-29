import { select as d3_select } from 'd3-selection';
import { geoProjection as d3_geoProjection } from 'd3-geo';

describe('iD.svgLayers', function () {
    var context, container;
    var projection = d3_geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        container = d3_select(document.createElement('div'));
    });


    it('creates a surface', function () {
        container.call(iD.svgLayers(projection, context));
        expect(container.selectAll('svg').classed('surface')).toBe(true);
    });

    it('creates surface defs', function () {
        container.call(iD.svgLayers(projection, context));
        var nodes = container.selectAll('svg defs').nodes();
        expect(nodes.length).toEqual(1);
        expect(d3_select(nodes[0]).classed('surface-defs')).toBe(true);
    });

    it('creates default data layers', function () {
        container.call(iD.svgLayers(projection, context));
        var nodes = container.selectAll('svg .data-layer').nodes();
        expect(nodes.length).toEqual(17);
        /* eslint-disable no-useless-assignment */
        let i = 0;
        expect(d3_select(nodes[i++]).classed('osm')).toBe(true);
        expect(d3_select(nodes[i++]).classed('notes')).toBe(true);
        expect(d3_select(nodes[i++]).classed('data')).toBe(true);
        expect(d3_select(nodes[i++]).classed('osmose')).toBe(true);
        expect(d3_select(nodes[i++]).classed('streetside')).toBe(true);
        expect(d3_select(nodes[i++]).classed('mapillary')).toBe(true);
        expect(d3_select(nodes[i++]).classed('mapillary-position')).toBe(true);
        expect(d3_select(nodes[i++]).classed('mapillary-map-features')).toBe(true);
        expect(d3_select(nodes[i++]).classed('mapillary-signs')).toBe(true);
        expect(d3_select(nodes[i++]).classed('kartaview')).toBe(true);
        expect(d3_select(nodes[i++]).classed('mapilio')).toBe(true);
        expect(d3_select(nodes[i++]).classed('vegbilder')).toBe(true);
        expect(d3_select(nodes[i++]).classed('panoramax')).toBe(true);
        expect(d3_select(nodes[i++]).classed('local-photos')).toBe(true);
        expect(d3_select(nodes[i++]).classed('debug')).toBe(true);
        expect(d3_select(nodes[i++]).classed('geolocate')).toBe(true);
        expect(d3_select(nodes[i++]).classed('touch')).toBe(true);
        /* eslint-enable no-useless-assignment */
    });

});
