describe('iD.actionChangeMember', function () {
    it('updates the member at the specified index', function () {
        var node     = iD.osmNode(),
            relation = iD.osmRelation({members: [{id: node.id}]}),
            action   = iD.actionChangeMember(relation.id, {id: node.id, role: 'node'}, 0),
            graph    = action(iD.coreGraph([node, relation]));
        expect(graph.entity(relation.id).members).to.eql([{id: node.id, role: 'node'}]);
    });
});
