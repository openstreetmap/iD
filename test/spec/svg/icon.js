describe("iD.svg.Icon", function () {
    var selection;

    beforeEach(function () {
        selection = d3.select(document.createElement('div'));
    });

    it("creates a generic SVG icon", function () {
        selection.call(iD.svg.Icon('#icon-bug'));
        expect(selection.select('svg')).to.be.classed('icon');
        expect(selection.select('use').attr('xlink:href')).to.eql('#icon-bug');
    });

    it("classes the 'svg' and 'use' elements", function () {
        selection.call(iD.svg.Icon('#icon-bug', 'svg-class', 'use-class'));
        expect(selection.select('svg')).to.be.classed('icon svg-class');
        expect(selection.select('use')).to.be.classed('use-class');
    });
});
