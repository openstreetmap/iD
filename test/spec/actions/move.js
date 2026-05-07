describe('iD.actionMove', function() {
    var projection = d3.geoMercator().scale(250 / Math.PI);

    // This was moved to operationMove.  We should test operations and move this test there.
    // describe('#disabled', function() {
    //     it('returns falsy by default', function() {
    //         var node  = new iD.osmNode({loc: [0, 0]}),
    //             action = iD.actionMove([node.id], [0, 0], projection),
    //             graph = new iD.coreGraph([node]);
    //         expect(action.disabled(graph)).toBeFalsy();
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
    //         expect(action.disabled(graph)).toBeFalsy();
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
        expect(loc1[0]).toBeCloseTo( 1.440, 3);
        expect(loc1[1]).toBeCloseTo(-2.159, 3);
        expect(loc2[0]).toBeCloseTo( 6.440, 3);
        expect(loc2[1]).toBeCloseTo( 7.866, 3);
    });

    it('moves repeated nodes only once', function() {
        var node   = new iD.osmNode({loc: [0, 0]}),
            way    = new iD.osmWay({nodes: [node.id, node.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way.id], delta, projection)(new iD.coreGraph([node, way])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).toBeCloseTo( 1.440, 3);
        expect(loc[1]).toBeCloseTo(-2.159, 3);
    });

    it('moves multiple ways', function() {
        var node   = new iD.osmNode({loc: [0, 0]}),
            way1   = new iD.osmWay({nodes: [node.id]}),
            way2   = new iD.osmWay({nodes: [node.id]}),
            delta  = [2, 3],
            graph  = iD.actionMove([way1.id, way2.id], delta, projection)(new iD.coreGraph([node, way1, way2])),
            loc    = graph.entity(node.id).loc;
        expect(loc[0]).toBeCloseTo( 1.440, 3);
        expect(loc[1]).toBeCloseTo(-2.159, 3);
    });

    it('moves leaf nodes of a relation', function() {
        var node     = new iD.osmNode({loc: [0, 0]}),
            way      = new iD.osmWay({nodes: [node.id]}),
            relation = new iD.osmRelation({members: [{id: way.id}]}),
            delta    = [2, 3],
            graph    = iD.actionMove([relation.id], delta, projection)(new iD.coreGraph([node, way, relation])),
            loc      = graph.entity(node.id).loc;
        expect(loc[0]).toBeCloseTo( 1.440, 3);
        expect(loc[1]).toBeCloseTo(-2.159, 3);
    });
});
