describe('iD.svgOsm', function () {
    var container;

    beforeEach(function () {
        container = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    });

    it('creates default osm layers', function () {
        container.call(iD.svgOsm());
        var nodes = container.selectAll('.layer-osm').nodes();
        expect(nodes.length).to.eql(5);
        expect(d3.select(nodes[0]).classed('layer-areas')).to.be.true;
        expect(d3.select(nodes[1]).classed('layer-lines')).to.be.true;
        expect(d3.select(nodes[2]).classed('layer-hit')).to.be.true;
        expect(d3.select(nodes[3]).classed('layer-halo')).to.be.true;
        expect(d3.select(nodes[4]).classed('layer-label')).to.be.true;
    });

});
