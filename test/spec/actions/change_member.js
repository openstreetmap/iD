describe('iD.actionChangeMember', function () {
    it('updates the member at the specified index', function () {
        var node     = new iD.osmNode(),
            relation = new iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionChangeMember(relation.id, {id: node.id, role: 'node'}, 0),
            graph    = action(new iD.coreGraph([node, relation]));
        expect(graph.entity(relation.id).members).to.eql([{id: node.id, role: 'node'}]);
    });
});
