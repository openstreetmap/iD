describe('iD.svgOsm', function () {
    var container;

    beforeEach(function () {
        container = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    });

    it('creates default osm layers', function () {
        container.call(iD.svgOsm());
        var nodes = container.selectAll('.layer-osm').nodes();
        expect(nodes.length).to.eql(5);
        expect(d3.select(nodes[0])).to.be.classed('layer-areas');
        expect(d3.select(nodes[1])).to.be.classed('layer-lines');
        expect(d3.select(nodes[2])).to.be.classed('layer-hit');
        expect(d3.select(nodes[3])).to.be.classed('layer-halo');
        expect(d3.select(nodes[4])).to.be.classed('layer-label');
    });

});
