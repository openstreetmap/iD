describe("iD.actions.SplitWay", function () {
    it("creates a new way with the appropriate nodes", function () {
        // Situation:
        //    a ---- b ---- c
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c
        //
        var a     = iD.Node(),
            b     = iD.Node(),
            c     = iD.Node(),
            way   = iD.Way({nodes: [a.id, b.id, c.id]}),
            graph = iD.Graph([a, b, c, way]);

        graph = iD.actions.SplitWay(b.id)(graph);

        var waysA = graph.parentWays(a),
            waysB = graph.parentWays(b),
            waysC = graph.parentWays(c);

        expect(waysA).to.have.length(1);
        expect(waysB).to.have.length(2);
        expect(waysC).to.have.length(1);

        expect(waysA[0]).to.equal(waysB[0]);
        expect(waysB[1]).to.equal(waysC[0]);
    });

    it("copies tags to the new way", function () {
        var a     = iD.Node(),
            b     = iD.Node(),
            c     = iD.Node(),
            tags  = {highway: 'residential'},
            way   = iD.Way({nodes: [a.id, b.id, c.id], tags: tags}),
            graph = iD.Graph([a, b, c, way]);

        graph = iD.actions.SplitWay(b.id)(graph);

        expect(graph.parentWays(a)[0].tags).to.eql(tags);
        expect(graph.parentWays(c)[0].tags).to.eql(tags);
    });

    it("moves restriction relations to the new way", function () {
        // Situation:
        //    a ==== b ==== c ---- d
        // A restriction from ==== to ---- via c.
        //
        // Split at b.
        //
        // Expected result:
        //    a ==== b ≠≠≠≠ c ---- d
        // A restriction from ≠≠≠≠ to ---- via c.
        //
        var a           = iD.Node(),
            b           = iD.Node(),
            c           = iD.Node(),
            d           = iD.Node(),
            from        = iD.Way({nodes: [a.id, b.id, c.id]}),
            to          = iD.Way({nodes: [c.id, d.id]}),
            restriction = iD.Relation({tags: {type: 'restriction'}, members: [
                { role: 'from', id: from.id },
                { role: 'to', id: to.id },
                { role: 'via', id: c.id }]}),
            graph = iD.Graph([a, b, c, d, from, to, restriction]);

        graph = iD.actions.SplitWay(b.id)(graph);

        restriction = graph.entity(restriction.id);

        expect(restriction.members[0]).not.to.eql({ role: 'from', id: from.id });
        expect(restriction.members[1]).to.eql({ role: 'to', id: to.id });
        expect(restriction.members[2]).to.eql({ role: 'via', id: c.id });
    });
});
