describe('iD.actionDeleteWay', function() {
    it('removes the way from the graph', function() {
        var way    = iD.osmWay(),
            action = iD.actionDeleteWay(way.id),
            graph  = iD.coreGraph([way]).update(action);
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it('removes a way from parent relations', function() {
        var way      = iD.osmWay(),
            relation = iD.osmRelation({members: [{ id: way.id }, { id: 'w-2' }]}),
            action   = iD.actionDeleteWay(way.id),
            graph    = iD.coreGraph([way, relation]).update(action),
            ids      = graph.entity(relation.id).members.map(function (m) { return m.id; });
        expect(ids).not.to.contain(way.id);
    });

    it('deletes member nodes not referenced by another parent', function() {
        var node   = iD.osmNode(),
            way    = iD.osmWay({nodes: [node.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = iD.coreGraph([node, way]).update(action);
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it('does not delete member nodes referenced by another parent', function() {
        var node   = iD.osmNode(),
            way1   = iD.osmWay({nodes: [node.id]}),
            way2   = iD.osmWay({nodes: [node.id]}),
            action = iD.actionDeleteWay(way1.id),
            graph  = iD.coreGraph([node, way1, way2]).update(action);
        expect(graph.hasEntity(node.id)).not.to.be.undefined;
    });

    it('deletes multiple member nodes', function() {
        var a      = iD.osmNode(),
            b      = iD.osmNode(),
            way    = iD.osmWay({nodes: [a.id, b.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = iD.coreGraph([a, b, way]).update(action);
        expect(graph.hasEntity(a.id)).to.be.undefined;
        expect(graph.hasEntity(b.id)).to.be.undefined;
    });

    it('deletes a circular way\'s start/end node', function() {
        var a      = iD.osmNode(),
            b      = iD.osmNode(),
            c      = iD.osmNode(),
            way    = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = iD.coreGraph([a, b, c, way]).update(action);
        expect(graph.hasEntity(a.id)).to.be.undefined;
        expect(graph.hasEntity(b.id)).to.be.undefined;
        expect(graph.hasEntity(c.id)).to.be.undefined;
    });

    it('does not delete member nodes with interesting tags', function() {
        var node   = iD.osmNode({tags: {highway: 'traffic_signals'}}),
            way    = iD.osmWay({nodes: [node.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = iD.coreGraph([node, way]).update(action);
        expect(graph.hasEntity(node.id)).not.to.be.undefined;
    });

    it('deletes parent relations that become empty', function () {
        var way      = iD.osmWay(),
            relation = iD.osmRelation({members: [{ id: way.id }]}),
            action   = iD.actionDeleteWay(way.id),
            graph    = iD.coreGraph([way, relation]).update(action);
        expect(graph.hasEntity(relation.id)).to.be.undefined;
    });

    // This was moved to operationDelete.  We should test operations and move this test there.
    // describe('#disabled', function () {
    //     it('returns \'part_of_relation\' for members of route and boundary relations', function () {
    //         var a        = iD.osmWay({id: 'a'}),
    //             b        = iD.osmWay({id: 'b'}),
    //             route    = iD.osmRelation({members: [{id: 'a'}], tags: {type: 'route'}}),
    //             boundary = iD.osmRelation({members: [{id: 'b'}], tags: {type: 'boundary'}}),
    //             graph    = iD.coreGraph([a, b, route, boundary]);
    //         expect(iD.actionDeleteWay('a').disabled(graph)).to.equal('part_of_relation');
    //         expect(iD.actionDeleteWay('b').disabled(graph)).to.equal('part_of_relation');
    //     });

    //     it('returns \'part_of_relation\' for outer members of multipolygons', function () {
    //         var way      = iD.osmWay({id: 'w'}),
    //             relation = iD.osmRelation({members: [{id: 'w', role: 'outer'}], tags: {type: 'multipolygon'}}),
    //             graph    = iD.coreGraph([way, relation]),
    //             action   = iD.actionDeleteWay(way.id);
    //         expect(action.disabled(graph)).to.equal('part_of_relation');
    //     });

    //     it('returns falsy for inner members of multipolygons', function () {
    //         var way      = iD.osmWay({id: 'w'}),
    //             relation = iD.osmRelation({members: [{id: 'w', role: 'inner'}], tags: {type: 'multipolygon'}}),
    //             graph    = iD.coreGraph([way, relation]),
    //             action   = iD.actionDeleteWay(way.id);
    //         expect(action.disabled(graph)).not.ok;
    //     });
    // });
});
