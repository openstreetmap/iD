describe('iD.svgVertices', function () {
    var TAU = 2 * Math.PI;
    function ztok(z) { return 256 * Math.pow(2, z) / TAU; }

    var context;
    var surface;
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(ztok(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.Context();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map());
        surface = context.surface();
    });


    it('adds the .shared class to vertices that are members of two or more ways', function () {
        var node = iD.Node({loc: [0, 0]});
        var way1 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}});
        var way2 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}});
        var graph = iD.Graph([node, way1, way2]);

        surface.call(iD.svgVertices(projection, context), graph, [node]);
        expect(surface.select('.vertex').classed('shared')).to.be.true;
    });
});
