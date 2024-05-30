describe('iD.svgLayers', function () {
    var context, container;
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        container = d3.select(document.createElement('div'));
    });


    it('creates a surface', function () {
        container.call(iD.svgLayers(projection, context));
        expect(container.selectAll('svg').classed('surface')).to.be.true;
    });

    it('creates surface defs', function () {
        container.call(iD.svgLayers(projection, context));
        var nodes = container.selectAll('svg defs').nodes();
        expect(nodes.length).to.eql(1);
        expect(d3.select(nodes[0]).classed('surface-defs')).to.be.true;
    });

    it('creates default data layers', function () {
        container.call(iD.svgLayers(projection, context));
        var nodes = container.selectAll('svg .data-layer').nodes();
        expect(nodes.length).to.eql(18);
        expect(d3.select(nodes[0]).classed('osm')).to.be.true;
        expect(d3.select(nodes[1]).classed('notes')).to.be.true;
        expect(d3.select(nodes[2]).classed('data')).to.be.true;
        expect(d3.select(nodes[3]).classed('keepRight')).to.be.true;
        expect(d3.select(nodes[4]).classed('improveOSM')).to.be.true;
        expect(d3.select(nodes[5]).classed('osmose')).to.be.true;
        expect(d3.select(nodes[6]).classed('streetside')).to.be.true;
        expect(d3.select(nodes[7]).classed('mapillary')).to.be.true;
        expect(d3.select(nodes[8]).classed('mapillary-position')).to.be.true;
        expect(d3.select(nodes[9]).classed('mapillary-map-features')).to.be.true;
        expect(d3.select(nodes[10]).classed('mapillary-signs')).to.be.true;
        expect(d3.select(nodes[11]).classed('kartaview')).to.be.true;
        expect(d3.select(nodes[12]).classed('mapilio')).to.be.true;
        expect(d3.select(nodes[13]).classed('vegbilder')).to.be.true;
        expect(d3.select(nodes[14]).classed('local-photos')).to.be.true;
        expect(d3.select(nodes[15]).classed('debug')).to.be.true;
        expect(d3.select(nodes[16]).classed('geolocate')).to.be.true;
        expect(d3.select(nodes[17]).classed('touch')).to.be.true;
    });

});
