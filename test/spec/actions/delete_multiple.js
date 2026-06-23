describe('iD.actionDeleteMultiple', function () {
    it('deletes multiple entities of heterogeneous types', function () {
        var n      = new iD.osmNode(),
            w      = new iD.osmWay(),
            r      = new iD.osmRelation(),
            action = iD.actionDeleteMultiple([n.id, w.id, r.id]),
            graph  = action(new iD.coreGraph([n, w, r]));
        expect(graph.hasEntity(n.id)).to.be.undefined;
        expect(graph.hasEntity(w.id)).to.be.undefined;
        expect(graph.hasEntity(r.id)).to.be.undefined;
    });

    it('deletes a way and one of its nodes', function () {
        var n      = new iD.osmNode(),
            w      = new iD.osmWay({nodes: [n.id]}),
            action = iD.actionDeleteMultiple([w.id, n.id]),
            graph  = action(new iD.coreGraph([n, w]));
        expect(graph.hasEntity(w.id)).to.be.undefined;
        expect(graph.hasEntity(n.id)).to.be.undefined;
    });

    // This was moved to operationDelete.  We should test operations and move this test there.
    // describe('#disabled', function () {
    //     it('returns the result of the first action that is disabled', function () {
    //         var node     = new iD.osmNode(),
    //             relation = new iD.osmRelation({members: [{id: 'w'}]}),
    //             graph    = new iD.coreGraph([node, relation]),
    //             action   = iD.actionDeleteMultiple([node.id, relation.id]);
    //         expect(action.disabled(graph)).to.equal('incomplete_relation');
    //     });
    // });
});
