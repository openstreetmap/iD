describe("iD.actions.DeleteMember", function () {
    it("removes the member at the specified index", function () {
        var a      = iD.Node({id: 'a'}),
            b      = iD.Node({id: 'b'}),
            r      = iD.Relation({members: [{id: 'a'}, {id: 'b'}]}),
            action = iD.actions.DeleteMember(r.id, 0),
            graph  = action(iD.Graph([a, b, r]));
        expect(graph.entity(r.id).members).to.eql([{id: 'b'}]);
    });

    it("deletes relations that become degenerate", function () {
        var a      = iD.Node({id: 'a'}),
            r      = iD.Relation({id: 'r', members: [{id: 'a'}]}),
            action = iD.actions.DeleteMember(r.id, 0),
            graph  = action(iD.Graph([a, r]));
        expect(graph.hasEntity('r')).to.be.undefined;
    });
});
