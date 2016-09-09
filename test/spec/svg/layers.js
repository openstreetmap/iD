describe('iD.svg.Layers', function () {
    var context, container,
        projection = d3.geoProjection(function(x, y) { return [x, -y]; })
            .translate([0, 0])
            .scale(180 / Math.PI)
            .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.Context(window);
        container = d3.select(document.createElement('div'));
    });


    it('creates a surface', function () {
        container.call(iD.svg.Layers(projection, context));
        expect(container.selectAll('svg')).to.be.classed('surface');
    });

    it('creates default data layers', function () {
        container.call(iD.svg.Layers(projection, context));
        var nodes = container.selectAll('svg .data-layer').nodes();
        expect(nodes.length).to.eql(5);
        expect(d3.select(nodes[0])).to.be.classed('data-layer-osm');
        expect(d3.select(nodes[1])).to.be.classed('data-layer-gpx');
        expect(d3.select(nodes[2])).to.be.classed('data-layer-mapillary-images');
        expect(d3.select(nodes[3])).to.be.classed('data-layer-mapillary-signs');
        expect(d3.select(nodes[4])).to.be.classed('data-layer-debug');
    });

});
