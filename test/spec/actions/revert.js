describe('iD.actions.Revert', function() {
    it('reverts an entity', function() {
        var n1 = iD.Node({id: 'n' }),
            n2 = n1.update({}),
            graph = iD.Graph([n1]).replace(n2);

        expect(graph.entity('n')).to.equal(n2);
        graph = iD.actions.Revert(n2)(graph)
        expect(graph.entity('n')).to.equal(n1);
    });
});
