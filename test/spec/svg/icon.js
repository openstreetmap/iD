import { select as d3_select } from 'd3-selection';

describe('iD.svgIcon', function () {
    var selection;

    beforeEach(function () {
        selection = d3_select(document.createElement('div'));
    });

    it('creates a generic SVG icon', function () {
        selection.call(iD.svgIcon('#iD-icon-bug'));
        expect(selection.select('svg').classed('icon')).toBe(true);
        expect(selection.select('use').attr('xlink:href')).toEqual('#iD-icon-bug');
    });

    it('classes the \'svg\' and \'use\' elements', function () {
        selection.call(iD.svgIcon('#iD-icon-bug', 'svg-class', 'use-class'));
        expect(selection.select('svg').classed('icon svg-class')).toBe(true);
        expect(selection.select('use').classed('use-class')).toBe(true);
    });
});
