describe("iD.actions.Move", function() {
    describe("#enabled", function() {
        it("returns true by default", function() {
            var node  = iD.Node({loc: [0, 0]}),
                action = iD.actions.Move([node.id], [0, 0], d3.geo.mercator()),
                graph = iD.Graph([node]);
            expect(action.enabled(graph)).to.be.true;
        });

        it("returns false for an incomplete relation", function() {
            var relation = iD.Relation({members: [{id: 1}]}),
                action = iD.actions.Move([relation.id], [0, 0], d3.geo.mercator()),
                graph = iD.Graph([relation]);
            expect(action.enabled(graph)).to.be.false;
        });

        it("returns true for a complete relation", function() {
            var node  = iD.Node({loc: [0, 0]}),
                relation = iD.Relation({members: [{id: node.id}]}),
                action = iD.actions.Move([relation.id], [0, 0], d3.geo.mercator()),
                graph = iD.Graph([node, relation]);
            expect(action.enabled(graph)).to.be.true;
        });
    });

    it("moves all nodes in a way by the given amount", function() {
        var node1  = iD.Node({loc: [0, 0]}),
            node2  = iD.Node({loc: [5, 10]}),
            way    = iD.Way({nodes: [node1.id, node2.id]}),
            delta  = [2, 3],
            projection = d3.geo.mercator(),
            graph  = iD.actions.Move([way.id], delta, projection)(iD.Graph([node1, node2, way])),
            loc1   = graph.entity(node1.id).loc,
            loc2   = graph.entity(node2.id).loc;
        expect(loc1[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc1[1]).to.be.closeTo(-2.159, 0.001);
        expect(loc2[0]).to.be.closeTo( 6.440, 0.001);
        expect(loc2[1]).to.be.closeTo( 7.866, 0.001);
    });

    it("moves repeated nodes only once", function() {
        var node   = iD.Node({loc: [0, 0]}),
            way    = iD.Way({nodes: [node.id, node.id]}),
            delta  = [2, 3],
            projection = d3.geo.mercator(),
            graph  = iD.actions.Move([way.id], delta, projection)(iD.Graph([node, way])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it("moves multiple ways", function() {
        var node   = iD.Node({loc: [0, 0]}),
            way1   = iD.Way({nodes: [node.id]}),
            way2   = iD.Way({nodes: [node.id]}),
            delta  = [2, 3],
            projection = d3.geo.mercator(),
            graph  = iD.actions.Move([way1.id, way2.id], delta, projection)(iD.Graph([node, way1, way2])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it("moves leaf nodes of a relation", function() {
        var node     = iD.Node({loc: [0, 0]}),
            way      = iD.Way({nodes: [node.id]}),
            relation = iD.Relation({members: [{id: way.id}]}),
            delta    = [2, 3],
            projection = d3.geo.mercator(),
            graph    = iD.actions.Move([relation.id], delta, projection)(iD.Graph([node, way, relation])),
            loc      = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });
});
