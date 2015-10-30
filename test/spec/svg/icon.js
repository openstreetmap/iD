describe("iD.svg.Icon", function () {
    var selection;

    beforeEach(function () {
        selection = d3.select(document.createElement('div'));
    });

    it("creates an SVG icon", function () {
        selection.call(iD.svg.Icon('#icon-bug'));
        expect(selection.select('svg')).to.be.classed('icon');
        expect(selection.select('use').attr('xlink:href')).to.eql('#icon-bug');
    });
});
