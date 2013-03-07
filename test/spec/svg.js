describe("iD.svg.LineString", function () {
    var projection = d3.geo.mercator();

    it("returns an SVG path description for the entity's nodes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [2, 3]}),
            way = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, way]);

        expect(iD.svg.LineString(projection, graph, [10, 10])(way)).to.equal('M480,250L482,245');
    });

    describe('resampling', function() {
        it("resamples a linestring", function () {
            var a = iD.Node({loc: [0, 0]}),
                b = iD.Node({loc: [10, 0]}),
                way = iD.Way({nodes: [a.id, b.id]}),
                graph = iD.Graph([a, b, way]);

            expect(iD.svg.LineString(projection, graph, [10, 10], 2)(way)).to.equal('M480,250L482,250L484,250L486,250L488,250L490,250L492,250L493,250');
        });

        it("does not resmample when no steps are possible", function () {
            var a = iD.Node({loc: [0, 0]}),
                b = iD.Node({loc: [10, 0]}),
                way = iD.Way({nodes: [a.id, b.id]}),
                graph = iD.Graph([a, b, way]);

            expect(iD.svg.LineString(projection, graph, [10, 10], 20)(way)).to.equal('M480,250L493,250');
        });
    });

    it("returns null for an entity with no nodes", function () {
        var way = iD.Way(),
            graph = iD.Graph([way]);

        expect(iD.svg.LineString(projection, graph, [10, 10])(way)).to.be.null;
    });
});
