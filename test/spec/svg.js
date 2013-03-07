describe("iD.svg.LineString", function () {
    it("returns an SVG path description for the entity's nodes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [2, 3]}),
            way = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, way]),
            projection = Object;

        expect(iD.svg.LineString(projection, graph, [10, 10])(way)).to.equal("M0,0L2,3");
    });

    describe('resampling', function() {
        it("resamples a linestring", function () {
            var a = iD.Node({loc: [0, 0]}),
                b = iD.Node({loc: [10, 0]}),
                way = iD.Way({nodes: [a.id, b.id]}),
                graph = iD.Graph([a, b, way]),
                projection = Object;

            expect(iD.svg.LineString(projection, graph, [10, 10], 2)(way)).to.equal('M0,0L2,0L4,0L6,0L8,0L10,0');
        });

        it("does not resmample when no steps are possible", function () {
            var a = iD.Node({loc: [0, 0]}),
                b = iD.Node({loc: [10, 0]}),
                way = iD.Way({nodes: [a.id, b.id]}),
                graph = iD.Graph([a, b, way]),
                projection = Object;

            expect(iD.svg.LineString(projection, graph, [10, 10], 20)(way)).to.equal('M0,0L10,0');
        });
    });

    it("returns null for an entity with no nodes", function () {
        var way = iD.Way(),
            graph = iD.Graph([way]),
            projection = Object;

        expect(iD.svg.LineString(projection, graph, [10, 10])(way)).to.be.null;
    });
});
