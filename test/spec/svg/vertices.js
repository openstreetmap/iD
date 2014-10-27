describe("iD.svg.Vertices", function () {
    var surface,
        projection = Object,
        context;

    beforeEach(function () {
        context = iD();
        context.map().zoom(context.minEditableZoom());
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface(context));
    });

    it("adds the .shared class to vertices that are members of two or more ways", function () {
        var node = iD.Node({loc: [0, 0]}),
            way1 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
            way2 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
            graph = iD.Graph([node, way1, way2]);

        surface.call(iD.svg.Vertices(projection, context), graph, [node], 17);
        expect(surface.select('.vertex')).to.be.classed('shared');
    });

    it("no vertices are drawn if map is not editable", function () {
        var node = iD.Node({loc: [0, 0], tags: {amenity: 'atm'}}),
            way = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
            graph = iD.Graph([node, way]);

        context.map().zoom(context.minEditableZoom() - 1);
        surface.call(iD.svg.Vertices(projection, context), graph, [node], 17);

        expect(surface.select('.vertex').empty()).to.be.true;

    });
});
