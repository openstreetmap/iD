describe('iD.actionMove', function() {
    var projection = d3.geoMercator().scale(250 / Math.PI);

    // This was moved to operationMove.  We should test operations and move this test there.
    // describe('#disabled', function() {
    //     it('returns falsy by default', function() {
    //         var node  = iD.osmNode({loc: [0, 0]}),
    //             action = iD.actionMove([node.id], [0, 0], projection),
    //             graph = iD.coreGraph([node]);
    //         expect(action.disabled(graph)).not.to.be.ok;
    //     });

    //     it('returns \'incomplete_relation\' for an incomplete relation', function() {
    //         var relation = iD.osmRelation({members: [{id: 1}]}),
    //             action = iD.actionMove([relation.id], [0, 0], projection),
    //             graph = iD.coreGraph([relation]);
    //         expect(action.disabled(graph)).to.equal('incomplete_relation');
    //     });

    //     it('returns falsy for a complete relation', function() {
    //         var node  = iD.osmNode({loc: [0, 0]}),
    //             relation = iD.osmRelation({members: [{id: node.id}]}),
    //             action = iD.actionMove([relation.id], [0, 0], projection),
    //             graph = iD.coreGraph([node, relation]);
    //         expect(action.disabled(graph)).not.to.be.ok;
    //     });
    // });

    it('moves all nodes in a way by the given amount', function() {
        var node1  = iD.osmNode({loc: [0, 0]}),
            node2  = iD.osmNode({loc: [5, 10]}),
            way    = iD.osmWay({nodes: [node1.id, node2.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way.id], delta, projection)(iD.coreGraph([node1, node2, way])),
            loc1   = graph.entity(node1.id).loc,
            loc2   = graph.entity(node2.id).loc;
        expect(loc1[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc1[1]).to.be.closeTo(-2.159, 0.001);
        expect(loc2[0]).to.be.closeTo( 6.440, 0.001);
        expect(loc2[1]).to.be.closeTo( 7.866, 0.001);
    });

    it('moves repeated nodes only once', function() {
        var node   = iD.osmNode({loc: [0, 0]}),
            way    = iD.osmWay({nodes: [node.id, node.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way.id], delta, projection)(iD.coreGraph([node, way])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it('moves multiple ways', function() {
        var node   = iD.osmNode({loc: [0, 0]}),
            way1   = iD.osmWay({nodes: [node.id]}),
            way2   = iD.osmWay({nodes: [node.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way1.id, way2.id], delta, projection)(iD.coreGraph([node, way1, way2])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it('moves leaf nodes of a relation', function() {
        var node     = iD.osmNode({loc: [0, 0]}),
            way      = iD.osmWay({nodes: [node.id]}),
            relation = iD.osmRelation({members: [{id: way.id}]}),
            delta    = [2, 3],
            graph    = iD.actionMove([relation.id], delta, projection)(iD.coreGraph([node, way, relation])),
            loc      = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it('limits delta when movedPath and unmovedPath intersect twice', function() {
        // Use a simple planar projection so we can reason about intersections in 2D.
        var planar = function(p) { return p; };
        planar.invert = function(p) { return p; };

        // moved way is a single segment (b -> d)
        var b = iD.osmNode({ loc: [0, 0] });
        var d = iD.osmNode({ loc: [10, 0] });
        var moved = iD.osmWay({ nodes: [b.id, d.id] });

        // Unmoved zigzag way contains b as an interior node.
        // With tryDelta [5,5], the moved segment becomes y=5 from x=5..15.
        // That segment intersects the zigzag in two places: at (5,5) and (10,5).
        var u0 = iD.osmNode({ loc: [-10, 10] });
        var u1 = iD.osmNode({ loc: [10, 10] });
        var u2 = iD.osmNode({ loc: [10, 0] });
        var zigzag = iD.osmWay({ nodes: [u0.id, b.id, u1.id, u2.id] });

        // Unmoved vertical way contains d as an interior node.
        // With tryDelta [5,5], the moved endpoint would cross this way, so x movement should be limited.
        var v0 = iD.osmNode({ loc: [10, -10] });
        var v1 = iD.osmNode({ loc: [10, 10] });
        var vertical = iD.osmWay({ nodes: [v0.id, d.id, v1.id] });

        var graph = iD.coreGraph([
            b, d, moved,
            u0, u1, u2, zigzag,
            v0, v1, vertical
        ]);

        // Explicitly verify the scenario: with the attempted delta, the moved segment
        // intersects the unmoved zigzag in exactly two points.
        var movedPath = [b.loc, d.loc].map(function(p) { return [p[0] + 5, p[1] + 5]; });
        var zigzagPath = [u0.loc, b.loc, u1.loc, u2.loc];
        var hits = iD.geoPathIntersections(movedPath, zigzagPath);
        expect(hits).to.have.lengthOf(2);
        hits.sort(function(a, b) { return a[0] - b[0]; });
        expect(hits[0][0]).to.be.closeTo(5, 1e-6);
        expect(hits[0][1]).to.be.closeTo(5, 1e-6);
        expect(hits[1][0]).to.be.closeTo(10, 1e-6);
        expect(hits[1][1]).to.be.closeTo(5, 1e-6);

        var action = iD.actionMove([moved.id], [5, 5], planar);
        var result = action(graph);

        var limited = action.delta();
        expect(limited[0]).to.be.closeTo(0, 1e-6);
        expect(limited[1]).to.be.closeTo(5, 1e-6);

        expect(result.entity(d.id).loc[0]).to.be.closeTo(10, 1e-6);
        expect(result.entity(d.id).loc[1]).to.be.closeTo(5, 1e-6);
    });
});