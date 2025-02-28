describe('iD.actionDeleteRelation', function () {
    it('removes the relation from the graph', function () {
        const relation = iD.osmRelation(),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([relation]));
        expect(graph.hasEntity(relation.id)).to.be.undefined;
    });

    it('removes the relation from parent relations', function () {
        const a      = iD.osmRelation(),
            b      = iD.osmRelation(),
            parent = iD.osmRelation({members: [{ id: a.id }, { id: b.id }]}),
            action = iD.actionDeleteRelation(a.id),
            graph  = action(iD.coreGraph([a, b, parent]));
        expect(graph.entity(parent.id).members).to.eql([{ id: b.id }]);
    });

    it('deletes member nodes not referenced by another parent', function() {
        const node     = iD.osmNode(),
            relation = iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([node, relation]));
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it('does not delete member nodes referenced by another parent', function() {
        const node     = iD.osmNode(),
            way      = iD.osmWay({nodes: [node.id]}),
            relation = iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([node, way, relation]));
        expect(graph.hasEntity(node.id)).not.to.be.undefined;
    });

    it('does not delete member nodes with interesting tags', function() {
        const node     = iD.osmNode({tags: {highway: 'traffic_signals'}}),
            relation = iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([node, relation]));
        expect(graph.hasEntity(node.id)).not.to.be.undefined;
    });

    it('deletes member ways not referenced by another parent', function() {
        const way      = iD.osmWay(),
            relation = iD.osmRelation({members: [{id: way.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([way, relation]));
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it('does not delete member ways referenced by another parent', function() {
        const way       = iD.osmWay(),
            relation1 = iD.osmRelation({members: [{id: way.id}]}),
            relation2 = iD.osmRelation({members: [{id: way.id}]}),
            action    = iD.actionDeleteRelation(relation1.id),
            graph     = action(iD.coreGraph([way, relation1, relation2]));
        expect(graph.hasEntity(way.id)).not.to.be.undefined;
    });

    it('does not delete member ways with interesting tags', function() {
        const way      = iD.osmNode({tags: {highway: 'residential'}}),
            relation = iD.osmRelation({members: [{id: way.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([way, relation]));
        expect(graph.hasEntity(way.id)).not.to.be.undefined;
    });

    it('deletes nodes of deleted member ways', function() {
        const node     = iD.osmNode(),
            way      = iD.osmWay({nodes: [node.id]}),
            relation = iD.osmRelation({members: [{id: way.id}]}),
            action   = iD.actionDeleteRelation(relation.id),
            graph    = action(iD.coreGraph([node, way, relation]));
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it('deletes parent relations that become empty', function () {
        const child  = iD.osmRelation(),
            parent = iD.osmRelation({members: [{ id: child.id }]}),
            action = iD.actionDeleteRelation(child.id),
            graph  = action(iD.coreGraph([child, parent]));
        expect(graph.hasEntity(parent.id)).to.be.undefined;
    });

    // This was moved to operationDelete.  We should test operations and move this test there.
    // describe('#disabled', function() {
    //     it('returns \'incomplete_relation\' if the relation is incomplete', function() {
    //         var relation = iD.osmRelation({members: [{id: 'w'}]}),
    //             graph    = iD.coreGraph([relation]),
    //             action   = iD.actionDeleteRelation(relation.id);
    //         expect(action.disabled(graph)).to.equal('incomplete_relation');
    //     });
    // });
});
