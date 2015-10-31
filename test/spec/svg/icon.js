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

    it("creates a classed SVG icon", function () {
        selection.call(iD.svg.Icon('#icon-bug', 'icon-light'));
        expect(selection.select('svg')).to.be.classed('icon');
        expect(selection.select('use').attr('xlink:href')).to.eql('#icon-bug');
        expect(selection.select('use')).to.be.classed('icon-light');
    });

});
