describe("iD.svg.LineString", function () {
    it("returns an SVG path description for the entity's nodes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [2, 3]}),
            way = iD.Way({nodes: [a, b]}),
            projection = Object;

        expect(iD.svg.LineString(projection)(way)).to.equal("M0,0L2,3");
    });

    it("returns null for an entity with no nodes", function () {
        var way = iD.Way(),
            projection = Object;

        expect(iD.svg.LineString(projection)(way)).to.be.null;
    });
});
