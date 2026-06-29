describe('iD.actionMove', function() {
    var projection = d3.geoMercator().scale(250 / Math.PI);

    // This was moved to operationMove.  We should test operations and move this test there.
    // describe('#disabled', function() {
    //     it('returns falsy by default', function() {
    //         var node  = new iD.osmNode({loc: [0, 0]}),
    //             action = iD.actionMove([node.id], [0, 0], projection),
    //             graph = new iD.coreGraph([node]);
    //         expect(action.disabled(graph)).not.to.be.ok;
    //     });

    //     it('returns \'incomplete_relation\' for an incomplete relation', function() {
    //         var relation = new iD.osmRelation({members: [{id: 1}]}),
    //             action = iD.actionMove([relation.id], [0, 0], projection),
    //             graph = new iD.coreGraph([relation]);
    //         expect(action.disabled(graph)).to.equal('incomplete_relation');
    //     });

    //     it('returns falsy for a complete relation', function() {
    //         var node  = new iD.osmNode({loc: [0, 0]}),
    //             relation = new iD.osmRelation({members: [{id: node.id}]}),
    //             action = iD.actionMove([relation.id], [0, 0], projection),
    //             graph = new iD.coreGraph([node, relation]);
    //         expect(action.disabled(graph)).not.to.be.ok;
    //     });
    // });

    it('moves all nodes in a way by the given amount', function() {
        var node1  = new iD.osmNode({loc: [0, 0]}),
            node2  = new iD.osmNode({loc: [5, 10]}),
            way    = new iD.osmWay({nodes: [node1.id, node2.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way.id], delta, projection)(new iD.coreGraph([node1, node2, way])),
            loc1   = graph.entity(node1.id).loc,
            loc2   = graph.entity(node2.id).loc;
        expect(loc1[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc1[1]).to.be.closeTo(-2.159, 0.001);
        expect(loc2[0]).to.be.closeTo( 6.440, 0.001);
        expect(loc2[1]).to.be.closeTo( 7.866, 0.001);
    });

    it('moves repeated nodes only once', function() {
        var node   = new iD.osmNode({loc: [0, 0]}),
            way    = new iD.osmWay({nodes: [node.id, node.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way.id], delta, projection)(new iD.coreGraph([node, way])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it('moves multiple ways', function() {
        var node   = new iD.osmNode({loc: [0, 0]}),
            way1   = new iD.osmWay({nodes: [node.id]}),
            way2   = new iD.osmWay({nodes: [node.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way1.id, way2.id], delta, projection)(new iD.coreGraph([node, way1, way2])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it('moves leaf nodes of a relation', function() {
        var node     = new iD.osmNode({loc: [0, 0]}),
            way      = new iD.osmWay({nodes: [node.id]}),
            relation = new iD.osmRelation({members: [{id: way.id}]}),
            delta    = [2, 3],
            graph    = iD.actionMove([relation.id], delta, projection)(new iD.coreGraph([node, way, relation])),
            loc      = graph.entity(node.id).loc;
        expect(loc[0]).to.be.closeTo( 1.440, 0.001);
        expect(loc[1]).to.be.closeTo(-2.159, 0.001);
    });

    it('prevents intersections', function() {
        const epsilon = 1E-6;
        // Use a simple planar projection so we can reason about intersections in 2D.
        const planar = p => p;
        planar.invert = p => p;

        // u3 ------------- u2
        //                  |
        //          d       |
        //          |       |
        // u0 ----- b ----- u1

        const b = new iD.osmNode({ loc: [0, 0] });
        const d = new iD.osmNode({ loc: [0, 8] });
        const moved = new iD.osmWay({ nodes: [b.id, d.id] });

        const u0 = new iD.osmNode({ loc: [-10,  0] });
        const u1 = new iD.osmNode({ loc: [ 10,  0] });
        const u2 = new iD.osmNode({ loc: [ 10, 10] });
        const u3 = new iD.osmNode({ loc: [-10, 10] });
        const unmoved = new iD.osmWay({ nodes: [u0.id, b.id, u1.id, u2.id, u3.id] });

        const graph = new iD.coreGraph([
            b, d, moved,
            u0, u1, u2, u3, unmoved
        ]);

        function tryDelta(delta, expectedDelta) {
            const action = iD.actionMove([moved.id], delta, planar);
            const result = action(graph);

            const limitedDelta = action.delta();

            expect(limitedDelta[0]).to.be.closeTo(expectedDelta[0], epsilon);
            expect(limitedDelta[1]).to.be.closeTo(expectedDelta[1], epsilon);

            expect(result.entity(d.id).loc[0]).to.be.closeTo(
                graph.entity(d.id).loc[0] + expectedDelta[0], epsilon);
            expect(result.entity(d.id).loc[1]).to.be.closeTo(
                graph.entity(d.id).loc[1] + expectedDelta[1], epsilon);
        }

        // small movement: no clamping necessary
        tryDelta([0, 1], [0, 1]);
        // small movement, but would intersect other part of unmoved way:
        // stay snapped to original segment
        tryDelta([0, 3], [0, 0]);
        // larger movement: snap to top segment of unmoved way
        tryDelta([0, 6], [0, 10]);
        // large movement: move beyond top segment
        tryDelta([0, 12], [0, 12]);
        // movement perpendicular: no restrictions
        tryDelta([6, 0], [6, 0]);
    });
});
