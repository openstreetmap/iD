import { select as d3_select } from 'd3-selection';

describe('iD.svgOsm', function () {
    var container;

    beforeEach(function () {
        container = d3_select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    });

    it('creates default osm layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.layer-osm').nodes();
        expect(layers.length).toEqual(6);
        expect(d3_select(layers[0]).classed('covered')).toBe(true);
        expect(d3_select(layers[1]).classed('areas')).toBe(true);
        expect(d3_select(layers[2]).classed('lines')).toBe(true);
        expect(d3_select(layers[3]).classed('points')).toBe(true);
        expect(d3_select(layers[4]).classed('auxiliary')).toBe(true);
        expect(d3_select(layers[5]).classed('labels')).toBe(true);
    });

    it('creates default osm point layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.points-group').nodes();
        expect(layers.length).toEqual(4);
        expect(d3_select(layers[0]).classed('vertices')).toBe(true);
        expect(d3_select(layers[1]).classed('midpoints')).toBe(true);
        expect(d3_select(layers[2]).classed('points')).toBe(true);
        expect(d3_select(layers[3]).classed('turns')).toBe(true);
    });

});
