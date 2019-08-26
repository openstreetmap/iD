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
});
