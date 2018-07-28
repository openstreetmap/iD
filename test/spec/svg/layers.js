describe('iD.svgLayers', function () {
    var context, container;
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.coreContext();
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
        expect(nodes.length).to.eql(10);
<<<<<<< HEAD
        expect(d3.select(nodes[0]).classed('osm')).to.be.true;
        expect(d3.select(nodes[1]).classed('notes')).to.be.true;
        expect(d3.select(nodes[2]).classed('data')).to.be.true;
        expect(d3.select(nodes[3]).classed('streetside')).to.be.true;
        expect(d3.select(nodes[4]).classed('mapillary-images')).to.be.true;
        expect(d3.select(nodes[5]).classed('mapillary-signs')).to.be.true;
        expect(d3.select(nodes[6]).classed('openstreetcam-images')).to.be.true;
        expect(d3.select(nodes[7]).classed('debug')).to.be.true;
        expect(d3.select(nodes[8]).classed('geolocate')).to.be.true;
        expect(d3.select(nodes[9]).classed('touch')).to.be.true;
=======
        expect(d3.select(nodes[0]).classed('data-layer-osm')).to.be.true;
        expect(d3.select(nodes[1]).classed('data-layer-notes')).to.be.true;
        expect(d3.select(nodes[2]).classed('data-layer-keepRight')).to.be.true;
        expect(d3.select(nodes[3]).classed('data-layer-gpx')).to.be.true;
        expect(d3.select(nodes[4]).classed('data-layer-mvt')).to.be.true;
        expect(d3.select(nodes[5]).classed('data-layer-streetside')).to.be.true;
        expect(d3.select(nodes[6]).classed('data-layer-mapillary-images')).to.be.true;
        expect(d3.select(nodes[7]).classed('data-layer-mapillary-signs')).to.be.true;
        expect(d3.select(nodes[8]).classed('data-layer-openstreetcam-images')).to.be.true;
        expect(d3.select(nodes[9]).classed('data-layer-debug')).to.be.true;
>>>>>>> displaying keep right (currently as notes)
    });

});
