describe('iD.svgVertices', function () {
    var context, surface,
        projection = d3.geoProjection(function(x, y) { return [x, -y]; })
            .translate([0, 0])
            .scale(180 / Math.PI)
            .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.Context();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map());
        surface = context.surface();
    });


    it('adds the .shared class to vertices that are members of two or more ways', function () {
        var zoom = 17,
            node = iD.Node({loc: [0, 0]}),
            way1 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
            way2 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
            graph = iD.Graph([node, way1, way2]);

        surface.call(iD.svgVertices(projection, context), graph, [node], zoom);

        expect(surface.select('.vertex').classed('shared')).to.be.true;
    });
});
