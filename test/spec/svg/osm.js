describe('iD.svgOsm', function () {
    var container;

    beforeEach(function () {
        container = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    });

    it('creates default osm layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.layer-osm').nodes();
        expect(layers.length).to.eql(5);
        expect(d3.select(layers[0]).classed('covered')).to.be.true;
        expect(d3.select(layers[1]).classed('areas')).to.be.true;
        expect(d3.select(layers[2]).classed('lines')).to.be.true;
        expect(d3.select(layers[3]).classed('points')).to.be.true;
        expect(d3.select(layers[4]).classed('labels')).to.be.true;
    });

    it('creates default osm point layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.points-group').nodes();
        expect(layers.length).to.eql(4);
        expect(d3.select(layers[0]).classed('points')).to.be.true;
        expect(d3.select(layers[1]).classed('midpoints')).to.be.true;
        expect(d3.select(layers[2]).classed('vertices')).to.be.true;
        expect(d3.select(layers[3]).classed('turns')).to.be.true;
    });

});
