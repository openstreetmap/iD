describe('iD.actionDeleteWay', function() {
    it('removes the way from the graph', function() {
        var way    = new iD.osmWay(),
            action = iD.actionDeleteWay(way.id),
            graph  = new iD.coreGraph([way]).update(action);
        expect(graph.hasEntity(way.id)).toBeUndefined();
    });

    it('removes a way from parent relations', function() {
        var way      = new iD.osmWay(),
            relation = new iD.osmRelation({members: [{ id: way.id }, { id: 'w-99' }]}),
            action   = iD.actionDeleteWay(way.id),
            graph    = new iD.coreGraph([way, relation]).update(action),
            ids      = graph.entity(relation.id).members.map(function (m) { return m.id; });
        expect(ids).not.to.contain(way.id);
    });

    it('deletes member nodes not referenced by another parent', function() {
        var node   = new iD.osmNode(),
            way    = new iD.osmWay({nodes: [node.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = new iD.coreGraph([node, way]).update(action);
        expect(graph.hasEntity(node.id)).toBeUndefined();
    });

    it('does not delete member nodes referenced by another parent', function() {
        var node   = new iD.osmNode(),
            way1   = new iD.osmWay({nodes: [node.id]}),
            way2   = new iD.osmWay({nodes: [node.id]}),
            action = iD.actionDeleteWay(way1.id),
            graph  = new iD.coreGraph([node, way1, way2]).update(action);
        expect(graph.hasEntity(node.id)).toBeDefined();
    });

    it('deletes multiple member nodes', function() {
        var a      = new iD.osmNode(),
            b      = new iD.osmNode(),
            way    = new iD.osmWay({nodes: [a.id, b.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = new iD.coreGraph([a, b, way]).update(action);
        expect(graph.hasEntity(a.id)).toBeUndefined();
        expect(graph.hasEntity(b.id)).toBeUndefined();
    });

    it('deletes a circular way\'s start/end node', function() {
        var a      = new iD.osmNode(),
            b      = new iD.osmNode(),
            c      = new iD.osmNode(),
            way    = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = new iD.coreGraph([a, b, c, way]).update(action);
        expect(graph.hasEntity(a.id)).toBeUndefined();
        expect(graph.hasEntity(b.id)).toBeUndefined();
        expect(graph.hasEntity(c.id)).toBeUndefined();
    });

    it('does not delete member nodes with interesting tags', function() {
        var node   = new iD.osmNode({tags: {highway: 'traffic_signals'}}),
            way    = new iD.osmWay({nodes: [node.id]}),
            action = iD.actionDeleteWay(way.id),
            graph  = new iD.coreGraph([node, way]).update(action);
        expect(graph.hasEntity(node.id)).toBeDefined();
    });

    it('deletes parent relations that become empty', function () {
        var way      = new iD.osmWay(),
            relation = new iD.osmRelation({members: [{ id: way.id }]}),
            action   = iD.actionDeleteWay(way.id),
            graph    = new iD.coreGraph([way, relation]).update(action);
        expect(graph.hasEntity(relation.id)).toBeUndefined();
    });

    // This was moved to operationDelete.  We should test operations and move this test there.
    // describe('#disabled', function () {
    //     it('returns \'part_of_relation\' for members of route and boundary relations', function () {
    //         var a        = new iD.osmWay({id: 'a'}),
    //             b        = new iD.osmWay({id: 'b'}),
    //             route    = new iD.osmRelation({members: [{id: 'a'}], tags: {type: 'route'}}),
    //             boundary = new iD.osmRelation({members: [{id: 'b'}], tags: {type: 'boundary'}}),
    //             graph    = new iD.coreGraph([a, b, route, boundary]);
    //         expect(iD.actionDeleteWay('a').disabled(graph)).to.equal('part_of_relation');
    //         expect(iD.actionDeleteWay('b').disabled(graph)).to.equal('part_of_relation');
    //     });

    //     it('returns \'part_of_relation\' for outer members of multipolygons', function () {
    //         var way      = new iD.osmWay({id: 'w'}),
    //             relation = new iD.osmRelation({members: [{id: 'w', role: 'outer'}], tags: {type: 'multipolygon'}}),
    //             graph    = new iD.coreGraph([way, relation]),
    //             action   = iD.actionDeleteWay(way.id);
    //         expect(action.disabled(graph)).to.equal('part_of_relation');
    //     });

    //     it('returns falsy for inner members of multipolygons', function () {
    //         var way      = new iD.osmWay({id: 'w'}),
    //             relation = new iD.osmRelation({members: [{id: 'w', role: 'inner'}], tags: {type: 'multipolygon'}}),
    //             graph    = new iD.coreGraph([way, relation]),
    //             action   = iD.actionDeleteWay(way.id);
    //         expect(action.disabled(graph)).not.ok;
    //     });
    // });
});
