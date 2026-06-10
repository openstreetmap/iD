describe('iD.actionDeleteMember', function () {
    it('removes the member at the specified index', function () {
        var a      = new iD.osmNode({id: 'a'}),
            b      = new iD.osmNode({id: 'b'}),
            r      = new iD.osmRelation({members: [{id: 'a'}, {id: 'b'}]}),
            action = iD.actionDeleteMember(r.id, 0),
            graph  = action(new iD.coreGraph([a, b, r]));
        expect(graph.entity(r.id).members).to.eql([{id: 'b'}]);
    });

    it('deletes relations that become degenerate', function () {
        var a      = new iD.osmNode({id: 'a'}),
            r      = new iD.osmRelation({id: 'r', members: [{id: 'a'}]}),
            action = iD.actionDeleteMember(r.id, 0),
            graph  = action(new iD.coreGraph([a, r]));
        expect(graph.hasEntity('r')).to.be.undefined;
    });
});
