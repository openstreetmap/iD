describe('iD.svgOsm', function () {
    var container;

    beforeEach(function () {
        container = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    });

    it('creates default osm layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.layer-osm').nodes();
        expect(layers.length).to.eql(5);
        expect(d3.select(layers[0]).classed('layer-covered')).to.be.true;
        expect(d3.select(layers[1]).classed('layer-areas')).to.be.true;
        expect(d3.select(layers[2]).classed('layer-lines')).to.be.true;
        expect(d3.select(layers[3]).classed('layer-points')).to.be.true;
        expect(d3.select(layers[4]).classed('layer-labels')).to.be.true;
    });

    it('creates default osm point layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.layer-points g.layer-points-group').nodes();
        expect(layers.length).to.eql(5);
        expect(d3.select(layers[0]).classed('layer-points-points')).to.be.true;
        expect(d3.select(layers[1]).classed('layer-points-midpoints')).to.be.true;
        expect(d3.select(layers[2]).classed('layer-points-vertices')).to.be.true;
        expect(d3.select(layers[3]).classed('layer-points-turns')).to.be.true;
        expect(d3.select(layers[4]).classed('layer-points-targets')).to.be.true;
    });

    it('creates default osm label layers', function () {
        container.call(iD.svgOsm());
        var layers = container.selectAll('g.layer-labels g.layer-labels-group').nodes();
        expect(layers.length).to.eql(3);
        expect(d3.select(layers[0]).classed('layer-labels-halo')).to.be.true;
        expect(d3.select(layers[1]).classed('layer-labels-label')).to.be.true;
        expect(d3.select(layers[2]).classed('layer-labels-debug')).to.be.true;
    });

});
