describe('iD.svgVertices', function () {
    let context;
    let surface;
    const projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map().centerZoom([0, 0], 17));
        surface = context.surface();
    });


    it('adds the .shared class to vertices that are members of two or more ways', function () {
        const node = iD.osmNode({loc: [0, 0]});
        const way1 = iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}});
        const way2 = iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}});
        const graph = iD.coreGraph([node, way1, way2]);
        const filter = function() { return true; };
        const extent = iD.geoExtent([0, 0], [1, 1]);

        surface.call(iD.svgVertices(projection, context), graph, [node], filter, extent);
        expect(surface.select('.vertex').classed('shared')).to.be.true;
    });
});
