describe('iD.actionDeleteRelation', function () {
    it('removes the relation from the graph', function () {
        var relation = new iD.osmRelation(),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([relation]));
        expect(graph.hasEntity(relation.id)).to.be.undefined;
    });

    it('removes the relation from parent relations', function () {
        var a      = new iD.osmRelation(),
            b      = new iD.osmRelation(),
            parent = new iD.osmRelation({members: [{ id: a.id }, { id: b.id }]}),
            action = iD.actionDeleteRelation(a.id),
            graph  = action(new iD.coreGraph([a, b, parent]));
        expect(graph.entity(parent.id).members).to.eql([{ id: b.id }]);
    });

    it('deletes member nodes not referenced by another parent', function() {
        var node     = new iD.osmNode(),
            relation = new iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([node, relation]));
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it('does not delete member nodes referenced by another parent', function() {
        var node     = new iD.osmNode(),
            way      = new iD.osmWay({nodes: [node.id]}),
            relation = new iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([node, way, relation]));
        expect(graph.hasEntity(node.id)).toBeDefined();
    });

    it('does not delete member nodes with interesting tags', function() {
        var node     = new iD.osmNode({tags: {highway: 'traffic_signals'}}),
            relation = new iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([node, relation]));
        expect(graph.hasEntity(node.id)).toBeDefined();
    });

    it('deletes member ways not referenced by another parent', function() {
        var way      = new iD.osmWay(),
            relation = new iD.osmRelation({members: [{id: way.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([way, relation]));
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it('does not delete member ways referenced by another parent', function() {
        var way       = new iD.osmWay(),
            relation1 = new iD.osmRelation({members: [{id: way.id}]}),
            relation2 = new iD.osmRelation({members: [{id: way.id}]}),
            action    = iD.actionDeleteRelation(relation1.id),
            graph     = action(new iD.coreGraph([way, relation1, relation2]));
        expect(graph.hasEntity(way.id)).toBeDefined();
    });

    it('does not delete member ways with interesting tags', function() {
        var way      = new iD.osmNode({tags: {highway: 'residential'}}),
            relation = new iD.osmRelation({members: [{id: way.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([way, relation]));
        expect(graph.hasEntity(way.id)).toBeDefined();
    });

    it('deletes nodes of deleted member ways', function() {
        var node     = new iD.osmNode(),
            way      = new iD.osmWay({nodes: [node.id]}),
            relation = new iD.osmRelation({members: [{id: way.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(new iD.coreGraph([node, way, relation]));
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it('deletes parent relations that become empty', function () {
        var child  = new iD.osmRelation(),
            parent = new iD.osmRelation({members: [{ id: child.id }]}),
            action = iD.actionDeleteRelation(child.id),
            graph  = action(new iD.coreGraph([child, parent]));
        expect(graph.hasEntity(parent.id)).to.be.undefined;
    });

    // This was moved to operationDelete.  We should test operations and move this test there.
    // describe('#disabled', function() {
    //     it('returns \'incomplete_relation\' if the relation is incomplete', function() {
    //         var relation = new iD.osmRelation({members: [{id: 'w'}]}),
    //             graph    = new iD.coreGraph([relation]),
    //             action   = iD.actionDeleteRelation(relation.id);
    //         expect(action.disabled(graph)).to.equal('incomplete_relation');
    //     });
    // });
});
