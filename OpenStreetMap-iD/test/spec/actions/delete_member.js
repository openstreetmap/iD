describe('iD.actionDeleteMember', function () {
    it('removes the member at the specified index', function () {
        var a      = iD.osmNode({id: 'a'}),
            b      = iD.osmNode({id: 'b'}),
            r      = iD.osmRelation({members: [{id: 'a'}, {id: 'b'}]}),
            action = iD.actionDeleteMember(r.id, 0),
            graph  = action(iD.coreGraph([a, b, r]));
        expect(graph.entity(r.id).members).to.eql([{id: 'b'}]);
    });

    it('deletes relations that become degenerate', function () {
        var a      = iD.osmNode({id: 'a'}),
            r      = iD.osmRelation({id: 'r', members: [{id: 'a'}]}),
            action = iD.actionDeleteMember(r.id, 0),
            graph  = action(iD.coreGraph([a, r]));
        expect(graph.hasEntity('r')).to.be.undefined;
    });
});
