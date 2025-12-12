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
        expect(nodes.map(node => node.className.baseVal)).toStrictEqual([
            'data-layer osm',
            'data-layer notes',
            'data-layer data',
            'data-layer osmose',
            'data-layer streetside',
            'data-layer commons',
            'data-layer mapillary',
            'data-layer mapillary-position',
            'data-layer mapillary-map-features',
            'data-layer mapillary-signs',
            'data-layer kartaview',
            'data-layer mapilio',
            'data-layer vegbilder',
            'data-layer panoramax',
            'data-layer local-photos',
            'data-layer debug',
            'data-layer geolocate',
            'data-layer touch',
        ]);
    });

});
