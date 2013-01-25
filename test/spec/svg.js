describe("iD.svg.LineString", function () {
    it("returns an SVG path description for the entity's nodes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [2, 3]}),
            way = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, way]),
            projection = Object;

        expect(iD.svg.LineString(projection, graph)(way)).to.equal("M0,0L2,3");
    });

    it("returns null for an entity with no nodes", function () {
        var way = iD.Way(),
            graph = iD.Graph([way]),
            projection = Object;

        expect(iD.svg.LineString(projection, graph)(way)).to.be.null;
    });
});
